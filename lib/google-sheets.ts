/**
 * Дозапись подтверждённых броней в Google Sheets (ТЗ, п. 6.5).
 *
 * Без библиотеки googleapis: она весит десятки мегабайт, а нам нужен ровно
 * один вызов — append. Сервисный аккаунт авторизуется подписанным JWT, а
 * подписать RS256 умеет штатный crypto.
 *
 * Таблица — зеркало для отчётности, а не хранилище: источник правды остаётся
 * БД. Поэтому сбой записи в таблицу не должен ронять бронь.
 */

import { createSign } from 'node:crypto'
import { SHEET_COLUMNS, toSheetRow, type AnalyticsRecord } from '@/lib/analytics'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

export function googleSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID,
  )
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Ключ из переменной окружения приходит с экранированными переносами:
 * в .env настоящий перенос строки не записать. Без развёртки crypto его не примет.
 */
function privateKey(): string {
  return (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
}

/** JWT сервисного аккаунта: заголовок.полезная-нагрузка.подпись, RS256. */
export function buildJwt(email: string, key: string, now = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  )
  const unsigned = `${header}.${claims}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key)
  return `${unsigned}.${base64url(signature)}`
}

/** Токены живут час — держим в памяти, чтобы не ходить за новым на каждую бронь. */
let cachedToken: { value: string; expiresAt: number } | null = null

async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value

  const jwt = buildJwt(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!, privateKey())
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const data = (await res.json()) as { access_token?: string; error_description?: string }
  if (!data.access_token) {
    throw new Error(`Google auth: ${data.error_description ?? 'нет токена'}`)
  }

  // Минута форы, чтобы токен не протух между проверкой и запросом.
  cachedToken = { value: data.access_token, expiresAt: Date.now() + 3540_000 }
  return data.access_token
}

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? 'Брони'

/** Дозаписать строку в конец листа. */
export async function appendBookingRow(record: AnalyticsRecord): Promise<void> {
  const id = process.env.GOOGLE_SHEET_ID
  const token = await accessToken()

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/` +
    `${encodeURIComponent(SHEET_NAME)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [toSheetRow(record)] }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Sheets append: ${res.status} ${body.slice(0, 200)}`)
  }
}

/** Заголовки колонок — чтобы менеджер один раз подготовил лист. */
export function headerRow(): string[] {
  return SHEET_COLUMNS.map(String)
}
