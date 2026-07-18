import { Reveal } from './reveal'
import { type Lang } from '@/lib/i18n'
import type { GalleryMedia } from '@/lib/gallery'

/**
 * «Моменты» — плитка фото и видео. Содержимое правится в админке
 * (/admin/gallery), здесь только отрисовка: данные приходят пропсом со
 * страницы, как флот.
 *
 * Видео — с controls и preload="metadata": пять роликов по 5–11 МБ нельзя
 * автовоспроизводить, браузер тянет только первый кадр. Раздел к тому же
 * свёрнут по умолчанию, так что до раскрытия не грузится ничего.
 */
export function Gallery({ lang = 'ru', items }: { lang?: Lang; items: GalleryMedia[] }) {
  void lang

  return (
    <div className="mx-auto max-w-7xl px-6 pb-28 lg:px-10 lg:pb-40">
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {items.map((item, i) => {
          // Разная высота — чтобы плитка не была одинаковой сеткой.
          const ratio =
            i % 4 === 0 ? 'aspect-[3/4]' : i % 3 === 0 ? 'aspect-square' : 'aspect-[4/3]'
          return (
            <Reveal key={item.id} delay={(i % 3) * 80} className="mb-5 break-inside-avoid">
              <div className="overflow-hidden rounded-3xl">
                {item.kind === 'video' ? (
                  <video
                    src={item.src}
                    controls
                    playsInline
                    preload="metadata"
                    className={`w-full bg-black object-cover ${ratio}`}
                  />
                ) : (
                  <img
                    src={item.src}
                    alt="Момент на борту прогулки на катере"
                    loading="lazy"
                    className={`w-full object-cover transition-transform duration-[1.4s] ease-out hover:scale-105 ${ratio}`}
                  />
                )}
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
