/** Захват UTM-меток из URL и хранение их в cookie, чтобы источник заявки не терялся между визитами. */

const COOKIE_NAME = 'utm_data'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 год

export interface UtmData {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign'] as const

/** Вызывать один раз на клиенте при загрузке страницы. Ничего не делает, если в URL нет UTM-меток. */
export function captureUtmFromLocation() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const [source, medium, campaign] = UTM_PARAMS.map((key) => params.get(key))
  if (!source && !medium && !campaign) return

  const data: UtmData = {
    utmSource: source ?? undefined,
    utmMedium: medium ?? undefined,
    utmCampaign: campaign ?? undefined,
  }
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
}

/** Читает ранее сохранённые UTM-метки из cookie (для отправки вместе с заявкой). */
export function readUtmCookie(): UtmData {
  if (typeof document === 'undefined') return {}
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  if (!match) return {}
  try {
    return JSON.parse(decodeURIComponent(match[1])) as UtmData
  } catch {
    return {}
  }
}
