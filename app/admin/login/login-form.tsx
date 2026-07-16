'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login, type LoginState } from './actions'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Проверяем…' : 'Войти'}
    </button>
  )
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card p-6">
      <input type="hidden" name="next" value={next ?? ''} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm text-muted-foreground">
          Email
        </label>
        {/*
          defaultValue из state: React сбрасывает форму после каждой отправки, и
          без этого введённый email стирался бы при любой опечатке в пароле.
        */}
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus={!state.email}
          defaultValue={state.email ?? ''}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm text-muted-foreground">
          Пароль
        </label>
        {/* После отказа курсор сразу в пароле — email уже подставлен. */}
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus={Boolean(state.email)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  )
}
