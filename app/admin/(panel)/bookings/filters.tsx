'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SOURCE_LABEL } from '@/lib/admin-data'
import type { BookingSource } from '@prisma/client'

/**
 * Фильтры живут в адресе, а не в состоянии компонента: так отфильтрованный
 * список можно переслать ссылкой и он переживает перезагрузку страницы.
 */
export function Filters({ boats }: { boats: { id: string; nameRu: string }[] }) {
  const router = useRouter()
  const sp = useSearchParams()

  function set(key: string, value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    // Любая смена фильтра возвращает на первую страницу: иначе можно остаться
    // на «странице 3» выборки, где всего одна.
    params.delete('page')
    router.push(`/admin/bookings?${params.toString()}`)
  }

  const val = (k: string) => sp.get(k) ?? ''
  const hasAny = ['q', 'boat', 'source', 'from', 'to'].some((k) => sp.get(k))

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3">
      <form
        className="flex-1 min-w-[200px]"
        action={(fd) => set('q', String(fd.get('q') ?? ''))}
      >
        <label className="mb-1 block text-xs text-muted-foreground">Имя или телефон</label>
        <input
          name="q"
          defaultValue={val('q')}
          placeholder="Иван или 9991234567"
          className={input}
        />
      </form>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Лодка</label>
        <select value={val('boat')} onChange={(e) => set('boat', e.target.value)} className={input}>
          <option value="">Любая</option>
          {boats.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nameRu}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Источник</label>
        <select
          value={val('source')}
          onChange={(e) => set('source', e.target.value)}
          className={input}
        >
          <option value="">Любой</option>
          {(Object.keys(SOURCE_LABEL) as BookingSource[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Прогулка с</label>
        <input
          type="date"
          value={val('from')}
          onChange={(e) => set('from', e.target.value)}
          className={input}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">по</label>
        <input
          type="date"
          value={val('to')}
          onChange={(e) => set('to', e.target.value)}
          className={input}
        />
      </div>

      {hasAny && (
        <button
          type="button"
          onClick={() => router.push('/admin/bookings')}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          Сбросить
        </button>
      )}
    </div>
  )
}

const input =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring'
