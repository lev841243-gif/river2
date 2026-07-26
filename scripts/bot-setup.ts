/**
 * Разовая настройка МЕНЕДЖЕРСКОГО бота: меню команд.
 *
 * setMyCommands кладёт /bron, /sert, /help в кнопку «Menu» рядом с полем ввода —
 * менеджеру не нужно помнить команды наизусть. Настройка глобальная (на весь
 * бот), не привязана к чату; достаточно вызвать однажды (и после добавления
 * новых команд). Аналог scripts/client-bot-setup.ts, но для TELEGRAM_BOT_TOKEN.
 *
 * Токен берётся из окружения и не печатается.
 *
 * Запуск: npx tsx scripts/bot-setup.ts
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API = `https://api.telegram.org/bot${TOKEN}`

const COMMANDS = [
  { command: 'start', description: 'В начало — справка и кнопки' },
  { command: 'bron', description: 'Завести бронь вручную' },
  { command: 'sert', description: 'Подарочный сертификат: выпуск и погашение' },
  { command: 'help', description: 'Как пользоваться ботом' },
]

// Прописываем команды сразу в три скоупа. default покрывает всё, но клиент
// Telegram кэширует меню по чату: без явного scope группа менеджера могла
// показывать пустое меню, пока не сбросишь кэш. all_group_chats/all_private_chats
// адресуют оба места, где бот работает, — и меню подтягивается предсказуемо.
const SCOPES: Array<Record<string, unknown> | undefined> = [
  undefined, // default
  { type: 'all_group_chats' },
  { type: 'all_private_chats' },
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
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env')
    process.exit(1)
  }

  for (const scope of SCOPES) {
    const res = await tg('setMyCommands', {
      commands: COMMANDS,
      ...(scope ? { scope } : {}),
    })
    const label = scope ? (scope.type as string) : 'default'
    console.log(`setMyCommands (${label}):`, res.ok ? '✓' : `❌ ${res.description}`)
  }

  // Кнопка «Menu» как список команд (это и так по умолчанию, но не полагаемся).
  const menu = await tg('setChatMenuButton', { menu_button: { type: 'commands' } })
  console.log('setChatMenuButton:', menu.ok ? '✓' : `❌ ${menu.description}`)

  console.log('\nГотово. В меню бота: /start, /bron, /sert, /help.')
}

main().catch((e) => {
  console.error('Ошибка:', e)
  process.exit(1)
})
