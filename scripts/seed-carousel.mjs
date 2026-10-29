// Carga en el carrusel de la home las fotos de images/Gallery/, como si las hubiera subido el
// admin desde /admin/imagenes (archivo en el bucket `site-images` + fila en `site_images`).
// Después se gestionan desde el panel como cualquier otra. Se ejecuta a mano:
//
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed:carousel
//   ... npm run seed:carousel -- --yes      (sin --yes solo lista lo que subiría)
//   ... npm run seed:carousel -- --yes --force   (aunque el carrusel ya tenga fotos)
//
// La service_role key NUNCA se guarda en el repo ni en .env.local: pásala solo en la terminal.
import { randomUUID } from 'node:crypto'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DIR = path.resolve('images/Gallery')
const MAX_SIDE = 1600 // igual que las subidas desde el panel (adminApi.ts)
const BUCKET = 'site-images'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const confirmed = process.argv.includes('--yes')
const force = process.argv.includes('--force')

const files = (await readdir(DIR))
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort((a, b) => a.localeCompare(b))
console.log(`${files.length} fotos en ${DIR}`)

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: existing, error } = await supabase
  .from('site_images')
  .select('sort_order')
  .eq('section', 'carousel')
if (error) throw error
if (existing.length > 0 && !force) {
  console.log(`El carrusel ya tiene ${existing.length} fotos: no se sube nada (usa --force).`)
  process.exit(0)
}

if (!confirmed) {
  for (const f of files) console.log(`  ${f}`)
  console.log('Simulación: añade --yes para subirlas.')
  process.exit(0)
}

// sharp se carga aquí: en Windows, process.exit() con sharp cargado aborta el proceso
const { default: sharp } = await import('sharp')

let order = Math.max(0, ...existing.map((r) => r.sort_order))
for (const file of files) {
  const { data: body, info } = await sharp(path.join(DIR, file))
    .rotate() // respeta la orientación EXIF
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })

  const name = `${randomUUID()}.webp`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(name, body, { contentType: 'image/webp', upsert: false })
  if (uploadError) throw uploadError

  const { error: insertError } = await supabase.from('site_images').insert({
    section: 'carousel',
    path: name,
    alt: '',
    width: info.width,
    height: info.height,
    sort_order: ++order,
  })
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([name])
    throw insertError
  }
  console.log(
    `  ✓ ${file} → ${name} (${info.width}×${info.height}, ${Math.round(body.length / 1024)} kB)`,
  )
}
console.log(`${files.length} fotos añadidas al carrusel.`)
