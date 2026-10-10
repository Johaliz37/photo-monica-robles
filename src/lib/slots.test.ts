import { describe, expect, it } from 'vitest'
import { formatTime } from './dates'
import { getStartTimes, groupByMadridDay, type Range } from './slots'

const range = (start: string, end: string): Range => ({
  start: new Date(start),
  end: new Date(end),
})
const times = (dates: Date[]) => dates.map(formatTime)

// Sábado 7 de noviembre de 2026 (horario de invierno, +01:00)
const WINDOW = range('2026-11-07T10:00:00+01:00', '2026-11-07T12:00:00+01:00')
const base = { bufferMin: 15, stepMin: 15, now: new Date('2026-11-01T12:00:00+01:00') }

describe('getStartTimes', () => {
  it('genera horas cada 15 min que caben en la franja (P3, 45 min)', () => {
    const result = getStartTimes({ ...base, windows: [WINDOW], busy: [], durationMin: 45 })
    expect(times(result)).toEqual(['10:00', '10:15', '10:30', '10:45', '11:00', '11:15'])
  })

  it('excluye las horas que solapan una reserva (P1, 30 min)', () => {
    const busy = [range('2026-11-07T10:00:00+01:00', '2026-11-07T11:00:00+01:00')]
    const result = times(getStartTimes({ ...base, windows: [WINDOW], busy, durationMin: 30 }))
    expect(result).toEqual(['11:00', '11:15', '11:30'])
    expect(result).not.toContain('09:30')
  })

  it('respeta el margen tras la sesión antes de otra reserva', () => {
    const busy = [range('2026-11-07T11:00:00+01:00', '2026-11-07T11:45:00+01:00')]
    const result = getStartTimes({ ...base, windows: [WINDOW], busy, durationMin: 30 })
    // 10:15 + 30 + 15 = 11:00 (toca, no solapa); 10:30 ya pisaría la reserva
    expect(times(result)).toEqual(['10:00', '10:15'])
  })

  it('la ampliación bebé alarga la sesión (P3 + 15 = 60 min)', () => {
    const result = getStartTimes({ ...base, windows: [WINDOW], busy: [], durationMin: 60 })
    expect(times(result).at(-1)).toBe('11:00')
  })

  it('excluye horas pasadas o con menos de 2 h de antelación', () => {
    const now = new Date('2026-11-07T09:00:00+01:00')
    const result = getStartTimes({ ...base, now, windows: [WINDOW], busy: [], durationMin: 30 })
    // 11:00 es justo now + 2 h: el servidor lo rechaza (<=), así que tampoco se ofrece
    expect(times(result)).toEqual(['11:15', '11:30'])

    const later = new Date('2026-11-07T13:00:00+01:00')
    expect(
      getStartTimes({ ...base, now: later, windows: [WINDOW], busy: [], durationMin: 30 }),
    ).toEqual([])
  })

  it('funciona el día del cambio de hora (25/10/2026)', () => {
    const window = range('2026-10-25T10:00:00+01:00', '2026-10-25T12:00:00+01:00')
    const now = new Date('2026-10-20T12:00:00+02:00')
    const result = getStartTimes({ ...base, now, windows: [window], busy: [], durationMin: 30 })
    expect(times(result)).toEqual(['10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30'])
    expect(result[0].toISOString()).toBe('2026-10-25T09:00:00.000Z')
  })

  it('sin franjas ni reservas devuelve []', () => {
    expect(getStartTimes({ ...base, windows: [], busy: [], durationMin: 30 })).toEqual([])
  })
})

describe('groupByMadridDay', () => {
  it('agrupa por el día de Madrid, no por el de UTC', () => {
    const late = new Date('2026-11-06T23:30:00Z') // 00:30 del 7 en Madrid
    const morning = new Date('2026-11-07T09:00:00Z')
    const other = new Date('2026-11-08T09:00:00Z')
    const days = groupByMadridDay([late, morning, other])
    expect([...days.keys()]).toEqual(['2026-11-07', '2026-11-08'])
    expect(days.get('2026-11-07')).toEqual([late, morning])
  })
})
