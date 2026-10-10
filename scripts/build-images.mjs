// Genera las imágenes optimizadas de la web (npm run images):
//   public/img/<nombre>-<ancho>.webp (640 y 1280, o el ancho original si es menor), og-cover.jpg
//   src/content/images.generated.ts (rutas y dimensiones reales, para srcset y evitar CLS)
// Los recortes se miden sobre las páginas del PDF (1055×1491 px).
// Cuando Mónica envíe los originales en alta resolución, basta con cambiar `source` aquí.
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { extractPdfPages } from './extract-pdf-pages.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'img')
const pdfPage = (n) => join(root, 'assets-src', 'pdf', `p${n}.png`)
const photo = (time) => join(root, 'images', `WhatsApp Image 2026-10-10 at ${time}.jpeg`)

const WIDTHS = [640, 1280]
const QUALITY = 80

/** @type {{ name: string, source: string, crop?: { left: number, top: number, width: number, height: number } }[]} */
const IMAGES = [
  // Hero: trineo sin texto (zona inferior de la portada, bajo la insignia del 10 %)
  { name: 'hero', source: pdfPage(1), crop: { left: 0, top: 870, width: 1055, height: 495 } },
  { name: 'pkg1', source: photo('04.14.38') },
  { name: 'pkg2', source: photo('04.15.05') },
  { name: 'pkg3', source: photo('04.15.42') },
  // Calendario de faldilla (p5): foto grande de la derecha y la de abajo a la izquierda
  { name: 'cal-1', source: pdfPage(5), crop: { left: 540, top: 0, width: 514, height: 1492 } },
  { name: 'cal-2', source: pdfPage(5), crop: { left: 0, top: 805, width: 535, height: 687 } },
  { name: 'studio-1', source: photo('04.17.51') },
  { name: 'studio-2', source: photo('04.18.19') },
  // Espadilla (p6)
  {
    name: 'espadilla-pueblo',
    source: pdfPage(6),
    crop: { left: 592, top: 0, width: 463, height: 540 },
  },
  {
    name: 'espadilla-montanas',
    source: pdfPage(6),
    crop: { left: 30, top: 544, width: 648, height: 303 },
  },
  {
    name: 'espadilla-ermita',
    source: pdfPage(6),
    crop: { left: 30, top: 866, width: 361, height: 355 },
  },
  {
    name: 'espadilla-trineo',
    source: pdfPage(6),
    crop: { left: 0, top: 1238, width: 540, height: 253 },
  },
]

// Open Graph: título de la portada (1200×630)
const OG = { source: pdfPage(1), crop: { left: 0, top: 50, width: 1055, height: 554 } }

function load(source, crop) {
  const img = sharp(source)
  return crop ? img.extract(crop) : img
}

async function main() {
  if (!existsSync(pdfPage(1))) await extractPdfPages()
  mkdirSync(outDir, { recursive: true })
  for (const f of readdirSync(outDir)) rmSync(join(outDir, f))

  const manifest = {}
  for (const { name, source, crop } of IMAGES) {
    const meta = await load(source, crop).toBuffer({ resolveWithObject: true })
    const { width, height } = meta.info
    const entry = { width, height, srcSet: [] }
    // Sin ampliar: si el origen es más estrecho que 1280, el mayor tamaño es el original
    const widths = [...new Set(WIDTHS.map((w) => Math.min(w, width)))]
    for (const w of widths) {
      const file = `${name}-${w}.webp`
      const out = await sharp(meta.data)
        .resize({ width: w })
        .webp({ quality: QUALITY })
        .toFile(join(outDir, file))
      entry.srcSet.push({ src: `/img/${file}`, width: out.width })
      console.log(
        `${file.padEnd(28)} ${out.width}×${out.height}  ${(out.size / 1024).toFixed(0)} KB`,
      )
    }
    manifest[name] = entry
  }

  await load(OG.source, OG.crop)
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(outDir, 'og-cover.jpg'))
  console.log('og-cover.jpg                 1200×630')

  const ts =
    '// Generado por scripts/build-images.mjs (npm run images). No editar a mano.\n' +
    'export interface ImageSource {\n  src: string\n  width: number\n}\n' +
    'export interface ImageAsset {\n  width: number\n  height: number\n  srcSet: ImageSource[]\n}\n\n' +
    `export const IMAGES = ${JSON.stringify(manifest, null, 2)} as const satisfies Record<string, ImageAsset>\n\n` +
    'export type ImageName = keyof typeof IMAGES\n'
  writeFileSync(join(root, 'src', 'content', 'images.generated.ts'), ts)
}

await main()
