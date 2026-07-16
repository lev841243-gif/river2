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
    if (motionOk) {
      // play() может отклониться (экономия трафика, политика браузера) —
      // тогда просто останется постер, страница из-за этого падать не должна.
      v.play().catch(() => {})
    } else {
      v.pause()
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
