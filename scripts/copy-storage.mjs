// Copia los archivos de Storage de un proyecto Supabase a otro (producción → desarrollo), con las
// mismas rutas: en la BD solo se guardan los nombres (receipt_path, photo_path, site_images.path).
// Lo llama scripts/refresh-dev.ps1; también se puede ejecutar a mano:
//
//   SRC_SUPABASE_URL=... SRC_SERVICE_ROLE_KEY=... DST_SUPABASE_URL=... DST_SERVICE_ROLE_KEY=... npm run copy:storage
//   ... npm run copy:storage -- --yes      (sin --yes solo lista lo que copiaría)
//
// Las service_role keys NUNCA se guardan en el repo ni en .env.local: pásalas solo en la terminal.
import { createClient } from '@supabase/supabase-js'

const BUCKETS = ['avatars', 'receipts', 'site-images']
const PAGE = 1000

const env = process.env
const missing = ['SRC_SUPABASE_URL', 'SRC_SERVICE_ROLE_KEY', 'DST_SUPABASE_URL', 'DST_SERVICE_ROLE_KEY'].filter(
  (name) => !env[name],
)
if (missing.length) {
  console.error(`Faltan ${missing.join(', ')}`)
  process.exit(1)
}
if (env.SRC_SUPABASE_URL === env.DST_SUPABASE_URL) {
  console.error('El origen y el destino son el mismo proyecto')
  process.exit(1)
}
const confirmed = process.argv.includes('--yes')

const options = { auth: { persistSession: false } }
const src = createClient(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, options)
const dst = createClient(env.DST_SUPABASE_URL, env.DST_SERVICE_ROLE_KEY, options)

/** Rutas de todos los archivos del bucket (las carpetas tienen id null). */
async function listAll(bucket, prefix = '') {
  const paths = []
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await src.storage.from(bucket).list(prefix, { limit: PAGE, offset })
    if (error) throw error
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) paths.push(...(await listAll(bucket, path)))
      else paths.push(path)
    }
    if (data.length < PAGE) return paths
  }
}

for (const bucket of BUCKETS) {
  const { error: bucketError } = await src.storage.getBucket(bucket)
  if (bucketError) {
    console.log(`${bucket}: no existe en el origen, se omite`)
    continue
  }
  const paths = await listAll(bucket)
  console.log(`${bucket}: ${paths.length} archivos`)
  if (!confirmed) continue

  for (const path of paths) {
    const { data: blob, error: downloadError } = await src.storage.from(bucket).download(path)
    if (downloadError) throw downloadError
    // upsert: se puede repetir sin duplicar
    const { error: uploadError } = await dst.storage
      .from(bucket)
      .upload(path, blob, { contentType: blob.type, upsert: true })
    if (uploadError) throw new Error(`${bucket}/${path}: ${uploadError.message}`)
  }
  console.log(`${bucket}: copiados`)
}
if (!confirmed) console.log('Simulación: añade --yes para copiar los archivos.')
