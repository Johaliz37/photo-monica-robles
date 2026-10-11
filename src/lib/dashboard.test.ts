import { describe, expect, it } from 'vitest'
import type { AvailabilityWindow, Booking } from './adminApi'
import { computeDashboard, sessionMonths, weekKey } from './dashboard'

function booking(overrides: Partial<Booking>): Booking {
  return {
    id: crypto.randomUUID(),
    admin_note: null,
    baby_extension: false,
    blocked_until: '2026-11-07T09:45:00Z',
    client_name: 'Ana',
    created_at: '2026-10-12T10:00:00Z',
    deposit_cents: 2000,
    email: 'ana@example.com',
    ends_at: '2026-11-07T09:30:00Z',
    notes: null,
    package_code: 'P1',
    participants: '2 adultos',
    phone: '600000000',
    price_cents: 7650,
    privacy_consent_at: '2026-10-12T10:00:00Z',
    receipt_path: 'x.jpg',
    reviewed_at: null,
    starts_at: '2026-11-07T09:00:00Z',
    status: 'pendiente',
    ...overrides,
  }
}

const window: AvailabilityWindow = {
  id: 'w1',
  starts_at: '2026-11-07T09:00:00Z',
  ends_at: '2026-11-07T11:00:00Z',
} as AvailabilityWindow

describe('weekKey', () => {
  it('devuelve el lunes de la semana en hora de Madrid', () => {
    expect(weekKey('2026-11-07T09:00:00Z')).toBe('2026-11-02')
    // Domingo 8 a las 23:30 en Madrid sigue siendo la semana del 2
    expect(weekKey('2026-11-08T22:30:00Z')).toBe('2026-11-02')
    // Lunes 9 a las 00:30 en Madrid ya es la semana siguiente
    expect(weekKey('2026-11-08T23:30:00Z')).toBe('2026-11-09')
  })
})

describe('computeDashboard', () => {
  const bookings = [
    booking({ status: 'aceptada', price_cents: 7650, baby_extension: true }),
    booking({
      status: 'aceptada',
      package_code: 'P3',
      price_cents: 19500,
      created_at: '2026-10-20T10:00:00Z',
      starts_at: '2026-11-07T10:00:00Z',
      ends_at: '2026-11-07T10:45:00Z',
    }),
    booking({
      status: 'pendiente',
      package_code: 'P2',
      price_cents: 14500,
      created_at: '2026-10-20T10:00:00Z',
      starts_at: '2026-11-16T10:00:00Z',
      ends_at: '2026-11-16T10:30:00Z',
    }),
    booking({ status: 'rechazada', price_cents: 8500, starts_at: '2026-12-05T10:00:00Z' }),
  ]

  it('calcula contadores, importes y tasas de toda la temporada', () => {
    const s = computeDashboard(bookings, [window], 'todo')
    expect(s.total).toBe(4)
    expect(s.byStatus).toEqual({ pendiente: 1, aceptada: 2, rechazada: 1 })
    expect(s.acceptanceRate).toBeCloseTo(2 / 3)
    expect(s.revenueCents).toBe(27150)
    expect(s.depositsCents).toBe(4000)
    expect(s.dueAtSessionCents).toBe(23150)
    expect(s.pendingCents).toBe(14500)
    expect(s.avgTicketCents).toBe(Math.round((7650 + 19500 + 14500) / 3))
    expect(s.babyCount).toBe(1)
    expect(s.presaleCount).toBe(1)
    expect(s.byPackage.map((p) => [p.code, p.count])).toEqual([
      ['P1', 1],
      ['P2', 1],
      ['P3', 1],
    ])
  })

  it('agrupa por semana y por día rellenando los huecos con ceros', () => {
    const s = computeDashboard(bookings, [], 'todo')
    expect(s.bySessionWeek).toEqual([
      { key: '2026-11-02', count: 2 },
      { key: '2026-11-09', count: 0 },
      { key: '2026-11-16', count: 1 },
    ])
    expect(s.receivedByDay).toHaveLength(9)
    expect(s.receivedByDay[0]).toEqual({ key: '2026-10-12', count: 2 })
    expect(s.receivedByDay[8]).toEqual({ key: '2026-10-20', count: 2 })
  })

  it('calcula la ocupación solo con reservas activas dentro de las franjas', () => {
    expect(computeDashboard(bookings, [window], 'todo').occupancy).toEqual({
      bookedMin: 75,
      totalMin: 120,
    })
  })

  it('filtra por mes de sesión', () => {
    const s = computeDashboard(bookings, [window], '2026-12')
    expect(s.total).toBe(1)
    expect(s.acceptanceRate).toBe(0)
    expect(s.avgTicketCents).toBeNull()
    expect(s.occupancy).toEqual({ bookedMin: 0, totalMin: 0 })
  })

  it('lista los meses con reservas', () => {
    expect(sessionMonths(bookings)).toEqual(['2026-11', '2026-12'])
  })
})
