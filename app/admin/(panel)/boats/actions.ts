'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface BoatState {
  error?: string
  ok?: string
}

/**
 * Публичный каталог статичен (ISR), поэтому правка в админке сама по себе на
 * сайте не появится — страницу надо пометить устаревшей. Без этого менеджер
 * менял бы цену, видел «сохранено» и не понимал, почему на сайте старая.
 */
function revalidatePublicFleet() {
  revalidatePath('/')
  revalidatePath('/en')
}

/** Список строк из текстового поля: по одной в строке, пустые выкидываем. */
function lines(v: FormDataEntryValue | null): string[] {
  return String(v ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

const boatSchema = z.object({
  nameRu: z.string().trim().min(1, 'Название RU обязательно'),
  nameEn: z.string().trim().min(1, 'Название EN обязательно'),
  descRu: z.string().trim().min(1, 'Описание RU обязательно'),
  descEn: z.string().trim().min(1, 'Описание EN обязательно'),
  // Пустая цена — это «по запросу», а не ноль: у премиум-яхт цены нет.
  price: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), 'Цена должна быть числом'),
  badgeRu: z.string().trim(),
  badgeEn: z.string().trim(),
  premium: z.boolean(),
  isNew: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.coerce.number().int(),
})

export async function saveBoat(_prev: BoatState, formData: FormData): Promise<BoatState> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Не указана лодка' }

  const parsed = boatSchema.safeParse({
    nameRu: formData.get('nameRu'),
    nameEn: formData.get('nameEn'),
    descRu: formData.get('descRu'),
    descEn: formData.get('descEn'),
    price: formData.get('price'),
    badgeRu: formData.get('badgeRu'),
    badgeEn: formData.get('badgeEn'),
    premium: formData.get('premium') === 'on',
    isNew: formData.get('isNew') === 'on',
    isVisible: formData.get('isVisible') === 'on',
    sortOrder: formData.get('sortOrder'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Проверьте поля' }
  }
  const d = parsed.data

  const specsRu = lines(formData.get('specsRu'))
  const specsEn = lines(formData.get('specsEn'))
  const amenitiesRu = lines(formData.get('amenitiesRu'))
  const amenitiesEn = lines(formData.get('amenitiesEn'))

  // Списки идут парами RU/EN по позициям — разная длина означала бы, что на
  // одном языке пункт потеряется.
  if (specsRu.length !== specsEn.length) {
    return { error: 'ТТХ: число строк на RU и EN должно совпадать' }
  }
  if (amenitiesRu.length !== amenitiesEn.length) {
    return { error: 'Удобства: число строк на RU и EN должно совпадать' }
  }

  await prisma.boat.update({
    where: { id },
    data: {
      nameRu: d.nameRu,
      nameEn: d.nameEn,
      descRu: d.descRu,
      descEn: d.descEn,
      price: d.price,
      premium: d.premium,
      isNew: d.isNew,
      isVisible: d.isVisible,
      sortOrder: d.sortOrder,
      // DbNull, а не undefined: undefined Prisma понимает как «не трогать поле»,
      // и очистить ТТХ стало бы невозможно.
      specs: specsRu.length ? { ru: specsRu, en: specsEn } : Prisma.DbNull,
      amenities: { ru: amenitiesRu, en: amenitiesEn },
      // Пустой ярлык = его нет. Хранить {ru:"",en:""} нельзя: на сайте
      // отрисовался бы пустой значок.
      badge: d.badgeRu && d.badgeEn ? { ru: d.badgeRu, en: d.badgeEn } : Prisma.DbNull,
    },
  })

  revalidatePublicFleet()
  revalidatePath('/admin/boats')
  return { ok: 'Сохранено. На сайте обновится в течение минуты.' }
}

/** Показать/скрыть лодку. Удаления нет: на Boat висят брони, база не даст. */
export async function toggleBoat(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const boat = await prisma.boat.findUnique({ where: { id }, select: { isVisible: true } })
  if (!boat) return

  await prisma.boat.update({ where: { id }, data: { isVisible: !boat.isVisible } })

  revalidatePublicFleet()
  revalidatePath('/admin/boats')
}

/** Сдвинуть лодку в порядке показа на сайте. */
export async function moveBoat(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const dir = String(formData.get('dir') ?? '')

  const all = await prisma.boat.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true },
  })
  const i = all.findIndex((b) => b.id === id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= all.length) return

  // Меняем позиции местами. sortOrder у сидированных лодок может совпадать,
  // поэтому переписываем весь порядок номерами по списку — иначе обмен
  // одинаковых значений ничего бы не изменил.
  const reordered = [...all]
  ;[reordered[i], reordered[j]] = [reordered[j], reordered[i]]

  await prisma.$transaction(
    reordered.map((b, idx) =>
      prisma.boat.update({ where: { id: b.id }, data: { sortOrder: idx } }),
    ),
  )

  revalidatePublicFleet()
  revalidatePath('/admin/boats')
}
