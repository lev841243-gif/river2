'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Сводка' },
  { href: '/admin/bookings', label: 'Заявки' },
  { href: '/admin/boats', label: 'Лодки' },
  { href: '/admin/clients', label: 'Клиенты' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1">
      {LINKS.map((l) => {
        // «Сводка» — точное совпадение: иначе она подсвечивалась бы на всех
        // страницах админки, раз её адрес — префикс любого другого.
        const active = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              active
                ? 'rounded-md bg-muted px-3 py-1.5 text-sm text-foreground'
                : 'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground'
            }
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
