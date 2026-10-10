// Lógica pura del panel de administración (sin Supabase), para poder testearla.
import { madridDateTime } from './dates'
import type { Range } from './slots'

const MINUTE = 60_000

/** Código corto que ve el cliente al reservar: "3F2A9C1B". */
export function shortCode(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

/** Horas "HH:mm" cada `stepMin` minutos, de `fromHour` a `toHour` incluidas. */
export function timeOptions(fromHour = 8, toHour = 21, stepMin = 15): string[] {
  const options: string[] = []
  for (let m = fromHour * 60; m <= toHour * 60; m += stepMin) {
    options.push(
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
    )
  }
  return options
}

/**
 * Una franja por día con la misma hora de inicio y fin (hora de Madrid, convertida a UTC).
 * Devuelve [] si la hora de fin no es posterior a la de inicio.
 */
export function buildWindows(days: Iterable<string>, startTime: string, endTime: string): Range[] {
  if (endTime <= startTime) return []
  return [...days].sort().map((day) => ({
    start: madridDateTime(day, startTime),
    end: madridDateTime(day, endTime),
  }))
}

/** Minutos de sesión reservados dentro de la franja (sin contar el margen) y minutos totales. */
export function occupancy(
  window: Range,
  sessions: Range[],
): { bookedMin: number; totalMin: number } {
  const ws = window.start.getTime()
  const we = window.end.getTime()
  let booked = 0
  for (const s of sessions) {
    booked += Math.max(0, Math.min(we, s.end.getTime()) - Math.max(ws, s.start.getTime()))
  }
  return { bookedMin: Math.round(booked / MINUTE), totalMin: Math.round((we - ws) / MINUTE) }
}

/** Enlace de WhatsApp. Los móviles de 9 cifras sin prefijo se asumen españoles (+34). */
export function whatsappUrl(phone: string): string {
  const trimmed = phone.trim()
  let digits = trimmed.replace(/\D/g, '')
  if (!trimmed.startsWith('+')) {
    if (digits.startsWith('00')) digits = digits.slice(2)
    else if (digits.length === 9) digits = `34${digits}`
  }
  return `https://wa.me/${digits}`
}
