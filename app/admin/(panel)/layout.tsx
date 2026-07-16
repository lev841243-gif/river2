import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { logout } from './actions'
import { AdminNav } from './nav'

/**
 * Охраняемая часть админки.
 *
 * requireAdmin() здесь — для удобства (один редирект на весь раздел), но это
 * НЕ единственная охрана: layout не перерисовывается при клиентской навигации.
 * Каждая страница и каждый server action проверяют доступ сами.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <Link href="/admin" className="font-serif text-lg text-primary">
          Дно · админка
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{admin.name}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>

      <AdminNav />

      <main className="mt-6">{children}</main>
    </div>
  )
}
