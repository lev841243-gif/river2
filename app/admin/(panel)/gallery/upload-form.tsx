'use client'

import { useActionState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { uploadGallery, type GalleryState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition disabled:opacity-50"
    >
      {/* Видео весит десятки мегабайт — без явного «Загружаю…» кажется, что зависло. */}
      {pending ? 'Загружаю…' : 'Загрузить'}
    </button>
  )
}

export function UploadForm() {
  const [state, formAction] = useActionState<GalleryState, FormData>(uploadGallery, {})
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <form action={formAction} className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        name="files"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground"
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <span className="text-xs text-muted-foreground">
          Можно выбрать сразу несколько. Фото: jpg, png, webp. Видео: mp4, webm, mov. До 64 МБ на файл.
        </span>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-400">{state.ok}</p>}
    </form>
  )
}
