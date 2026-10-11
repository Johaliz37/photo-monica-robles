// Métricas del dashboard del admin. Lógica pura (sin Supabase), para poder testearla.
import { addDays, addWeeks, startOfWeek } from 'date-fns'
import { PACKAGES, type PackageCode } from '@/content/packages'
import { PRESALE } from '@/content/site'
import { occupancy } from './admin'
import type { AvailabilityWindow, Booking, BookingStatus } from './adminApi'
import { dayKey, monthKey, toMadrid } from './dates'

export interface CountBucket {
  /** Día "2026-11-02" (en semanas, el lunes). */
  key: string
  count: number
}

export interface PackageStats {
  code: PackageCode
  count: number
  revenueCents: number
}

export interface DashboardStats {
  total: number
  byStatus: Record<BookingStatus, number>
  /** Aceptadas / (aceptadas + rechazadas). null si aún no se ha revisado ninguna. */
  acceptanceRate: number | null
  /** Importe total de las reservas aceptadas. */
  revenueCents: number
  /** Adelantos de las reservas aceptadas. */
  depositsCents: number
  /** Lo que queda por cobrar en efectivo el día de la sesión (aceptadas). */
  dueAtSessionCents: number
  /** Importe de las reservas pendientes de revisar. */
  pendingCents: number
  /** Precio medio de las reservas activas (pendientes y aceptadas). */
  avgTicketCents: number | null
  /** Reservas activas con ampliación para bebé. */
  babyCount: number
  /** Reservas activas hechas durante la preventa. */
  presaleCount: number
  /** Reservas activas por paquete, en el orden del catálogo. */
  byPackage: PackageStats[]
  /** Reservas activas por semana de sesión (lunes a domingo), sin huecos. */
  bySessionWeek: CountBucket[]
  /** Reservas recibidas (cualquier estado) por día de creación, sin huecos. */
  receivedByDay: CountBucket[]
  /** Minutos de sesión reservados (activas) sobre los minutos abiertos en las franjas. */
  occupancy: { bookedMin: number; totalMin: number }
}

/** Periodo del dashboard: toda la temporada o un mes de sesión ("2026-11"). */
export type DashboardPeriod = 'todo' | string

const presaleStart = new Date(PRESALE.startsAt).getTime()
const presaleEnd = new Date(PRESALE.endsAt).getTime()

function isActive(b: Booking): boolean {
  return b.status !== 'rechazada'
}

function sum<T>(items: T[], value: (item: T) => number): number {
  return items.reduce((acc, item) => acc + value(item), 0)
}

/** Lunes (hora de Madrid) de la semana del instante, como clave "2026-11-02". */
export function weekKey(date: Date | string | number): string {
  return dayKey(startOfWeek(toMadrid(date), { weekStartsOn: 1 }))
}

/** Cuenta por clave y rellena con ceros los huecos entre la primera y la última. */
function countSeries(
  dates: string[],
  keyOf: (d: string) => string,
  step: (key: string) => string,
): CountBucket[] {
  if (dates.length === 0) return []
  const counts = new Map<string, number>()
  for (const d of dates) {
    const k = keyOf(d)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const keys = [...counts.keys()].sort()
  const last = keys[keys.length - 1]
  const series: CountBucket[] = []
  for (let k = keys[0]; k <= last; k = step(k)) {
    series.push({ key: k, count: counts.get(k) ?? 0 })
  }
  return series
}

// Mediodía de Madrid para que sumar días o semanas no se vea afectado por el cambio de hora
const noon = (key: string) => toMadrid(`${key}T12:00:00+01:00`)
const nextDay = (key: string) => dayKey(addDays(noon(key), 1))
const nextWeek = (key: string) => dayKey(addWeeks(noon(key), 1))

/** Meses (de sesión) que aparecen en las reservas, ordenados: ["2026-11", "2026-12"]. */
export function sessionMonths(bookings: Booking[]): string[] {
  return [...new Set(bookings.map((b) => monthKey(b.starts_at)))].sort()
}

export function computeDashboard(
  allBookings: Booking[],
  allWindows: AvailabilityWindow[],
  period: DashboardPeriod,
): DashboardStats {
  const inPeriod = (iso: string) => period === 'todo' || monthKey(iso) === period
  const bookings = allBookings.filter((b) => inPeriod(b.starts_at))
  const windows = allWindows.filter((w) => inPeriod(w.starts_at))

  const active = bookings.filter(isActive)
  const accepted = bookings.filter((b) => b.status === 'aceptada')
  const pending = bookings.filter((b) => b.status === 'pendiente')
  const rejected = bookings.filter((b) => b.status === 'rechazada')
  const reviewed = accepted.length + rejected.length

  const revenueCents = sum(accepted, (b) => b.price_cents)
  const depositsCents = sum(accepted, (b) => b.deposit_cents)

  const sessions = active.map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) }))
  let bookedMin = 0
  let totalMin = 0
  for (const w of windows) {
    const o = occupancy({ start: new Date(w.starts_at), end: new Date(w.ends_at) }, sessions)
    bookedMin += o.bookedMin
    totalMin += o.totalMin
  }

  return {
    total: bookings.length,
    byStatus: { pendiente: pending.length, aceptada: accepted.length, rechazada: rejected.length },
    acceptanceRate: reviewed > 0 ? accepted.length / reviewed : null,
    revenueCents,
    depositsCents,
    dueAtSessionCents: revenueCents - depositsCents,
    pendingCents: sum(pending, (b) => b.price_cents),
    avgTicketCents:
      active.length > 0 ? Math.round(sum(active, (b) => b.price_cents) / active.length) : null,
    babyCount: active.filter((b) => b.baby_extension).length,
    presaleCount: active.filter((b) => {
      const t = new Date(b.created_at).getTime()
      return t >= presaleStart && t <= presaleEnd
    }).length,
    byPackage: PACKAGES.map((p) => {
      const items = active.filter((b) => b.package_code === p.code)
      return { code: p.code, count: items.length, revenueCents: sum(items, (b) => b.price_cents) }
    }),
    bySessionWeek: countSeries(
      active.map((b) => b.starts_at),
      weekKey,
      nextWeek,
    ),
    receivedByDay: countSeries(
      bookings.map((b) => b.created_at),
      dayKey,
      nextDay,
    ),
    occupancy: { bookedMin, totalMin },
  }
}
