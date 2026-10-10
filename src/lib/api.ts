// Llamadas a Supabase de la reserva pública (solo RPCs y subida al bucket `receipts`).
import type { PackageCode } from '@/content/packages'
import { BOOKING } from '@/content/site'
import { AppError } from './errors'
import type { Range } from './slots'
import { supabase } from './supabase'

export interface AvailabilityConfig {
  babyExtraMin: number
  bufferMin: number
  stepMin: number
  minNoticeMin: number
}

export interface Availability {
  windows: Range[]
  busy: Range[]
  config: AvailabilityConfig
}

interface RawAvailability {
  windows: { starts_at: string; ends_at: string }[]
  busy: { starts_at: string; blocked_until: string }[]
  config: { baby_extra_min: number; buffer_min: number; step_min: number; min_notice_min: number }
}

// get_availability admite como máximo 62 días por llamada
const CHUNK_MS = 60 * 24 * 60 * 60_000

const DEFAULT_CONFIG: AvailabilityConfig = {
  babyExtraMin: BOOKING.babyExtraMin,
  bufferMin: BOOKING.bufferMin,
  stepMin: BOOKING.stepMin,
  minNoticeMin: BOOKING.minNoticeMin,
}

export async function fetchAvailability(from: Date, to: Date): Promise<Availability> {
  const chunks: [Date, Date][] = []
  for (let t = from.getTime(); t < to.getTime(); t += CHUNK_MS) {
    chunks.push([new Date(t), new Date(Math.min(t + CHUNK_MS, to.getTime()))])
  }

  const results = await Promise.all(
    chunks.map(async ([chunkFrom, chunkTo]) => {
      const { data, error } = await supabase.rpc('get_availability', {
        p_from: chunkFrom.toISOString(),
        p_to: chunkTo.toISOString(),
      })
      if (error) throw error
      return data as unknown as RawAvailability
    }),
  )

  // Una franja o reserva que cruza el límite entre tramos llega dos veces
  const windows = new Map<string, Range>()
  const busy = new Map<string, Range>()
  for (const r of results) {
    for (const w of r.windows) {
      windows.set(w.starts_at, { start: new Date(w.starts_at), end: new Date(w.ends_at) })
    }
    for (const b of r.busy) {
      busy.set(b.starts_at, { start: new Date(b.starts_at), end: new Date(b.blocked_until) })
    }
  }

  const raw = results[0]?.config
  return {
    windows: [...windows.values()],
    busy: [...busy.values()],
    config: raw
      ? {
          babyExtraMin: raw.baby_extra_min,
          bufferMin: raw.buffer_min,
          stepMin: raw.step_min,
          minNoticeMin: raw.min_notice_min,
        }
      : DEFAULT_CONFIG,
  }
}

// ===== Comprobante =====

const RECEIPT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}
export const RECEIPT_ACCEPT = Object.keys(RECEIPT_TYPES).join(',')
const MAX_BYTES = 5 * 1024 * 1024
const COMPRESS_OVER_BYTES = 1.5 * 1024 * 1024
const MAX_SIDE_PX = 1600

/** Lanza AppError si el archivo no es un tipo admitido o pesa más de 5 MB. */
export function validateReceipt(file: File): void {
  if (!(file.type in RECEIPT_TYPES)) throw new AppError('RECEIPT_TYPE')
  if (file.size > MAX_BYTES) throw new AppError('RECEIPT_TOO_BIG')
}

/** Reduce la imagen a JPEG de 1600 px de lado máximo. Devuelve null si no compensa o falla. */
async function compressImage(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Fondo blanco: JPEG no tiene transparencia
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85),
    )
    return blob && blob.size < file.size ? blob : null
  } catch {
    return null
  }
}

/** Sube el comprobante al bucket privado y devuelve su ruta. */
export async function uploadReceipt(file: File): Promise<string> {
  validateReceipt(file)

  let body: Blob = file
  let contentType = file.type
  if (file.type !== 'application/pdf' && file.size > COMPRESS_OVER_BYTES) {
    const compressed = await compressImage(file)
    if (compressed) {
      body = compressed
      contentType = 'image/jpeg'
    }
  }

  const name = `${crypto.randomUUID()}.${RECEIPT_TYPES[contentType]}`
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(name, body, { upsert: false, contentType })
  if (error) throw error
  return data.path
}

// ===== Reserva =====

export interface BookingInput {
  packageCode: PackageCode
  baby: boolean
  startsAt: string
  name: string
  email: string
  phone: string
  participants: string
  notes: string
  receiptPath: string
  privacyConsent: boolean
}

/** Crea la reserva (estado `pendiente`) y devuelve su id. */
export async function createBooking(input: BookingInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_package_code: input.packageCode,
    p_baby_extension: input.baby,
    p_starts_at: input.startsAt,
    p_client_name: input.name,
    p_email: input.email,
    p_phone: input.phone,
    p_participants: input.participants,
    p_notes: input.notes,
    p_receipt_path: input.receiptPath,
    p_privacy_consent: input.privacyConsent,
  })
  if (error) throw error
  return data
}
