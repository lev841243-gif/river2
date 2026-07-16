'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveBoat, type BoatState } from '../actions'

interface BoatData {
  id: string
  slug: string
  dir: string
  photoCount: number
  nameRu: string
  nameEn: string
  descRu: string
  descEn: string
  price: number | null
  specsRu: string
  specsEn: string
  amenitiesRu: string
  amenitiesEn: string
  badgeRu: string
  badgeEn: string
  premium: boolean
  isNew: boolean
  isVisible: boolean
  sortOrder: number
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Сохраняем…' : 'Сохранить'}
    </button>
  )
}

export function BoatForm({ boat }: { boat: BoatData }) {
  const [state, formAction] = useActionState<BoatState, FormData>(saveBoat, {})

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={boat.id} />

      <section className={card}>
        <h2 className={h2}>Название и описание</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название, RU">
            <input name="nameRu" defaultValue={boat.nameRu} required className={input} />
          </Field>
          <Field label="Название, EN">
            <input name="nameEn" defaultValue={boat.nameEn} required className={input} />
          </Field>
          <Field label="Описание, RU">
            <textarea name="descRu" defaultValue={boat.descRu} rows={4} required className={input} />
          </Field>
          <Field label="Описание, EN">
            <textarea name="descEn" defaultValue={boat.descEn} rows={4} required className={input} />
          </Field>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>ТТХ и удобства</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          По одному пункту на строку. Строки RU и EN идут парами — их количество должно совпадать.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="ТТХ, RU">
            <textarea name="specsRu" defaultValue={boat.specsRu} rows={6} className={input} />
          </Field>
          <Field label="ТТХ, EN">
            <textarea name="specsEn" defaultValue={boat.specsEn} rows={6} className={input} />
          </Field>
          <Field label="Удобства, RU">
            <textarea
              name="amenitiesRu"
              defaultValue={boat.amenitiesRu}
              rows={6}
              className={input}
            />
          </Field>
          <Field label="Удобства, EN">
            <textarea
              name="amenitiesEn"
              defaultValue={boat.amenitiesEn}
              rows={6}
              className={input}
            />
          </Field>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Цена и показ</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Цена, ₽/час">
            {/*
              step={1}, а не «круглая» тысяча: браузер проверяет шаг и молча
              отказывается отправлять форму с ценой вроде 57 500, показывая
              лишь «ближайшие допустимые значения». Цена — целые рубли, любые.
            */}
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={boat.price ?? ''}
              placeholder="пусто = по запросу"
              className={input}
            />
          </Field>
          <Field label="Порядок показа">
            <input name="sortOrder" type="number" defaultValue={boat.sortOrder} className={input} />
          </Field>
          <Field label="Ярлык, RU">
            <input
              name="badgeRu"
              defaultValue={boat.badgeRu}
              placeholder="Бомбочка!"
              className={input}
            />
          </Field>
          <Field label="Ярлык, EN">
            <input
              name="badgeEn"
              defaultValue={boat.badgeEn}
              placeholder="Bombshell!"
              className={input}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-5">
          <Check name="isVisible" defaultChecked={boat.isVisible} label="Показывать на сайте" />
          <Check name="premium" defaultChecked={boat.premium} label="Флагман (корона)" />
          <Check name="isNew" defaultChecked={boat.isNew} label="Новинка" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          У флагмана вместо ярлыка показывается корона — ярлык для них можно не заполнять.
        </p>
      </section>

      <section className={card}>
        <h2 className={h2}>Фото</h2>
        <p className="text-sm text-muted-foreground">
          Папка <code className="text-foreground">public/boats/{boat.dir}</code>, фотографий:{' '}
          {boat.photoCount}. Загрузка из админки пока не сделана — файлы добавляются через git.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Submit />
        {state.error && (
          <p role="alert" className="text-sm text-amber-300">
            {state.error}
          </p>
        )}
        {state.ok && <p className="text-sm text-emerald-300">{state.ok}</p>}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Check({
  name,
  defaultChecked,
  label,
}: {
  name: string
  defaultChecked: boolean
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-primary" />
      {label}
    </label>
  )
}

const card = 'rounded-lg border border-border bg-card p-4'
const h2 = 'mb-3 text-sm text-muted-foreground'
const input =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring'
