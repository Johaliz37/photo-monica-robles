// Borra del bucket `receipts` los comprobantes de las sesiones de hace más de 6 meses
// (política de privacidad). Se ejecuta a mano, desde el equipo del desarrollador:
//
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run purge:receipts
//   ... npm run purge:receipts -- --yes      (sin --yes solo lista lo que borraría)
//
// Usa la API de Storage porque Supabase no permite borrar de storage.objects con SQL.
// La service_role key NUNCA se guarda en el repo ni en .env.local: pásala solo en la terminal.
import { createClient } from '@supabase/supabase-js'

const MONTHS = 6
const CHUNK = 100

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const confirmed = process.argv.includes('--yes')

const cutoff = new Date()
cutoff.setMonth(cutoff.getMonth() - MONTHS)

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: bookings, error } = await supabase
  .from('bookings')
  .select('receipt_path')
  .lt('starts_at', cutoff.toISOString())
if (error) throw error

const paths = bookings.map((b) => b.receipt_path)
console.log(`${paths.length} reservas con sesión anterior al ${cutoff.toISOString().slice(0, 10)}`)

if (!confirmed) {
  for (const p of paths) console.log(`  ${p}`)
  console.log('Simulación: añade --yes para borrar los archivos.')
  process.exit(0)
}

let removed = 0
for (let i = 0; i < paths.length; i += CHUNK) {
  // Los archivos ya borrados se ignoran, así que se puede repetir sin problema
  const { data, error: removeError } = await supabase.storage
    .from('receipts')
    .remove(paths.slice(i, i + CHUNK))
  if (removeError) throw removeError
  removed += data.length
}
console.log(`${removed} comprobantes borrados.`)
