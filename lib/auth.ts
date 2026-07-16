/**
 * Авторизация админки — своя, на node:crypto.
 *
 * ТЗ предполагало Supabase Auth, но Supabase в проекте нет. Нужен ровно один
 * сценарий «email + пароль» для двух человек, поэтому вместо Auth.js (beta под
 * Next 16, чужой релиз-цикл) — сотня строк своего кода. Тот же подход, что и в
 * lib/google-sheets.ts: голый crypto вместо тяжёлой зависимости.
 *
 * Сессия — в подписанной куке, без таблицы сессий: админов двое, отзывать
 * сессии по одной некому. Разлогинить всех разом можно сменой
 * ADMIN_SESSION_SECRET — все подписи станут недействительными.
 */

import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { SESSION_COOKIE } from '@/lib/auth-cookie'
import { prisma } from '@/lib/prisma'

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>

export { SESSION_COOKIE }

/**
 * Правило email — ОДНО на форму входа и на скрипт заведения админа.
 *
 * Пока их было два, скрипт принимал любую строку, а форма входа отбивала всё,
 * что не проходит `.email()` — например, кириллицу в адресе. Админ заводился,
 * рапортовал об успехе и молча не мог войти: форма отвечала «Введите email и
 * пароль», не объясняя, что дело в самом адресе. Поймано на боевом сервере.
 */
export const adminEmailSchema = z.string().trim().toLowerCase().email()

/** Сколько живёт сессия. Неделя: менеджер не должен логиниться каждый день. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

// ─────────────────────────── Пароль ───────────────────────────

const SCRYPT_KEYLEN = 64

/**
 * Хеш пароля: `scrypt$<соль>$<хеш>`. Соль у каждого своя — одинаковые пароли
 * дают разные хеши, и радужная таблица бесполезна.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = await scryptAsync(password, salt, SCRYPT_KEYLEN)
  return `scrypt$${salt}$${key.toString('hex')}`
}

/**
 * Сверка пароля с хешем.
 *
 * Сравнение — timingSafeEqual, а не `===`: обычное сравнение строк выходит на
 * первом несовпавшем байте, и по времени ответа хеш можно подбирать побайтно.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hex] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hex) return false

  const expected = Buffer.from(hex, 'hex')
  const actual = await scryptAsync(password, salt, expected.length)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

// ─────────────────────────── Кука сессии ───────────────────────────

function sessionSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  // Падаем громко: пустой секрет означал бы, что подпись куки может подделать
  // кто угодно, а тихий фолбэк на константу — дыра, которую никто не заметит.
  if (!s || s.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET не задан или короче 32 символов')
  }
  return s
}

interface SessionPayload {
  /** id админа. */
  sub: string
  /** Срок годности, мс эпохи. */
  exp: number
}

const b64url = (b: Buffer) => b.toString('base64url')

function sign(data: string): string {
  return createHmac('sha256', sessionSecret()).update(data).digest('base64url')
}

/** `<payload>.<подпись>` — payload открыт (это не секрет), подпись держит его от подмены. */
export function createSessionToken(adminId: string): string {
  const payload: SessionPayload = { sub: adminId, exp: Date.now() + SESSION_TTL_MS }
  const body = b64url(Buffer.from(JSON.stringify(payload)))
  return `${body}.${sign(body)}`
}

export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  // Сначала подпись, потом содержимое: без этого мы бы доверяли полю exp,
  // которое любой может переписать.
  const expected = Buffer.from(sign(body))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export async function setSessionCookie(adminId: string): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, createSessionToken(adminId), {
    httpOnly: true, // недоступна из JS: XSS не утащит сессию
    secure: process.env.NODE_ENV === 'production', // на localhost нет https
    sameSite: 'lax', // защита от CSRF, но переходы по ссылкам работают
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

// ─────────────────────────── Текущий админ ───────────────────────────

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

/**
 * Кто сейчас залогинен, или null.
 *
 * Админ перечитывается из БД на каждый запрос, а не берётся из куки: иначе
 * отключённый (isActive = false) продолжал бы ходить до истечения сессии.
 */
export async function getAdmin(): Promise<AdminUser | null> {
  const jar = await cookies()
  const payload = readSessionToken(jar.get(SESSION_COOKIE)?.value)
  if (!payload) return null

  const admin = await prisma.admin.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })
  if (!admin || !admin.isActive) return null

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
}

/**
 * Требует залогиненного админа — иначе редирект на вход.
 *
 * Вызывать в КАЖДОЙ странице и КАЖДОМ server action админки, а не только в
 * layout: layout не перерисовывается при клиентской навигации, и полагаться на
 * него как на охрану нельзя. Middleware проверяет лишь наличие куки — это
 * косметика ради редиректа, настоящая проверка здесь.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  return admin
}

/** Подпись автора действия для журнала статусов — в одном формате с ботом («@ivan»). */
export function actorLabel(admin: AdminUser): string {
  return admin.name || admin.email
}
