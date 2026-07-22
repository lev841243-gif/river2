/**
 * Разовая настройка клиентского бота: меню команд.
 *
 * setMyCommands кладёт /start (и /help) в кнопку «Menu» рядом с полем ввода —
 * клиент всегда может перезапустить бота, не вспоминая команду. Настройка
 * глобальная (на весь бот), не привязана к чату; достаточно вызвать однажды.
 *
 * Токен берётся из окружения и не печатается.
 *
 * Запуск: npx tsx scripts/client-bot-setup.ts
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const TOKEN = process.env.CLIENT_BOT_TOKEN
const API = `https://api.telegram.org/bot${TOKEN}`

const COMMANDS = [
  { command: 'start', description: 'В начало — открыть каталог и перезапустить бота' },
  { command: 'help', description: 'Как пользоваться ботом' },
]

async function tg(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return (await res.json()) as { ok: boolean; description?: string }
}

async function main() {
  if (!TOKEN) {
    console.error('❌ CLIENT_BOT_TOKEN не найден в .env')
    process.exit(1)
  }

  const cmds = await tg('setMyCommands', { commands: COMMANDS })
  console.log('setMyCommands:', cmds.ok ? '✓' : `❌ ${cmds.description}`)

  // На всякий случай явно включаем кнопку «Menu» как список команд (это и так
  // поведение по умолчанию, но не полагаемся на него).
  const menu = await tg('setChatMenuButton', { menu_button: { type: 'commands' } })
  console.log('setChatMenuButton:', menu.ok ? '✓' : `❌ ${menu.description}`)

  console.log('\nГотово. В боте у поля ввода появится кнопка «Menu» с /start и /help.')
}

main().catch((e) => {
  console.error('Ошибка:', e)
  process.exit(1)
})
