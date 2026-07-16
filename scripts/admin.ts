/**
 * Заведение и обслуживание админов — из консоли, потому что регистрации в
 * панели нет и не будет: админов двое, а открытая форма регистрации на публичном
 * адресе означала бы, что аккаунт заведёт кто угодно.
 *
 *   npx tsx scripts/admin.ts add <email> <пароль> <имя>
 *   npx tsx scripts/admin.ts passwd <email> <новый пароль>
 *   npx tsx scripts/admin.ts off <email>     # отключить, не удаляя
 *   npx tsx scripts/admin.ts list
 *
 * Пароль в аргументах попадёт в историю команд — после заведения на сервере
 * стоит её почистить (history -c) или ввести команду с ведущим пробелом.
 */

import { hashPassword } from '../lib/auth'
import { prisma } from '../lib/prisma'

const MIN_PASSWORD = 12

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
        email: email.toLowerCase(),
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

  if (cmd === 'list') {
    const admins = await prisma.admin.findMany({ orderBy: { createdAt: 'asc' } })
    for (const a of admins) {
      const last = a.lastLoginAt ? a.lastLoginAt.toISOString() : 'ни разу'
      console.log(`${a.isActive ? '✓' : '✗'} ${a.email} — ${a.name}, вход: ${last}`)
    }
    if (admins.length === 0) console.log('Админов нет. Заведите: npx tsx scripts/admin.ts add ...')
    return
  }

  console.log('Команды: add | passwd | off | list')
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
