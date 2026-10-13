// Lógica pura del panel de administración (sin Supabase), para poder testearla.
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

/** Tramo horario "HH:mm"–"HH:mm" (hora de Madrid). */
export interface TimeRange {
  start: string
  end: string
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

/** "10:30" → 630. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Une varias listas de tramos: ordena y fusiona los que se solapan o se tocan (09–14 + 13–15 → 09–15). */
export function mergeRanges(...lists: TimeRange[][]): TimeRange[] {
  const sorted = lists
    .flat()
    .filter((r) => r.start < r.end)
    .sort((a, b) => a.start.localeCompare(b.start))
  const merged: TimeRange[] = []
  for (const r of sorted) {
    const last = merged[merged.length - 1]
    if (last && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end
    } else {
      merged.push({ start: r.start, end: r.end })
    }
  }
  return merged
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
