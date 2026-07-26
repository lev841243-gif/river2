'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { actorLabel, requireAdmin } from '@/lib/auth'
import { redeemCertificate } from '@/lib/certificate/service'

export interface RedeemState {
  error?: string
  ok?: string
}

/**
 * Погашение сертификата со страницы /check.
 *
 * requireAdmin() — здесь, а не только в разметке: server action это открытая
 * HTTP-ручка. Кнопку «Погасить» видит лишь залогиненный менеджер, но без этой
 * проверки погасить чужой сертификат мог бы любой, кто отправит запрос напрямую.
 * requireAdmin редиректит гостя на /admin/login — то есть погасить может только
 * менеджер, наведя телефон на QR и войдя в панель.
 */
export async function redeemAction(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const admin = await requireAdmin()

  const parsed = z.object({ number: z.string().min(1) }).safeParse({
    number: formData.get('number'),
  })
  if (!parsed.success) return { error: 'Некорректный номер' }

  const res = await redeemCertificate(parsed.data.number, actorLabel(admin))

  if (!res.ok) {
    const why: Record<string, string> = {
      not_found: 'Сертификат не найден',
      already_redeemed: 'Сертификат уже был погашен',
    }
    return { error: why[res.reason] ?? 'Не вышло' }
  }

  revalidatePath(`/check/${parsed.data.number}`)
  return { ok: 'Сертификат погашён' }
}
