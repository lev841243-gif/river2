import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { UtmCapture } from '@/components/nevsky/utm-capture'
import { CookieConsent } from '@/components/nevsky/cookie-consent'
import { YandexMetrika } from '@/components/nevsky/yandex-metrika'
import { SITE_URL, SITE_NAME, OG_IMAGES } from '@/lib/site'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Судоходная компания «Дно» — аренда катера с капитаном в Санкт-Петербурге',
  description:
    'Частные прогулки на катере по Неве с профессиональным капитаном. Романтические вечера, белые ночи, праздники и корпоративы. Private luxury boat tours in Saint Petersburg.',
  keywords: [
    'аренда катера СПб',
    'аренда катера с капитаном',
    'прогулка на катере по Неве',
    'катер напрокат Санкт-Петербург',
    'белые ночи катер',
    'развод мостов прогулка',
  ],
  // og:image, og:site_name и т.п. — дефолты для всех страниц; url/locale и
  // заголовки уточняются на каждой странице (см. app/page.tsx, app/en/page.tsx).
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ru_RU',
    images: OG_IMAGES,
  },
  twitter: { card: 'summary_large_image' },
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable} bg-background`}>
      <body className="font-sans antialiased">
        <YandexMetrika />
        <UtmCapture />
        {children}
        {/* Баннер cookie + аналитика грузится только после согласия. */}
        <CookieConsent />
      </body>
    </html>
  )
}
