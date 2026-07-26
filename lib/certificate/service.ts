/**
 * Подарочные сертификаты — доменные операции: выпуск, поиск, погашение.
 *
 * Одно ядро на два входа (бот и страница /check), как и у заявок: чтобы
 * «погасить» вело себя одинаково, откуда бы его ни нажали.
 */

import { Prisma, type Certificate } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { certPrefix, formatNumber, seqOf } from '@/lib/certificate/number'

/** Нормализуем ввод менеджера: регистр и пробелы. `dno25060001` → `DNO25060001`. */
export function normalizeNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Выпустить сертификат. Номер выделяется «максимум+1» в пределах месяца.
 *
 * Между чтением максимума и вставкой два менеджера теоретически могут выбрать
 * один номер — тогда `create` упрётся в `@unique` (P2002), и мы просто берём
 * следующий. Так надёжнее блокировок: том сертификатов крошечный, а гонка
 * саморазрешается за пару попыток.
 */
export async function issueCertificate(issuedBy: string): Promise<Certificate> {
  const prefix = certPrefix()

  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await prisma.certificate.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    const number = formatNumber(prefix, (last ? seqOf(last.number, prefix) : 0) + 1)

    try {
      return await prisma.certificate.create({ data: { number, issuedBy } })
    } catch (e) {
      // Только столкновение номеров стоит повторить; остальное — наружу.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
      throw e
    }
  }

  throw new Error('Не удалось выделить номер сертификата: слишком много одновременных выпусков')
}

export async function findCertificate(number: string): Promise<Certificate | null> {
  return prisma.certificate.findUnique({ where: { number: normalizeNumber(number) } })
}

export type RedeemResult =
  | { ok: true; certificate: Certificate }
  | { ok: false; reason: 'not_found' | 'already_redeemed'; certificate: Certificate | null }

/**
 * Погасить сертификат. Идемпотентность через условный `updateMany` по статусу:
 * гасим только строку, которая всё ещё `ISSUED`. Если двое нажали «Погасить»
 * разом, обновится ровно одна — второй получит `already_redeemed`, а не молча
 * «успех» на уже использованном сертификате.
 */
export async function redeemCertificate(number: string, redeemedBy: string): Promise<RedeemResult> {
  const normalized = normalizeNumber(number)

  const updated = await prisma.certificate.updateMany({
    where: { number: normalized, status: 'ISSUED' },
    data: { status: 'REDEEMED', redeemedAt: new Date(), redeemedBy },
  })

  const certificate = await prisma.certificate.findUnique({ where: { number: normalized } })
  if (!certificate) return { ok: false, reason: 'not_found', certificate: null }
  if (updated.count === 0) return { ok: false, reason: 'already_redeemed', certificate }
  return { ok: true, certificate }
}
