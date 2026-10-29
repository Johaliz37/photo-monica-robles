// Consultas del panel de administración. Usan la sesión autenticada: la barrera real es la RLS (is_admin()).
import type { Rule, RuleInput } from './availability'
import type { Database, Tables } from './database.types'
import { AppError } from './errors'
import type { FixedSection } from './siteImages'
import { supabase } from './supabase'

export type Booking = Tables<'bookings'>
export type BookingStatus = Database['public']['Enums']['booking_status']
export type AvailabilityWindow = Tables<'availability_windows'>
export type StatusFilter = BookingStatus | 'todas'

export async function fetchBookings(params: {
  status: StatusFilter
  /** Si se indica, solo reservas con starts_at >= from. */
  from: Date | null
}): Promise<Booking[]> {
  let query = supabase.from('bookings').select('*')
  if (params.status !== 'todas') query = query.eq('status', params.status)
  if (params.from) query = query.gte('starts_at', params.from.toISOString())
  // Pendientes: las más antiguas primero. El resto, por fecha de sesión.
  query =
    params.status === 'pendiente'
      ? query.order('created_at', { ascending: true })
      : query.order('starts_at', { ascending: true })

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function countPending(): Promise<number> {
  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendiente')
  if (error) throw error
  return count ?? 0
}

export async function fetchBooking(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function reviewBooking(
  id: string,
  status: Exclude<BookingStatus, 'pendiente'>,
  note: string,
): Promise<void> {
  const { error } = await supabase.rpc('review_booking', {
    p_id: id,
    p_status: status,
    p_note: note,
  })
  if (error) throw error
}

/** URL firmada (5 min) del comprobante en el bucket privado. */
export async function receiptUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}

// ===== Disponibilidad =====

/** Reservas activas (pendientes y aceptadas) que se solapan con [from, to), o desde `from` sin `to`. */
export async function fetchActiveBookings(from: Date, to?: Date): Promise<Booking[]> {
  let query = supabase.from('bookings').select('*').neq('status', 'rechazada')
  if (to) query = query.lt('starts_at', to.toISOString())
  const { data, error } = await query.gt('ends_at', from.toISOString()).order('starts_at')
  if (error) throw error
  return data
}

/** Todos los rangos de disponibilidad (únicos y series). */
export async function fetchAvailabilityRules(): Promise<Rule[]> {
  const { data, error } = await supabase
    .from('availability_rules')
    .select('*')
    .order('day')
    .order('start_time')
  if (error) throw error
  // Postgres devuelve "09:00:00"
  return data.map((r) => ({
    id: r.id,
    kind: r.kind,
    day: r.day,
    start: r.start_time.slice(0, 5),
    end: r.end_time.slice(0, 5),
    repeat: r.repeat,
    until: r.until_day,
  }))
}

/**
 * Crea (id null) o edita un rango. El servidor recalcula las franjas de los días afectados y
 * falla con BOOKINGS_OUTSIDE_WINDOWS si alguna reserva activa se quedaría fuera.
 */
export async function saveAvailabilityRule(id: string | null, rule: RuleInput): Promise<void> {
  const { error } = await supabase.rpc('save_availability_rule', {
    p_kind: rule.kind,
    p_day: rule.day,
    p_start: rule.start,
    p_end: rule.end,
    p_repeat: rule.repeat,
    p_until: rule.repeat === 'hasta' ? (rule.until ?? undefined) : undefined,
    p_id: id ?? undefined,
  })
  if (error) throw error
}

/** Borra un rango (si es una serie, entera). Mismas comprobaciones que al guardar. */
export async function deleteAvailabilityRule(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_availability_rule', { p_id: id })
  if (error) throw error
}

// ===== Perfil =====

export type Profile = Tables<'profile'>
export type ProfileInput = Omit<Profile, 'id' | 'updated_at'>

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from('profile').select('*').eq('id', true).maybeSingle()
  if (error) throw error
  return data
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profile')
    .upsert({ id: true, ...input, updated_at: new Date().toISOString() })
    .select('*')
    .single()
  // check_violation: algún campo no cumple las restricciones de la tabla
  if (error?.code === '23514') throw new AppError('INVALID_DATA')
  if (error) throw error
  return data
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PHOTO_ACCEPT = PHOTO_TYPES.join(',')
const PHOTO_MAX_BYTES = 10 * 1024 * 1024
const PHOTO_SIDE_PX = 800
const SITE_IMAGE_SIDE_PX = 1600

interface ResizedImage {
  blob: Blob
  ext: 'webp' | 'jpg' | 'png'
  width: number
  height: number
}

/**
 * Pasa la imagen a WebP (o al formato que sepa codificar el navegador) con el lado mayor
 * limitado a `maxSide`. Con `square`, la recorta antes al centro en cuadrado.
 */
async function resizeImage(
  file: File,
  { maxSide, square = false }: { maxSide: number; square?: boolean },
): Promise<ResizedImage> {
  if (!PHOTO_TYPES.includes(file.type)) throw new AppError('PHOTO_TYPE')
  if (file.size > PHOTO_MAX_BYTES) throw new AppError('PHOTO_TOO_BIG')

  const bitmap = await createImageBitmap(file)
  const srcW = square ? Math.min(bitmap.width, bitmap.height) : bitmap.width
  const srcH = square ? srcW : bitmap.height
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH))
  const width = Math.round(srcW * scale)
  const height = Math.round(srcH * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new AppError('PHOTO_TYPE')
  ctx.drawImage(
    bitmap,
    (bitmap.width - srcW) / 2,
    (bitmap.height - srcH) / 2,
    srcW,
    srcH,
    0,
    0,
    width,
    height,
  )
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.85),
  )
  if (!blob) throw new AppError('PHOTO_TYPE')
  // Safari antiguo no codifica WebP y devuelve PNG
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png'
  return { blob, ext, width, height }
}

/** Sube un archivo a un bucket público con nombre aleatorio y devuelve su nombre. */
async function uploadPublic(bucket: string, image: ResizedImage): Promise<string> {
  const name = `${crypto.randomUUID()}.${image.ext}`
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(name, image.blob, { upsert: false, contentType: image.blob.type })
  if (error) throw error
  return data.path
}

/** Sube la foto de perfil (cuadrada, 800 px) al bucket público `avatars` y devuelve su nombre. */
export async function uploadProfilePhoto(file: File): Promise<string> {
  return uploadPublic('avatars', await resizeImage(file, { maxSide: PHOTO_SIDE_PX, square: true }))
}

/** Borra una foto del bucket `avatars`. Si falla, solo queda un archivo huérfano. */
export async function deleteProfilePhoto(path: string): Promise<void> {
  await supabase.storage.from('avatars').remove([path])
}

// ===== Imágenes de la home =====

export type SiteImageRow = Tables<'site_images'>

const SITE_BUCKET = 'site-images'

/** Todas las fotos de la home, por sección y en el orden del carrusel. */
export async function fetchSiteImages(): Promise<SiteImageRow[]> {
  const { data, error } = await supabase
    .from('site_images')
    .select('*')
    .order('section')
    .order('sort_order')
    .order('created_at')
  if (error) throw error
  return data
}

/** Borra archivos del bucket `site-images`. Si falla, solo quedan archivos huérfanos. */
async function removeSiteFiles(paths: string[]): Promise<void> {
  if (paths.length > 0) await supabase.storage.from(SITE_BUCKET).remove(paths)
}

/**
 * Sube la foto de una sección fija (Adicionales, Información adicional, sesión de Navidad).
 * Si ya había una, la sustituye y borra el archivo anterior.
 */
export async function setFixedSiteImage(
  section: FixedSection,
  file: File,
  alt: string,
): Promise<SiteImageRow> {
  const image = await resizeImage(file, { maxSide: SITE_IMAGE_SIDE_PX })
  const path = await uploadPublic(SITE_BUCKET, image)
  const fields = { path, alt, width: image.width, height: image.height }

  try {
    const { data: current, error: readError } = await supabase
      .from('site_images')
      .select('*')
      .eq('section', section)
      .maybeSingle()
    if (readError) throw readError
    const { data, error } = await (current
      ? supabase.from('site_images').update(fields).eq('id', current.id).select('*').single()
      : supabase
          .from('site_images')
          .insert({ section, ...fields })
          .select('*')
          .single())
    if (error) throw error
    if (current) await removeSiteFiles([current.path])
    return data
  } catch (err) {
    await removeSiteFiles([path])
    throw err
  }
}

/** Añade una foto al final del carrusel. */
export async function addCarouselImage(file: File, sortOrder: number): Promise<SiteImageRow> {
  const image = await resizeImage(file, { maxSide: SITE_IMAGE_SIDE_PX })
  const path = await uploadPublic(SITE_BUCKET, image)
  const { data, error } = await supabase
    .from('site_images')
    .insert({
      section: 'carousel',
      path,
      alt: '',
      width: image.width,
      height: image.height,
      sort_order: sortOrder,
    })
    .select('*')
    .single()
  if (error) {
    await removeSiteFiles([path])
    throw error
  }
  return data
}

/** Cambia el texto alternativo (descripción) de una foto. */
export async function updateSiteImageAlt(id: string, alt: string): Promise<void> {
  const { error } = await supabase.from('site_images').update({ alt }).eq('id', id)
  if (error?.code === '23514') throw new AppError('INVALID_DATA')
  if (error) throw error
}

/** Guarda el orden del carrusel (lista completa de ids, de la primera a la última). */
export async function reorderCarousel(ids: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_carousel', { p_ids: ids })
  if (error) throw error
}

/** Borra una foto (fila y archivo). En las secciones fijas vuelve a verse la foto del código. */
export async function deleteSiteImage(image: SiteImageRow): Promise<void> {
  const { error } = await supabase.from('site_images').delete().eq('id', image.id)
  if (error) throw error
  await removeSiteFiles([image.path])
}

// ===== Dashboard =====

export interface DashboardData {
  /** Todas las reservas, de cualquier estado. */
  bookings: Booking[]
  windows: AvailabilityWindow[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [bookings, windows] = await Promise.all([
    supabase.from('bookings').select('*').order('starts_at'),
    supabase.from('availability_windows').select('*').order('starts_at'),
  ])
  if (bookings.error) throw bookings.error
  if (windows.error) throw windows.error
  return { bookings: bookings.data, windows: windows.data }
}
