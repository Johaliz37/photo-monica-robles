// Lógica del calendario del panel (vistas día, semana y mes). Los días son claves "2026-11-07"
// de Madrid; las fechas de date-fns se usan solo como fechas de calendario, sin hora.
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { dayKey, minutesOfDay } from './dates'

export type CalendarMode = 'day' | 'week' | 'month'

const WEEK = { weekStartsOn: 1 } as const

/** Fecha de calendario (sin hora) a partir de "2026-11-07". */
export function calendarDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const toKey = (date: Date) => format(date, 'yyyy-MM-dd')

/**
 * Días que se pintan en cada vista. El mes incluye los días de la semana anterior y
 * posterior hasta completar semanas de lunes a domingo, como Google Calendar.
 */
export function visibleDays(mode: CalendarMode, anchor: string): string[] {
  const date = calendarDate(anchor)
  if (mode === 'day') return [anchor]
  const first = mode === 'week' ? startOfWeek(date, WEEK) : startOfWeek(startOfMonth(date), WEEK)
  const last = mode === 'week' ? endOfWeek(date, WEEK) : endOfWeek(endOfMonth(date), WEEK)
  const count = differenceInCalendarDays(last, first) + 1
  return Array.from({ length: count }, (_, i) => toKey(addDays(first, i)))
}

/** Mueve el día de referencia un periodo (día, semana o mes) hacia delante o atrás. */
export function shiftAnchor(mode: CalendarMode, anchor: string, delta: number): string {
  const date = calendarDate(anchor)
  if (mode === 'day') return toKey(addDays(date, delta))
  if (mode === 'week') return toKey(addWeeks(date, delta))
  return toKey(addMonths(date, delta))
}

interface Timed {
  starts_at: string
  ends_at: string
}

/**
 * Horas que abarca la rejilla de día/semana: de la hora en punto anterior al primer
 * evento a la hora en punto posterior al último. Sin eventos, de `fallback[0]` a `fallback[1]`.
 */
export function hourBounds(items: Timed[], fallback: [number, number] = [9, 20]): [number, number] {
  if (items.length === 0) return fallback
  let first = 24 * 60
  let last = 0
  for (const item of items) {
    first = Math.min(first, minutesOfDay(item.starts_at))
    // Un evento que termina a medianoche (o al día siguiente) llega hasta el final del día
    const end = dayKey(item.ends_at) === dayKey(item.starts_at) ? minutesOfDay(item.ends_at) : 24 * 60
    last = Math.max(last, end)
  }
  return [Math.floor(first / 60), Math.min(24, Math.ceil(last / 60))]
}

/** Posición vertical en minutos (desde el inicio de la rejilla) y duración de un evento. */
export function verticalSpan(item: Timed, [startHour, endHour]: [number, number]) {
  const gridStart = startHour * 60
  const gridEnd = endHour * 60
  const start = Math.max(gridStart, minutesOfDay(item.starts_at))
  const end =
    dayKey(item.ends_at) === dayKey(item.starts_at)
      ? Math.min(gridEnd, minutesOfDay(item.ends_at))
      : gridEnd
  return { top: start - gridStart, height: Math.max(0, end - start) }
}

/** Agrupa por día de Madrid (por la hora de inicio). */
export function groupByDay<T extends Timed>(items: T[]): Map<string, T[]> {
  const days = new Map<string, T[]>()
  for (const item of items) {
    const key = dayKey(item.starts_at)
    days.set(key, [...(days.get(key) ?? []), item])
  }
  return days
}
