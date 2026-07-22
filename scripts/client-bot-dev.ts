/**
 * Локальная отладка клиентского бота через long-polling — БЕЗ деплоя.
 *
 * Вебхук требует публичный HTTPS, которого на localhost нет. Поэтому локально
 * тянем апдейты сами (getUpdates) и скармливаем тому же ядру handleClientUpdate,
 * что и прод-вебхук. Логика одна, отличается только вход.
 *
 * ВАЖНО: пока крутится этот скрипт, у бота НЕ должно быть установленного
 * вебхука — getUpdates и вебхук взаимоисключающи (иначе Telegram отдаёт 409).
 * На новом боте вебхук ещё не ставился, так что всё чисто.
 *
 * Запуск: npx tsx scripts/client-bot-dev.ts   (Ctrl+C для остановки)
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

import { handleClientUpdate, type TgUpdate } from '../lib/client-bot/core'

const TOKEN = process.env.CLIENT_BOT_TOKEN
const API = `https://api.telegram.org/bot${TOKEN}`

async function main() {
  if (!TOKEN) {
    console.error('❌ CLIENT_BOT_TOKEN не найден в .env')
    process.exit(1)
  }

  console.log('▶ Локальный поллинг клиентского бота. Ctrl+C — стоп.\n')
  let offset = 0

  // Бесконечный цикл long-polling: Telegram держит запрос до 25с, если нет
  // апдейтов, — не крутим сеть впустую.
  for (;;) {
    let updates: TgUpdate[] = []
    try {
      const res = await fetch(`${API}/getUpdates?timeout=25&offset=${offset}`, {
        signal: AbortSignal.timeout(30_000),
      })
      const data = (await res.json()) as { ok: boolean; result?: TgUpdate[]; description?: string }
      if (!data.ok) {
        console.error('getUpdates:', data.description)
        await sleep(2000)
        continue
      }
      updates = data.result ?? []
    } catch (e) {
      console.error('сеть:', (e as Error).message)
      await sleep(2000)
      continue
    }

    for (const u of updates) {
      offset = u.update_id + 1
      const kind = u.callback_query ? `callback:${u.callback_query.data}` : `msg:${u.message?.text ?? ''}`
      console.log(`← апдейт ${u.update_id} ${kind}`)
      try {
        await handleClientUpdate(u)
      } catch (e) {
        console.error('  ошибка обработки:', e)
      }
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

main().catch((e) => {
  console.error('Фатально:', e)
  process.exit(1)
})
