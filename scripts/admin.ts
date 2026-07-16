/**
 * Заведение и обслуживание админов — из консоли, потому что регистрации в
 * панели нет и не будет: админов двое, а открытая форма регистрации на публичном
 * адресе означала бы, что аккаунт заведёт кто угодно.
 *
 *   npx tsx scripts/admin.ts add <email> <пароль> <имя>
 *   npx tsx scripts/admin.ts passwd <email> <новый пароль>
 *   npx tsx scripts/admin.ts off <email>     # отключить, не удаляя
 *   npx tsx scripts/admin.ts rm <email>      # удалить совсем
 *   npx tsx scripts/admin.ts list
 *
 * Пароль в аргументах попадёт в историю команд — после заведения на сервере
 * стоит её почистить (history -c) или ввести команду с ведущим пробелом.
 */

import { adminEmailSchema, hashPassword } from '../lib/auth'
import { prisma } from '../lib/prisma'

const MIN_PASSWORD = 12

/**
 * Адрес проверяем тем же правилом, что и форма входа.
 *
 * Иначе скрипт заводит учётку, под которой невозможно войти: форма отбивает
 * адрес ещё до проверки пароля и говорит лишь «Введите email и пароль».
 * Так на боевом сервере появился админ с адресом `ваш@email.ru` — команду
 * скопировали с плейсхолдером, а скрипт молча согласился.
 */
function requireEmail(email: string): string {
  const r = adminEmailSchema.safeParse(email)
  if (!r.success) {
    throw new Error(
      `Не похоже на email: "${email}"\n` +
        'Нужен обычный адрес латиницей, например ivan@example.com — ' +
        'иначе под этой учёткой не выйдет войти.',
    )
  }
  return r.data
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2)

  if (cmd === 'add') {
    const [email, password, ...nameParts] = args
    const name = nameParts.join(' ')
    if (!email || !password || !name) {
      throw new Error('Нужно: add <email> <пароль> <имя>')
    }
    requireStrong(password)

    const admin = await prisma.admin.create({
      data: {
        email: requireEmail(email),
        passwordHash: await hashPassword(password),
        name,
      },
    })
    console.log(`Заведён админ: ${admin.email} (${admin.name})`)
    return
  }

  if (cmd === 'passwd') {
    const [email, password] = args
    if (!email || !password) throw new Error('Нужно: passwd <email> <новый пароль>')
    requireStrong(password)

    await prisma.admin.update({
      where: { email: email.toLowerCase() },
      data: { passwordHash: await hashPassword(password) },
    })
    console.log(`Пароль обновлён: ${email}`)
    return
  }

  if (cmd === 'off') {
    const [email] = args
    if (!email) throw new Error('Нужно: off <email>')
    // Не удаляем: в журнале статусов остались его действия, и «кто менял»
    // должно продолжать читаться.
    await prisma.admin.update({ where: { email: email.toLowerCase() }, data: { isActive: false } })
    console.log(`Отключён: ${email}`)
    return
  }

  if (cmd === 'rm') {
    const [email] = args
    if (!email) throw new Error('Нужно: rm <email>')
    // Адрес НЕ проверяем правилом формы: удалять приходится в том числе
    // криво заведённые записи, которые это правило не проходят.
    await prisma.admin.delete({ where: { email: email.toLowerCase() } })
    console.log(`Удалён: ${email}`)
    return
  }

  if (cmd === 'list') {
    const admins = await prisma.admin.findMany({ orderBy: { createdAt: 'asc' } })
    for (const a of admins) {
      const last = a.lastLoginAt ? a.lastLoginAt.toISOString() : 'ни разу'
      console.log(`${a.isActive ? '✓' : '✗'} ${a.email} — ${a.name}, вход: ${last}`)
    }
    if (admins.length === 0) console.log('Админов нет. Заведите: npx tsx scripts/admin.ts add ...')
    return
  }

  console.log('Команды: add | passwd | off | rm | list')
  process.exitCode = 1
}

function requireStrong(password: string) {
  if (password.length < MIN_PASSWORD) {
    throw new Error(`Пароль короче ${MIN_PASSWORD} символов — админка смотрит в открытый интернет`)
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
