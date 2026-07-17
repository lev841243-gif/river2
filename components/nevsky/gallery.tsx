import { Reveal } from './reveal'
import { type Lang } from '@/lib/i18n'

const images = [
  '/images/exp-romantic.png',
  '/images/route-canals.png',
  '/images/boat-lumiere.png',
  '/images/exp-white-nights.png',
  '/images/route-hermitage.png',
  '/images/exp-photo.png',
  '/images/boat-aurora.png',
  '/images/cta-evening.png',
  '/images/exp-birthday.png',
]

export function Gallery({ lang = 'ru' }: { lang?: Lang }) {
  void lang

  return (
    <div className="mx-auto max-w-7xl px-6 pb-28 lg:px-10 lg:pb-40">
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {images.map((src, i) => (
            <Reveal key={src} delay={(i % 3) * 80} className="mb-5 break-inside-avoid">
              <div className="overflow-hidden rounded-3xl">
                <img
                  src={src || '/placeholder.svg'}
                  alt="Момент на борту прогулки на катере"
                  loading="lazy"
                  className={`w-full object-cover transition-transform duration-[1.4s] ease-out hover:scale-105 ${
                    i % 4 === 0 ? 'aspect-[3/4]' : i % 3 === 0 ? 'aspect-square' : 'aspect-[4/3]'
                  }`}
                />
              </div>
            </Reveal>
          ))}
        </div>
    </div>
  )
}
