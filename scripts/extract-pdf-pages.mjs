// Extrae las 9 páginas rasterizadas del PDF del catálogo a assets-src/pdf/p1..p9.png.
// El PDF no tiene texto: cada página es una imagen RGB con filtros [ASCII85Decode FlateDecode].
// Sin poppler ni Python: se decodifica a mano con zlib y se guarda con sharp.
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pdfPath = join(root, 'paquetes_navidad_2026.pdf')
const outDir = join(root, 'assets-src', 'pdf')

/** Decodifica un flujo ASCII85 (Adobe), terminado en "~>". */
function ascii85Decode(input) {
  const out = []
  let group = []
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    if (c === 0x7e) break // "~>"
    if (c <= 0x20) continue // espacios y saltos de línea
    if (c === 0x7a && group.length === 0) {
      out.push(0, 0, 0, 0) // "z" = cuatro ceros
      continue
    }
    group.push(c - 33)
    if (group.length === 5) {
      let n = 0
      for (const d of group) n = n * 85 + d
      out.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255)
      group = []
    }
  }
  if (group.length > 0) {
    const len = group.length
    while (group.length < 5) group.push(84)
    let n = 0
    for (const d of group) n = n * 85 + d
    const bytes = [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
    out.push(...bytes.slice(0, len - 1))
  }
  return Buffer.from(out)
}

export async function extractPdfPages() {
  const pdf = readFileSync(pdfPath).toString('latin1')
  mkdirSync(outDir, { recursive: true })

  const dictRe = /<<([^]*?)>>\s*stream\r?\n/g
  let page = 0
  let match
  while ((match = dictRe.exec(pdf))) {
    const dict = match[1]
    if (!/\/Subtype\s*\/Image/.test(dict)) continue
    const width = Number(/\/Width\s+(\d+)/.exec(dict)[1])
    const height = Number(/\/Height\s+(\d+)/.exec(dict)[1])
    const start = match.index + match[0].length
    const end = pdf.indexOf('endstream', start)
    const raw = inflateSync(ascii85Decode(pdf.slice(start, end)))
    page++
    const file = join(outDir, `p${page}.png`)
    await sharp(raw, { raw: { width, height, channels: 3 } })
      .png()
      .toFile(file)
    console.log(`p${page}.png  ${width}×${height}`)
    dictRe.lastIndex = end
  }
  if (page === 0) throw new Error('No se encontraron imágenes en el PDF')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await extractPdfPages()
}
