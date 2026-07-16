/**
 * Заведение и обслуживание админов — из консоли, потому что регистрации в
 * панели нет и не будет: админов двое, а открытая форма регистрации на публичном
 * адресе означала бы, что аккаунт заведёт кто угодно.
 *
 *   npx tsx scripts/admin.ts add <email> <имя>
 *   npx tsx scripts/admin.ts passwd <email>
 *   npx tsx scripts/admin.ts off <email>     # отключить, не удаляя
 *   npx tsx scripts/admin.ts rm <email>      # удалить совсем
 *   npx tsx scripts/admin.ts list
 *
 * Пароль в аргументах НЕ передаётся — скрипт спрашивает его сам, скрытым
 * вводом. Причины, все три пойманы на живом запуске:
 *   1. Пароль из аргументов оседает в истории команд (~/.bash_history).
 *   2. Готовую команду копируют целиком — вместе с примером пароля внутри.
 *      Так на боевом сервере появился админ с паролем «новый-пароль».
 *   3. Пароль из переписки виден всем, кто её читает.
 */

import { createInterface } from 'node:readline'
import { adminEmailSchema, hashPassword } from '../lib/auth'
import { prisma } from '../lib/prisma'

const MIN_PASSWORD = 12

/**
 * Спросить пароль, не показывая его на экране.
 *
 * readline по умолчанию эхоит ввод, поэтому перехватываем вывод: печатаем
 * только сам вопрос, а набранное — нет. Через плечо не подсмотрят, и в логи
 * терминала пароль не попадёт.
 */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('Пароль нужно вводить с клавиатуры — запустите команду в обычной консоли.'))
      return
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })

    // Глушим вывод ПОСЛЕ того, как вопрос напечатан, а не по совпадению текста:
    // readline при каждом нажатии перерисовывает строку целиком, вместе с
    // вопросом, — и проверка «строка содержит вопрос» вывела бы пароль на экран.
    let muted = false
    ;(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (muted) process.stdout.write('*')
      else process.stdout.write(s)
    }

    rl.question(question, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
    muted = true
  })
}

/**
 * Получить новый пароль.
 *
 * Два пути. Основной — вопрос с клавиатуры. Запасной — переменная
 * ADMIN_NEW_PASSWORD: скрытый ввод readline на чужом терминале проверить
 * нечем, а bash умеет спрашивать пароль сам (`read -s`) и делает это
 * надёжно. Значение переменной в историю команд не попадает.
 *
 * Спрашиваем дважды: опечатку в невидимом вводе иначе не поймать.
 */
async function askNewPassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_NEW_PASSWORD
  if (fromEnv) {
    requireStrong(fromEnv)
    return fromEnv
  }

  const first = await askHidden('Новый пароль (не отображается): ')
  requireStrong(first)
  const again = await askHidden('Ещё раз для проверки: ')
  if (first !== again) throw new Error('Пароли не совпали — ничего не изменено.')
  return first
}

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
    const [email, ...nameParts] = args
    const name = nameParts.join(' ')
    if (!email || !name) throw new Error('Нужно: add <email> <имя>')

    // Адрес проверяем ДО вопроса про пароль: незачем заставлять набирать
    // пароль дважды, чтобы потом узнать, что адрес не годится.
    const validEmail = requireEmail(email)
    const password = await askNewPassword()

    const admin = await prisma.admin.create({
      data: { email: validEmail, passwordHash: await hashPassword(password), name },
    })
    console.log(`Заведён админ: ${admin.email} (${admin.name})`)
    return
  }

  if (cmd === 'passwd') {
    const [email] = args
    if (!email) throw new Error('Нужно: passwd <email>')

    // Проверяем, что такой админ есть, до вопроса про пароль.
    const who = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } })
    if (!who) throw new Error(`Нет такого админа: ${email}`)

    const password = await askNewPassword()
    await prisma.admin.update({
      where: { id: who.id },
      data: { passwordHash: await hashPassword(password) },
    })
    console.log(`Пароль обновлён: ${who.email}`)
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

  console.log('Команды:')
  console.log('  add <email> <имя>   — завести админа (пароль спросит отдельно)')
  console.log('  passwd <email>      — сменить пароль')
  console.log('  off <email>         — отключить, не удаляя')
  console.log('  rm <email>          — удалить совсем')
  console.log('  list                — кто заведён')
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
