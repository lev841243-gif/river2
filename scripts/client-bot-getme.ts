/**
 * Фаза 0, шаг 1: проверить, что CLIENT_BOT_TOKEN на месте и рабочий.
 *
 * Печатает ТОЛЬКО безопасное: есть ли переменная и что вернул getMe
 * (id и @username бота). Само значение токена не выводится никогда —
 * секрет не должен попасть ни в консоль, ни в переписку.
 *
 * Запуск: npx tsx scripts/client-bot-getme.ts
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function main() {
  const token = process.env.CLIENT_BOT_TOKEN
  if (!token) {
    console.error('❌ CLIENT_BOT_TOKEN не найден в .env')
    process.exit(1)
  }
  console.log(`✓ CLIENT_BOT_TOKEN найден (длина ${token.length}, значение не печатаю)`)

  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`)
  const data = (await res.json()) as {
    ok: boolean
    result?: { id: number; username?: string; first_name?: string }
    description?: string
  }

  if (!data.ok) {
    console.error('❌ Telegram отклонил токен:', data.description)
    process.exit(1)
  }

  console.log('✓ Токен рабочий. Бот:')
  console.log(`   id:       ${data.result?.id}`)
  console.log(`   username: @${data.result?.username}`)
  console.log(`   name:     ${data.result?.first_name}`)
  console.log(`\nОткрой @${data.result?.username} в Telegram и нажми «Старт» (или пришли любое сообщение) — дальше проверим фото.`)
}

main().catch((e) => {
  console.error('Ошибка:', e)
  process.exit(1)
})
