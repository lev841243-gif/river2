'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { reschedule, type ActionState } from '../actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-border px-3 py-2 text-sm transition hover:border-primary/40 disabled:opacity-50"
    >
      {pending ? 'Переносим…' : 'Перенести'}
    </button>
  )
}

export function RescheduleForm({
  id,
  date,
  time,
  hours,
}: {
  id: string
  date: string
  time: string
  hours: number
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(reschedule, {})

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Дата</label>
          <input type="date" name="date" defaultValue={date} required className={input} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Начало (МСК)</label>
          <input type="time" name="time" defaultValue={time} required className={input} />
        </div>
        <div>
          {/*
            Длительность, а не «время до» — как и в форме на сайте: с «до»
            пришлось бы гадать, какие это сутки при переходе через полночь.
          */}
          <label className="mb-1 block text-xs text-muted-foreground">Длительность, ч</label>
          <input
            type="number"
            name="hours"
            defaultValue={hours}
            min={1}
            max={168}
            step={0.5}
            required
            className={`${input} w-24`}
          />
        </div>
        <Submit />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-amber-300">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-emerald-300">{state.ok}</p>}
    </form>
  )
}

const input =
  'rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring'
