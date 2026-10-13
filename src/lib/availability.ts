// Rangos de disponibilidad del panel (lógica pura). Replica, solo para la vista previa, las
// funciones SQL de 0006_availability_rules.sql (availability_rule_days, availability_day_ranges y
// rebuild_availability), que son las que mandan.
import { addDays, format, lastDayOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  mergeRanges,
  subtractTimes,
  toMinutes,
  uncoveredSessions,
  weekdayIndex,
  type TimeRange,
} from './admin'
import { calendarDate } from './calendar'
import { dayKey, madridDateTime } from './dates'
import type { Range } from './slots'

export type RuleKind = 'disponible' | 'no_disponible'
/** unico: solo ese día · mes: ese día de la semana en todo su mes · hasta: desde su mes hasta `until`. */
export type RuleRepeat = 'unico' | 'mes' | 'hasta'

/** Rango horario sobre un día del calendario (hora de Madrid), único o en serie. */
export interface RuleInput extends TimeRange {
  kind: RuleKind
  /** Día elegido en el calendario: marca el día de la semana de la serie. */
  day: string
  repeat: RuleRepeat
  /** Último día de la serie cuando repeat = 'hasta'. */
  until: string | null
}

export interface Rule extends RuleInput {
  id: string
}

const toKey = (date: Date) => format(date, 'yyyy-MM-dd')

/**
 * Días en los que se aplica el rango: el propio día; o ese día de la semana en todo su mes;
 * o ese día de la semana desde el día 1 de su mes hasta `until`.
 */
export function ruleDays(rule: Pick<RuleInput, 'day' | 'repeat' | 'until'>): string[] {
  if (rule.repeat === 'unico') return [rule.day]
  const first = calendarDate(`${rule.day.slice(0, 7)}-01`)
  const last = rule.repeat === 'mes' ? lastDayOfMonth(first) : calendarDate(rule.until ?? rule.day)
  const weekday = weekdayIndex(rule.day)
  const days: string[] = []
  for (let d = first; d <= last; d = addDays(d, 1)) {
    const key = toKey(d)
    if (weekdayIndex(key) === weekday) days.push(key)
  }
  return days
}

/** Rangos que se aplican en cada día, ordenados por hora de inicio. */
export function rulesByDay<T extends RuleInput>(rules: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const rule of rules) {
    for (const day of ruleDays(rule)) map.set(day, [...(map.get(day) ?? []), rule])
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.start.localeCompare(b.start) || a.kind.localeCompare(b.kind))
  }
  return map
}

/** Tramos reservables de un día: lo disponible menos lo no disponible, sin los de menos de `minMin`. */
export function dayAvailability(rulesOfDay: RuleInput[], minMin = 0): TimeRange[] {
  const blocked = rulesOfDay.filter((r) => r.kind === 'no_disponible')
  return mergeRanges(rulesOfDay.filter((r) => r.kind === 'disponible'))
    .flatMap((r) => subtractTimes(r.start, r.end, blocked))
    .filter((p) => toMinutes(p.end) - toMinutes(p.start) >= Math.max(1, minMin))
}

/** Franjas (instantes) que salen de los rangos en esos días. */
export function windowsForDays(rules: RuleInput[], days: Iterable<string>, minMin = 0): Range[] {
  const byDay = rulesByDay(rules)
  return [...days].sort().flatMap((day) =>
    dayAvailability(byDay.get(day) ?? [], minMin).map((p) => ({
      start: madridDateTime(day, p.start),
      end: madridDateTime(day, p.end),
    })),
  )
}

/** Crear (id null), editar o borrar (rule null) un rango. */
export type RuleChange = { id: string | null; rule: RuleInput } | { id: string; rule: null }

export interface ChangePreview<B> {
  /** Días (desde hoy) en los que se aplicará el rango. */
  days: string[]
  /** Días (desde hoy) en los que el rango deja de aplicarse al editarlo o borrarlo. */
  removedDays: string[]
  /** Reservas activas que quedarían sin disponibilidad que las cubra: impiden el cambio. */
  conflicts: B[]
}

/**
 * Qué pasaría al aplicar el cambio: días afectados y reservas activas que se quedarían fuera
 * (mismo criterio que rebuild_availability). Los días anteriores a `today` no se tocan.
 */
export function previewChange<B extends { starts_at: string; ends_at: string }>(
  rules: Rule[],
  change: RuleChange,
  bookings: B[],
  today: string,
  minMin = 0,
): ChangePreview<B> {
  const old = change.id ? rules.find((r) => r.id === change.id) : undefined
  const rest: RuleInput[] = rules.filter((r) => r.id !== change.id)
  const next = change.rule ? [...rest, change.rule] : rest
  const days = change.rule ? ruleDays(change.rule).filter((d) => d >= today) : []
  const oldDays = old ? ruleDays(old).filter((d) => d >= today) : []
  const removedDays = oldDays.filter((d) => !days.includes(d))
  const affected = new Set([...oldDays, ...days])
  const windows = windowsForDays(next, affected, minMin)
  const conflicts = uncoveredSessions(
    bookings
      .filter((b) => affected.has(dayKey(b.starts_at)))
      .map((b) => ({ booking: b, start: new Date(b.starts_at), end: new Date(b.ends_at) })),
    windows,
  ).map((s) => s.booking)
  return { days, removedDays, conflicts }
}

const WEEKDAYS_PLURAL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos']

/** "Solo este día", "Todos los lunes de octubre", "Todos los lunes desde octubre hasta el 14 de diciembre". */
export function repeatLabel(rule: Pick<RuleInput, 'day' | 'repeat' | 'until'>): string {
  if (rule.repeat === 'unico') return 'Solo este día'
  const weekdays = `Todos los ${WEEKDAYS_PLURAL[weekdayIndex(rule.day)]}`
  const month = format(calendarDate(rule.day), 'LLLL', { locale: es })
  if (rule.repeat === 'mes') return `${weekdays} de ${month}`
  const until = format(calendarDate(rule.until ?? rule.day), "d 'de' MMMM", { locale: es })
  return `${weekdays} desde ${month} hasta el ${until}`
}

/** "lun 12 oct, lun 19 oct". */
export function formatDays(days: string[]): string {
  return days.map((d) => format(calendarDate(d), 'EEE d MMM', { locale: es })).join(', ')
}
