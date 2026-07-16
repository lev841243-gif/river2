import type { Metadata } from 'next'

/**
 * Общая обёртка админки. Охраны здесь НЕТ намеренно: под ней лежит и страница
 * входа, и проверка в общем layout зациклила бы редирект на неё же.
 * Охраняемая часть — в группе (panel).
 */
export const metadata: Metadata = {
  title: 'Админка — Дно',
  // В админке персональные данные клиентов: телефоны, имена, комментарии.
  // Поисковику здесь делать нечего даже теоретически.
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
