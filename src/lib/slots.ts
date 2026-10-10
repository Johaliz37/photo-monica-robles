// Cálculo de horas de inicio válidas. Replica las reglas de create_booking (que es quien manda).
import { dayKey } from './dates'

export interface Range {
  start: Date
  end: Date
}

const MINUTE = 60_000

export function getStartTimes(params: {
  /** Franjas publicadas. */
  windows: Range[]
  /** [starts_at, blocked_until) de las reservas activas. */
  busy: Range[]
  /** Duración del paquete + ampliación bebé. */
  durationMin: number
  /** Margen tras la sesión. */
  bufferMin: number
  stepMin: number
  now: Date
  /** Antelación mínima, igual que en create_booking. */
  minLeadMin?: number
}): Date[] {
  const { windows, busy, durationMin, bufferMin, stepMin, now, minLeadMin = 120 } = params
  if (stepMin <= 0 || durationMin <= 0) return []

  const earliest = now.getTime() + minLeadMin * MINUTE
  const duration = durationMin * MINUTE
  const blocked = (durationMin + bufferMin) * MINUTE
  const step = stepMin * MINUTE
  const valid = new Set<number>()

  for (const w of windows) {
    const windowEnd = w.end.getTime()
    // Se suma en milisegundos (UTC): el cambio de hora no desalinea los candidatos
    for (let t = w.start.getTime(); t + duration <= windowEnd; t += step) {
      if (t <= earliest) continue
      const until = t + blocked
      if (busy.some((b) => t < b.end.getTime() && b.start.getTime() < until)) continue
      valid.add(t)
    }
  }

  return [...valid].sort((a, b) => a - b).map((t) => new Date(t))
}

/** Agrupa por día de Madrid ("2026-11-07"), conservando el orden. */
export function groupByMadridDay(dates: Date[]): Map<string, Date[]> {
  const days = new Map<string, Date[]>()
  for (const date of dates) {
    const key = dayKey(date)
    const list = days.get(key)
    if (list) list.push(date)
    else days.set(key, [date])
  }
  return days
}
