import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth-cookie'

/**
 * Оптимистичная проверка входа — ТОЛЬКО ради редиректа на форму логина.
 *
 * Здесь проверяется лишь НАЛИЧИЕ куки, а не её подпись: proxy работает в
 * edge-рантайме, где нет node:crypto. Это не охрана — подделать пустую куку
 * тривиально. Настоящая проверка живёт в requireAdmin() на каждой странице и в
 * каждом server action (см. lib/auth.ts).
 *
 * Файл называется proxy.ts, а не middleware.ts: в Next 16 старое имя объявлено
 * устаревшим и на сборке предупреждает.
 */
export function proxy(req: NextRequest) {
  // Сам логин не охраняем — иначе редирект указывал бы на самого себя и зациклился.
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next()

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value)

  if (!hasSession) {
    const url = new URL('/admin/login', req.url)
    // Куда вернуть после входа: менеджер открыл ссылку на заявку из Telegram,
    // а его выкинуло на логин — после входа он должен попасть на неё, а не в корень.
    url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
