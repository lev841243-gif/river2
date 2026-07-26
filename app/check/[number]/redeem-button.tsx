'use client'

import { useActionState } from 'react'
import { redeemAction, type RedeemState } from './actions'

/**
 * Кнопка «Погасить» на странице проверки. Видна только менеджеру (рендерится
 * лишь под залогиненным админом), но настоящая защита — requireAdmin() в самом
 * action. После успеха страница перерисовывается через revalidatePath.
 */
export function RedeemButton({ number }: { number: string }) {
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeemAction, {})

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="number" value={number} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Гашу…' : 'Погасить сертификат'}
      </button>
      {state.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
    </form>
  )
}
