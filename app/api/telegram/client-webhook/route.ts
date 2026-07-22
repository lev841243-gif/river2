import { NextResponse } from 'next/server'
import { handleClientUpdate, type TgUpdate } from '@/lib/client-bot/core'
import { clientBotConfigured } from '@/lib/client-bot/telegram'

export const dynamic = 'force-dynamic'

/**
 * Приём апдейтов клиентского бота (@neva10_booking_bot) на боевом.
 *
 * Адрес публичный, поэтому секретный заголовок — его знает только Telegram
 * (задаётся при setWebhook). Белого списка чатов тут НЕТ намеренно: бот
 * публичный и обязан отвечать любому в личке (в отличие от менеджерского).
 *
 * Локально этот роут не используется — там long-polling (scripts/client-bot-dev.ts):
 * вебхук требует публичный HTTPS, которого на localhost нет.
 */
export async function POST(req: Request) {
  if (!clientBotConfigured()) {
    return NextResponse.json({ ok: true })
  }

  const secret = process.env.CLIENT_BOT_WEBHOOK_SECRET
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    console.warn('[client-webhook] неверный секрет')
    // 200, чтобы Telegram не слал повторы; для чужого это тупик.
    return NextResponse.json({ ok: true })
  }

  let update: TgUpdate
  try {
    update = (await req.json()) as TgUpdate
  } catch {
    return NextResponse.json({ ok: true })
  }

  try {
    await handleClientUpdate(update)
  } catch (e) {
    // Не показываем ошибку Telegram: иначе повторы задублируют действие.
    console.error('[client-webhook]', e)
  }

  return NextResponse.json({ ok: true })
}
