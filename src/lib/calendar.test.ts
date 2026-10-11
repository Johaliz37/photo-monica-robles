import { describe, expect, it } from 'vitest'
import { groupByDay, hourBounds, shiftAnchor, verticalSpan, visibleDays } from './calendar'

describe('visibleDays', () => {
  it('la vista de día es solo ese día', () => {
    expect(visibleDays('day', '2026-11-07')).toEqual(['2026-11-07'])
  })

  it('la semana va de lunes a domingo', () => {
    const days = visibleDays('week', '2026-11-07')
    expect(days).toHaveLength(7)
    expect(days[0]).toBe('2026-11-02')
    expect(days[6]).toBe('2026-11-08')
  })

  it('el mes completa semanas enteras con días del mes anterior y siguiente', () => {
    // Noviembre de 2026 empieza en domingo y acaba en lunes
    const days = visibleDays('month', '2026-11-15')
    expect(days[0]).toBe('2026-10-26')
    expect(days.at(-1)).toBe('2026-12-06')
    expect(days).toHaveLength(42)
  })

  it('cruza el cambio de hora sin saltarse ni repetir días', () => {
    const days = visibleDays('week', '2026-10-25')
    expect(days).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
  })
})

describe('shiftAnchor', () => {
  it('avanza y retrocede por día, semana y mes', () => {
    expect(shiftAnchor('day', '2026-11-30', 1)).toBe('2026-12-01')
    expect(shiftAnchor('week', '2026-11-07', -1)).toBe('2026-10-31')
    expect(shiftAnchor('month', '2026-12-31', -1)).toBe('2026-11-30')
  })
})

describe('hourBounds', () => {
  it('sin eventos usa el rango por defecto', () => {
    expect(hourBounds([])).toEqual([9, 20])
  })

  it('redondea a horas en punto en hora de Madrid', () => {
    expect(
      hourBounds([
        // 10:30–11:00 y 17:00–18:15 en Madrid (UTC+1 en noviembre)
        { starts_at: '2026-11-07T09:30:00Z', ends_at: '2026-11-07T10:00:00Z' },
        { starts_at: '2026-11-08T16:00:00Z', ends_at: '2026-11-08T17:15:00Z' },
      ]),
    ).toEqual([10, 19])
  })

  it('un evento hasta medianoche llega al final del día', () => {
    expect(hourBounds([{ starts_at: '2026-11-07T21:00:00Z', ends_at: '2026-11-07T23:00:00Z' }])).toEqual([
      22, 24,
    ])
  })
})

describe('verticalSpan', () => {
  it('calcula la posición desde el inicio de la rejilla', () => {
    // 10:30–11:15 en Madrid, rejilla desde las 9
    expect(
      verticalSpan({ starts_at: '2026-11-07T09:30:00Z', ends_at: '2026-11-07T10:15:00Z' }, [9, 20]),
    ).toEqual({ top: 90, height: 45 })
  })

  it('recorta lo que queda fuera de la rejilla', () => {
    expect(
      verticalSpan({ starts_at: '2026-11-07T07:00:00Z', ends_at: '2026-11-07T09:00:00Z' }, [9, 20]),
    ).toEqual({ top: 0, height: 60 })
  })
})

describe('groupByDay', () => {
  it('agrupa por el día de Madrid, no por el de UTC', () => {
    // 23:30 UTC del 7 = 00:30 del 8 en Madrid
    const late = { starts_at: '2026-11-07T23:30:00Z', ends_at: '2026-11-08T00:00:00Z' }
    expect([...groupByDay([late]).keys()]).toEqual(['2026-11-08'])
  })
})
