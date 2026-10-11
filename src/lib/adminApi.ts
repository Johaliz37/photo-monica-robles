// Consultas del panel de administración. Usan la sesión autenticada: la barrera real es la RLS (is_admin()).
import type { Exclusion, TimeRange } from './admin'
import type { Database, Json, Tables } from './database.types'
import { AppError } from './errors'
import type { Range } from './slots'
import { supabase } from './supabase'

export type Booking = Tables<'bookings'>
export type BookingStatus = Database['public']['Enums']['booking_status']
export type AvailabilityWindow = Tables<'availability_windows'>
export type StatusFilter = BookingStatus | 'todas'

// Código SQLSTATE de exclusion_violation (franjas solapadas)
const EXCLUSION_VIOLATION = '23P01'

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

export interface Agenda {
  windows: AvailabilityWindow[]
  /** Reservas activas (pendientes y aceptadas) del periodo. */
  bookings: Booking[]
}

export async function fetchAgenda(from: Date, to: Date): Promise<Agenda> {
  const [windows, bookings] = await Promise.all([
    supabase
      .from('availability_windows')
      .select('*')
      .lt('starts_at', to.toISOString())
      .gt('ends_at', from.toISOString())
      .order('starts_at'),
    supabase
      .from('bookings')
      .select('*')
      .neq('status', 'rechazada')
      .lt('starts_at', to.toISOString())
      .gt('ends_at', from.toISOString())
      .order('starts_at'),
  ])
  if (windows.error) throw windows.error
  if (bookings.error) throw bookings.error
  return { windows: windows.data, bookings: bookings.data }
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

/** Configuración guardada de la disponibilidad de un mes (base + excepciones). */
export interface MonthConfig {
  /** 0 = lunes … 6 = domingo. */
  weekdays: number[]
  ranges: TimeRange[]
  exclusions: Exclusion[]
  updatedAt: string
}

export async function fetchMonthConfig(month: string): Promise<MonthConfig | null> {
  const { data, error } = await supabase
    .from('availability_months')
    .select('*')
    .eq('month', month)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    weekdays: data.weekdays,
    ranges: data.ranges as unknown as TimeRange[],
    exclusions: data.exclusions as unknown as Exclusion[],
    updatedAt: data.updated_at,
  }
}

/**
 * Guarda la configuración del mes y reemplaza sus franjas de hoy en adelante, todo en una
 * transacción. Falla con BOOKINGS_OUTSIDE_WINDOWS si alguna reserva activa quedaría fuera.
 */
export async function saveMonthAvailability(
  month: string,
  config: Omit<MonthConfig, 'updatedAt'>,
  windows: Range[],
): Promise<void> {
  const { error } = await supabase.rpc('save_month_availability', {
    p_month: month,
    p_weekdays: config.weekdays,
    p_ranges: config.ranges as unknown as Json,
    p_exclusions: config.exclusions as unknown as Json,
    p_windows: windows.map((w) => ({
      starts_at: w.start.toISOString(),
      ends_at: w.end.toISOString(),
    })),
  })
  if (error?.code === EXCLUSION_VIOLATION) throw new AppError('WINDOW_OVERLAP')
  if (error) throw error
}

/** Borra la franja. El trigger lanza WINDOW_HAS_BOOKINGS si tiene reservas activas. */
export async function deleteWindow(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('availability_windows')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) throw error
  // Con la RLS, una fila que no se puede borrar no da error: simplemente no se borra
  if (data.length === 0) throw new AppError('NOT_FOUND')
}
