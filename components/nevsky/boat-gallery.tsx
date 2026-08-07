'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { boatImg } from '@/lib/i18n'

/**
 * Галерея на странице катера. От модалки во `fleet.tsx` отличается тем, что
 * живёт прямо на странице: нет закрытия, нет блокировки прокрутки и нет
 * глобального обработчика клавиш — стрелки на странице должны прокручивать её,
 * а не листать фото.
 *
 * Обложка входит в галерею первым кадром: иначе клик по фото карточки открывал
 * бы совсем другой снимок (та же причина, что и в модалке).
 */
export function BoatGallery({
  dir,
  cover,
  photos,
  alt,
}: {
  dir: string
  cover: string
  photos: string[]
  alt: string
}) {
  const gallery = [cover, ...photos]
  const [i, setI] = useState(0)
  const many = gallery.length > 1

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-background">
        {/* Размытая подложка: часть снимков вертикальные, и object-contain
            оставлял бы по бокам пустоту. Так поля выглядят задуманными. */}
        <img
          src={boatImg(dir, gallery[i])}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl"
        />
        <img
          src={boatImg(dir, gallery[i])}
          alt={`${alt} — ${i + 1}`}
          className="relative size-full object-contain"
        />

        {many && (
          <>
            <button
              type="button"
              onClick={() => setI((p) => (p - 1 + gallery.length) % gallery.length)}
              aria-label="prev"
              className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => setI((p) => (p + 1) % gallery.length)}
              aria-label="next"
              className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {gallery.map((file, idx) => (
            <button
              key={file}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`${idx + 1}`}
              className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border transition-opacity ${
                idx === i ? 'border-primary opacity-100' : 'border-border opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={boatImg(dir, file)}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
