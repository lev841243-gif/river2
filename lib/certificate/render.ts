/**
 * Рендер бланка сертификата: на готовый макет накладываем динамику —
 * свежий QR и номер, а печатную ссылку приводим к боевому домену.
 *
 * Почему так, а не «собрать бланк с нуля»: чистого макета (без впечатанных
 * QR/номера) у нас нет — только готовая картинка. Поэтому три «чужие» зоны
 * (QR, «№ …», строка-ссылка) закрываем прямоугольником цвета бумаги и печатаем
 * поверх своё. Координаты — в пикселях исходника (904×1280), выверены визуально.
 *
 * Текст рисуем через @napi-rs/canvas (нативный FreeType) со ВЛОЖЕННЫМ шрифтом
 * PT Serif, а не средствами SVG-текста sharp: во-первых, sharp-рендер шрифта
 * зависит от системных шрифтов (на сервере набор другой — номер поехал бы);
 * во-вторых, отрисовка векторных контуров глифов через librsvg на отдельных
 * буквах давала артефакты (то «0», то «K» рисовались комом). Canvas растеризует
 * шрифт сам и одинаково везде.
 */

import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
import QRCode from 'qrcode'
import sharp from 'sharp'

const ROOT = process.cwd()
const TEMPLATE = path.join(ROOT, 'public/certificate/template.jpg')
const FONT_PATH = path.join(ROOT, 'lib/certificate/fonts/PTSerif-Regular.ttf')
const FONT_FAMILY = 'PTSerifCert'

// Палитра бланка (совпадает с макетом).
const NAVY = '#10233e' // тёмно-синий текста и QR
const GOLD = '#c5a46d' // золото ссылки
const PAPER = '#fefdfb' // цвет бумаги — им закрываем впечатанное

// Геометрия наложений в координатах исходника 904×1280 (рамки выверены
// детектором по цвету: синий текст vs золото, чтобы не задеть разделители и
// золотые диаманты по краям номера).
const QR = { cx: 451, cy: 1014, size: 104, cover: { x: 394, y: 956, w: 114, h: 116 } }
const NUM = { cx: 452, baseline: 1225, fontSize: 24, cover: { x: 345, y: 1205, w: 206, h: 28 } }
// Печатная ссылка. QR ведёт на /check/<номер>, а глазами человек наберёт домен —
// полный путь с номером в узкую колонку не влезает, поэтому печатаем только домен.
const URL = {
  text: 'PROKATKATEROV.RU',
  cx: 450,
  baseline: 1167,
  fontSize: 20,
  tracking: 1,
  cover: { x: 364, y: 1150, w: 172, h: 24 },
}

let fontReady = false
function ensureFont(): void {
  if (!fontReady) {
    GlobalFonts.registerFromPath(FONT_PATH, FONT_FAMILY)
    fontReady = true
  }
}

/**
 * Полный адрес страницы проверки для QR.
 *
 * Домен — из `CERT_CHECK_BASE_URL`, по умолчанию боевой `prokatkaterov.ru`.
 * Отдельная переменная, а не общий `NEXT_PUBLIC_SITE_URL`: тот локально равен
 * `http://localhost:3000`, и QR на печатном бланке случайно указал бы в никуда.
 * Дефолт уже боевой — на сервере доопределять ничего не нужно.
 */
export function checkUrl(number: string): string {
  const base = (process.env.CERT_CHECK_BASE_URL || 'https://prokatkaterov.ru').replace(/\/+$/, '')
  return `${base}/check/${number}`
}

/** PNG-бланк сертификата с заданным номером. */
export async function renderCertificate(number: string): Promise<Buffer> {
  ensureFont()

  const meta = await sharp(TEMPLATE).metadata()
  const width = meta.width ?? 904
  const height = meta.height ?? 1280

  // Слой с перекрытиями и текстом поверх макета.
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = PAPER
  for (const c of [QR.cover, NUM.cover, URL.cover]) ctx.fillRect(c.x, c.y, c.w, c.h)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = NAVY
  ctx.font = `${NUM.fontSize}px "${FONT_FAMILY}"`
  ctx.letterSpacing = '0px'
  ctx.fillText(`№ ${number}`, NUM.cx, NUM.baseline)

  ctx.fillStyle = GOLD
  ctx.font = `${URL.fontSize}px "${FONT_FAMILY}"`
  ctx.letterSpacing = `${URL.tracking}px`
  ctx.fillText(URL.text, URL.cx, URL.baseline)

  const overlay = canvas.toBuffer('image/png')

  const qr = await QRCode.toBuffer(checkUrl(number), {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: QR.size,
    // Светлый модуль = цвет бумаги: зона тишины QR сливается с бланком.
    color: { dark: NAVY, light: PAPER },
  })

  return sharp(TEMPLATE)
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: qr, top: Math.round(QR.cy - QR.size / 2), left: Math.round(QR.cx - QR.size / 2) },
    ])
    .png()
    .toBuffer()
}
