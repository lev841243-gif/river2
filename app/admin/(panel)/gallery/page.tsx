import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { galleryUrl } from '@/lib/gallery'
import { Card } from '../ui'
import { UploadForm } from './upload-form'
import { deleteGalleryItem, moveGalleryItem, toggleGalleryItem } from './actions'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  await requireAdmin()

  const items = await prisma.galleryItem.findMany({ orderBy: { sortOrder: 'asc' } })

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-medium">Моменты</h1>
        <span className="text-sm text-muted-foreground">{items.length} шт.</span>
      </div>

      <Card>
        <p className="mb-3 text-sm text-muted-foreground">
          Фото и видео для раздела «Моменты» на главной. В отличие от лодок, эти файлы грузятся
          прямо отсюда — git и пересборка не нужны.
        </p>
        <UploadForm />
      </Card>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            Пока пусто. Раздел «Моменты» на сайте не показывается, пока нет ни одного файла.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <Card key={item.id} className="space-y-2 p-2">
              <div className="overflow-hidden rounded-md bg-black">
                {item.kind === 'video' ? (
                  <video
                    src={galleryUrl(item.file)}
                    preload="metadata"
                    controls
                    muted
                    playsInline
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <img
                    src={galleryUrl(item.file)}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
                <span>{item.kind === 'video' ? 'видео' : 'фото'}</span>
                {!item.isVisible && (
                  <span className="rounded-full border border-border px-2 py-0.5">скрыто</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <form action={moveGalleryItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={i === 0} className={iconBtn}>
                    ↑
                  </button>
                </form>
                <form action={moveGalleryItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={i === items.length - 1} className={iconBtn}>
                    ↓
                  </button>
                </form>
                <form action={toggleGalleryItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className={iconBtn}>
                    {item.isVisible ? 'Скрыть' : 'Показать'}
                  </button>
                </form>
                <form action={deleteGalleryItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className={dangerBtn}>
                    Удалить
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

const iconBtn =
  'rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-30'

const dangerBtn =
  'rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:text-red-300'
