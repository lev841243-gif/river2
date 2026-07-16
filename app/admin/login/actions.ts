'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { adminEmailSchema, setSessionCookie, verifyPassword } from '@/lib/auth'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const loginSchema = z.object({
  // Тот же разбор, что и у скрипта заведения админа — иначе можно завести
  // учётку, которой нельзя войти (см. adminEmailSchema).
  email: adminEmailSchema,
  password: z.string().min(1),
  next: z.string().optional(),
})

export interface LoginState {
  error?: string
  /**
   * Введённый email — возвращаем, чтобы подставить обратно в поле.
   *
   * React после отправки формы через `action` сбрасывает поля. Без этого при
   * любой опечатке в пароле стирался бы и email, человек дописывал бы только
   * пароль в форму с пустым логином и получал отказ снова и снова.
   * Пароль не возвращаем никогда — незачем гонять его обратно в разметку.
   */
  email?: string
}

/**
 * Вход в админку.
 *
 * Ответ на неверный логин и на неверный пароль одинаковый: разные тексты
 * подсказали бы перебору, какие email существуют.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // Сырой email — чтобы вернуть его в поле даже когда разбор не прошёл.
  const typedEmail = String(formData.get('email') ?? '')

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })
  if (!parsed.success) return { error: 'Введите email и пароль', email: typedEmail }

  // Рейт-лимит по IP: без него пароль подбирают перебором. Ограничение то же,
  // что у формы заявки, — счётчик в памяти процесса (см. lib/rate-limit.ts).
  const ip = clientIp(await headers())
  const limited = rateLimit(`admin-login:${ip}`, 10, 10 * 60_000)
  if (!limited.ok) {
    return {
      error: `Слишком много попыток. Повторите через ${Math.ceil(limited.retryAfterSeconds / 60)} мин`,
      email: typedEmail,
    }
  }

  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } })

  // Пароль сверяем даже для несуществующего email — иначе быстрый ответ
  // «нет такого» отличается по времени от медленной проверки scrypt, и по
  // задержке можно перебрать список живых адресов.
  const stored = admin?.passwordHash ?? DUMMY_HASH
  const ok = await verifyPassword(parsed.data.password, stored)

  if (!admin || !admin.isActive || !ok) {
    return { error: 'Неверный email или пароль', email: typedEmail }
  }

  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
  await setSessionCookie(admin.id)

  // Возвращаем только на внутренние адреса: «next=https://чужой.сайт» превратил
  // бы форму входа в открытый редирект для фишинга.
  const next = parsed.data.next
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin'
  redirect(safeNext)
}

/**
 * Хеш-пустышка для несуществующих админов: строка валидного формата, к которой
 * не подходит ни один пароль. Нужен только чтобы scrypt отработал столько же времени.
 */
const DUMMY_HASH =
  'scrypt$0000000000000000000000000000000000000000000000000000000000000000$' + '0'.repeat(128)
