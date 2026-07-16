'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Фоновое видео первого экрана.
 *
 * Автовоспроизведение на мобильных работает только при muted + playsInline —
 * без них iOS откроет видео на весь экран или не запустит вовсе. Звуковой
 * дорожки в файле нет, но muted всё равно обязателен: браузер смотрит на
 * атрибут, а не на содержимое.
 *
 * При системной настройке «уменьшить движение» видео не играет — вместо него
 * остаётся постер. Полноэкранное движущееся видео — ровно то, от чего эта
 * настройка защищает.
 */
export function HeroVideo({ poster, alt }: { poster: string; alt: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [motionOk, setMotionOk] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setMotionOk(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    if (!motionOk) {
      v.pause()
      return
    }

    // play() может отклониться — тогда останется постер, страница не падает.
    const tryPlay = () => v.play().catch(() => {})
    tryPlay()

    /**
     * В режиме энергосбережения iOS запрещает автозапуск — видео так и стоит
     * на постере. Но запуск по жесту пользователя он разрешает, поэтому
     * пробуем ещё раз при первом касании или прокрутке. once: true — слушатель
     * снимается сам, повторно не мешает.
     */
    const retry = () => tryPlay()
    const opts = { once: true, passive: true } as const
    window.addEventListener('touchstart', retry, opts)
    window.addEventListener('scroll', retry, opts)
    window.addEventListener('click', retry, { once: true })

    return () => {
      window.removeEventListener('touchstart', retry)
      window.removeEventListener('scroll', retry)
      window.removeEventListener('click', retry)
    }
  }, [motionOk])

  return (
    <video
      ref={videoRef}
      poster={poster}
      aria-label={alt}
      autoPlay={motionOk}
      muted
      loop
      playsInline
      preload="auto"
      className="size-full object-cover"
    >
      <source src="/images/hero.mp4" type="video/mp4" />
    </video>
  )
}
