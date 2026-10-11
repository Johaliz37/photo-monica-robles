// Búsqueda de reservas en el panel de administración (lógica pura, sin Supabase).
import { shortCode } from './admin'
import type { Booking } from './adminApi'
import { dayKey, minutesOfDay } from './dates'

export interface BookingSearch {
  /** Código de reserva (o parte): "3F2A", "#3f2a9c1b". */
  code: string
  /** Nombre del cliente (o parte), sin distinguir mayúsculas ni tildes. */
  name: string
  /** Día de la sesión en Madrid: "2026-11-07". */
  date: string
  /** Hora "HH:mm": reservas cuya sesión está en curso a esa hora. */
  time: string
}

export const EMPTY_SEARCH: BookingSearch = { code: '', name: '', date: '', time: '' }

/** Minúsculas, sin tildes ni espacios sobrantes: "  José " → "jose". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function isSearchActive(search: BookingSearch): boolean {
  return Object.values(search).some((v) => v.trim() !== '')
}

function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function matchesSearch(
  booking: Pick<Booking, 'id' | 'client_name' | 'starts_at' | 'ends_at'>,
  search: BookingSearch,
): boolean {
  const code = search.code.replace(/[#\s]/g, '').toUpperCase()
  if (code && !shortCode(booking.id).includes(code) && !booking.id.toUpperCase().includes(code)) {
    return false
  }

  const name = normalizeText(search.name)
  if (name && !normalizeText(booking.client_name).includes(name)) return false

  if (search.date && dayKey(booking.starts_at) !== search.date) return false

  const minutes = timeToMinutes(search.time)
  if (minutes !== null) {
    const start = minutesOfDay(booking.starts_at)
    const end = minutesOfDay(booking.ends_at)
    if (minutes < start || minutes >= end) return false
  }

  return true
}

export function filterBookings<T extends Pick<Booking, 'id' | 'client_name' | 'starts_at' | 'ends_at'>>(
  bookings: T[],
  search: BookingSearch,
): T[] {
  return isSearchActive(search) ? bookings.filter((b) => matchesSearch(b, search)) : bookings
}
