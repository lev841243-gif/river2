/**
 * Сертификаты в менеджерском боте: выпуск бланка и погашение.
 *
 * Живёт поверх того же доменного ядра (`service.ts`) и транспорта менеджерского
 * бота (`lib/telegram.ts`), что и заявки, — отдельного бота под сертификаты не
 * заводим. Всё заперто на группу менеджера гардом adminChatId в вебхуке.
 */

import type { Certificate } from '@prisma/client'
import {
  adminChatId,
  answerCallback,
  callTelegram,
  escapeHtml,
  sendAdminPhoto,
} from '@/lib/telegram'
import { renderCertificate } from '@/lib/certificate/render'
import {
  findCertificate,
  issueCertificate,
  normalizeNumber,
  redeemCertificate,
} from '@/lib/certificate/service'
import { formatSpbDate, formatSpbDateTime } from '@/lib/spb-time'

/** Данные inline-кнопок. Префикс отличает действие, дальше — номер. */
export const CERT_CB = {
  issue: 'cert_issue',
  redeem: (number: string) => `cert_redeem:${number}`,
} as const

/** Мини-тип для сообщения, на кнопке которого нажали (чтобы не тащить весь Tg-тип). */
interface CbLike {
  id: string
  message?: { message_id: number }
}

// ─────────────────────────── Выпуск ───────────────────────────

/**
 * `/sert` без номера — предложить выпуск кнопкой.
 *
 * Не выпускаем сразу по команде: номер сквозной и тратится безвозвратно, а
 * промах по команде в группе — обычное дело. Один подтверждающий тап дешевле
 * «дырки» в нумерации.
 */
export async function offerIssue(): Promise<void> {
  await callTelegram('sendMessage', {
    chat_id: adminChatId(),
    text:
      '🎟 <b>Подарочный сертификат</b>\n' +
      'Прогулка на катере, 1 час.\n\n' +
      'Выпустить новый бланк?',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: '🎟 Выпустить сертификат', callback_data: CERT_CB.issue }]],
    },
  })
}

/** Выпуск: выделить номер → отрисовать бланк → прислать фото в группу. */
export async function issueAndSend(who: string): Promise<Certificate> {
  const cert = await issueCertificate(who)
  const png = await renderCertificate(cert.number)

  // Фото без подписи — чтобы менеджер переслал его покупателю как есть.
  await sendAdminPhoto(png)

  // Отдельная памятка менеджеру (её покупатель не увидит — она не на картинке).
  await callTelegram('sendMessage', {
    chat_id: adminChatId(),
    text:
      `✅ Сертификат <b>${cert.number}</b> выпущен.\n` +
      'Перешлите картинку покупателю.\n\n' +
      `Погашение: клиент наводит телефон на QR, либо команда <code>/sert ${cert.number}</code>.`,
    parse_mode: 'HTML',
  })

  return cert
}

// ─────────────────────── Статус и погашение ───────────────────────

/** HTML-карточка статуса сертификата. */
function renderCard(cert: Certificate): string {
  const lines = [`🎟 <b>Сертификат ${cert.number}</b>`, cert.title, '']
  if (cert.status === 'ISSUED') {
    lines.push('🟢 Действителен', `Выдан: ${formatSpbDate(cert.issuedAt)}`)
  } else {
    lines.push('⚪️ Погашён', `Выдан: ${formatSpbDate(cert.issuedAt)}`)
    if (cert.redeemedAt) lines.push(`Погашён: ${formatSpbDateTime(cert.redeemedAt)}`)
    if (cert.redeemedBy) lines.push(`Погасил: ${escapeHtml(cert.redeemedBy)}`)
  }
  return lines.join('\n')
}

function redeemMarkup(cert: Certificate): Record<string, unknown> | undefined {
  if (cert.status !== 'ISSUED') return undefined
  return { inline_keyboard: [[{ text: '✅ Погасить', callback_data: CERT_CB.redeem(cert.number) }]] }
}

/** `/sert <номер>` — показать карточку статуса с кнопкой «Погасить», если активен. */
export async function showStatus(rawNumber: string): Promise<void> {
  const cert = await findCertificate(rawNumber)
  if (!cert) {
    await callTelegram('sendMessage', {
      chat_id: adminChatId(),
      text: `❌ Сертификат <code>${escapeHtml(normalizeNumber(rawNumber))}</code> не найден.`,
      parse_mode: 'HTML',
    })
    return
  }

  await callTelegram('sendMessage', {
    chat_id: adminChatId(),
    text: renderCard(cert),
    parse_mode: 'HTML',
    ...(redeemMarkup(cert) ? { reply_markup: redeemMarkup(cert) } : {}),
  })
}

/** Нажата кнопка «Погасить». */
export async function redeemFromButton(cb: CbLike, number: string, who: string): Promise<void> {
  const res = await redeemCertificate(number, who)

  if (!res.ok) {
    const why = { not_found: 'Сертификат не найден', already_redeemed: 'Уже погашён' }[res.reason]
    await answerCallback(cb.id, why, true)
    if (res.certificate) await editCard(cb, res.certificate)
    return
  }

  await answerCallback(cb.id, 'Погашено ✅')
  await editCard(cb, res.certificate)
}

/** Перерисовать карточку после погашения и убрать кнопку. */
async function editCard(cb: CbLike, cert: Certificate): Promise<void> {
  if (!cb.message) return
  await callTelegram('editMessageText', {
    chat_id: adminChatId(),
    message_id: cb.message.message_id,
    text: renderCard(cert),
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [] },
  })
}
