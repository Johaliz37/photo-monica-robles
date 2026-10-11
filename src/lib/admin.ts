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

/** Día de la semana de "2026-11-07" con el lunes como 0 y el domingo como 6. */
export function weekdayIndex(day: string): number {
  const [y, m, d] = day.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

/** Días del mes ("2026-11") que caen en los días de la semana indicados (0 = lunes), desde `fromDay`. */
export function monthDays(month: string, weekdays: ReadonlySet<number>, fromDay = ''): string[] {
  const [y, m] = month.split('-').map(Number)
  const count = new Date(y, m, 0).getDate()
  const days: string[] = []
  for (let d = 1; d <= count; d++) {
    const key = `${month}-${String(d).padStart(2, '0')}`
    if (key >= fromDay && weekdays.has(weekdayIndex(key))) days.push(key)
  }
  return days
}

/** Tramo horario "HH:mm"–"HH:mm" (hora de Madrid). */
export interface TimeRange {
  start: string
  end: string
}

/** Horario en el que NO se está disponible un día concreto (hora de Madrid). */
export interface Exclusion extends TimeRange {
  day: string
}

/** Error de las franjas horarias de la base, o null si son válidas. */
export function rangesError(ranges: TimeRange[]): string | null {
  if (ranges.some((r) => r.end <= r.start)) return 'Cada franja debe terminar después de empezar.'
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start))
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].end) return 'Las franjas horarias no pueden solaparse.'
  }
  return null
}

/** Resta a [start, end) los tramos excluidos. Horas "HH:mm"; devuelve los tramos que quedan. */
export function subtractTimes(
  start: string,
  end: string,
  exclusions: { start: string; end: string }[],
): { start: string; end: string }[] {
  let pieces = start < end ? [{ start, end }] : []
  for (const ex of exclusions) {
    pieces = pieces.flatMap((p) => {
      if (ex.end <= p.start || ex.start >= p.end) return [p]
      const rest = []
      if (ex.start > p.start) rest.push({ start: p.start, end: ex.start })
      if (ex.end < p.end) rest.push({ start: ex.end, end: p.end })
      return rest
    })
  }
  return pieces
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Franjas de un mes: las mismas franjas horarias base en cada día, menos los horarios no
 * disponibles de ese día (que pueden partir una franja en dos). Se descartan los tramos de
 * menos de `minMin`. Devuelve [] si las franjas base no son válidas.
 */
export function buildMonthWindows(
  days: Iterable<string>,
  ranges: TimeRange[],
  exclusions: Exclusion[],
  minMin = 0,
): Range[] {
  if (rangesError(ranges)) return []
  const sortedRanges = [...ranges].sort((a, b) => a.start.localeCompare(b.start))
  return [...days].sort().flatMap((day) => {
    const dayExclusions = exclusions.filter((ex) => ex.day === day)
    return sortedRanges
      .flatMap((r) => subtractTimes(r.start, r.end, dayExclusions))
      .filter((p) => toMinutes(p.end) - toMinutes(p.start) >= Math.max(1, minMin))
      .map((p) => ({ start: madridDateTime(day, p.start), end: madridDateTime(day, p.end) }))
  })
}

/** Sesiones que no caben enteras en ninguna de las franjas (mismo criterio que create_booking). */
export function uncoveredSessions<T extends Range>(sessions: T[], windows: Range[]): T[] {
  return sessions.filter(
    (s) =>
      !windows.some(
        (w) => w.start.getTime() <= s.start.getTime() && s.end.getTime() <= w.end.getTime(),
      ),
  )
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

// Vive en profile.ts para que la web pública no cargue este módulo (y date-fns)
export { whatsappUrl } from './profile'
