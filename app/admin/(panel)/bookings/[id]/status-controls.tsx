'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { BookingStatus } from '@prisma/client'
import { STATUS_LABEL } from '@/lib/admin-data'
import { setStatus, type ActionState } from '../actions'

/**
 * Порядок кнопок повторяет жизненный путь заявки из ТЗ (п. 6.4):
 * Новая → На рассмотрении → Подтверждена → Завершена, и в любой момент → Отменена.
 */
const FLOW: BookingStatus[] = ['NEW', 'REVIEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

function Button({ status, current }: { status: BookingStatus; current: BookingStatus }) {
  const { pending } = useFormStatus()
  const isCurrent = status === current

  return (
    <button
      type="submit"
      name="status"
      value={status}
      disabled={pending || isCurrent}
      className={
        isCurrent
          ? 'w-full cursor-default rounded-md border border-primary/40 bg-muted px-3 py-2 text-sm'
          : 'w-full rounded-md border border-border px-3 py-2 text-sm transition hover:border-primary/40 disabled:opacity-50'
      }
    >
      {STATUS_LABEL[status]}
      {isCurrent && <span className="ml-2 text-xs text-muted-foreground">сейчас</span>}
    </button>
  )
}

export function StatusControls({ id, current }: { id: string; current: BookingStatus }) {
  const [state, formAction] = useActionState<ActionState, FormData>(setStatus, {})

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />

      {FLOW.map((s) => (
        <Button key={s} status={s} current={current} />
      ))}

      {/*
        «Занято» — рабочий ответ, а не сбой: пока менеджер думал, слот могли
        занять через бота. Показываем как есть, кнопка остаётся живой.
      */}
      {state.error && (
        <p role="alert" className="pt-1 text-sm text-amber-300">
          {state.error}
        </p>
      )}
      {state.ok && <p className="pt-1 text-sm text-emerald-300">{state.ok}</p>}

      <p className="pt-2 text-xs text-muted-foreground">
        Подтверждение занимает слот и уходит в Google Sheets. Карточка в Telegram обновится сама.
      </p>
    </form>
  )
}
