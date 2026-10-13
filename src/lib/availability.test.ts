import { describe, expect, it } from 'vitest'
import {
  dayAvailability,
  formatDays,
  previewChange,
  repeatLabel,
  ruleDays,
  rulesByDay,
  windowsForDays,
  type Rule,
} from './availability'

const rule = (patch: Partial<Rule>): Rule => ({
  id: 'r1',
  kind: 'disponible',
  day: '2026-10-12',
  start: '09:00',
  end: '14:00',
  repeat: 'unico',
  until: null,
  ...patch,
})

const booking = (id: string, startsAt: string, endsAt: string) => ({
  id,
  starts_at: startsAt,
  ends_at: endsAt,
})

describe('ruleDays', () => {
  it('único: solo el día elegido', () => {
    expect(ruleDays(rule({}))).toEqual(['2026-10-12'])
  })

  it('mes: ese día de la semana en todo su mes', () => {
    expect(ruleDays(rule({ repeat: 'mes' }))).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ])
  })

  it('hasta: desde el mes del día elegido hasta la fecha indicada, incluida', () => {
    const days = ruleDays(rule({ repeat: 'hasta', until: '2026-12-14' }))
    expect(days[0]).toBe('2026-10-05')
    expect(days.at(-1)).toBe('2026-12-14')
    expect(days).toHaveLength(11)
    expect(ruleDays(rule({ repeat: 'hasta', until: '2026-12-13' })).at(-1)).toBe('2026-12-07')
  })
})

describe('dayAvailability', () => {
  it('une lo disponible, resta lo no disponible y descarta los tramos cortos', () => {
    const rules = [
      rule({ id: 'a', start: '09:00', end: '12:00' }),
      rule({ id: 'b', start: '11:00', end: '14:00' }),
      rule({ id: 'c', kind: 'no_disponible', start: '09:15', end: '10:00' }),
      rule({ id: 'd', kind: 'no_disponible', start: '12:00', end: '12:30' }),
    ]
    expect(dayAvailability(rules, 30)).toEqual([
      { start: '10:00', end: '12:00' },
      { start: '12:30', end: '14:00' },
    ])
  })

  it('un no disponible sin nada disponible no crea franjas', () => {
    expect(dayAvailability([rule({ kind: 'no_disponible' })])).toEqual([])
  })
})

describe('rulesByDay y windowsForDays', () => {
  it('reparte las series por día y calcula las franjas en hora de Madrid', () => {
    const rules = [
      rule({ id: 'serie', repeat: 'mes' }),
      rule({ id: 'tarde', day: '2026-10-26', start: '16:00', end: '18:00' }),
    ]
    const byDay = rulesByDay(rules)
    expect(byDay.get('2026-10-26')?.map((r) => r.id)).toEqual(['serie', 'tarde'])
    expect(byDay.has('2026-10-13')).toBe(false)

    const windows = windowsForDays(rules, ['2026-10-26', '2026-10-19'])
    // El 25 de octubre cambia la hora: el 19 es UTC+2 y el 26, UTC+1
    expect(windows.map((w) => [w.start.toISOString(), w.end.toISOString()])).toEqual([
      ['2026-10-19T07:00:00.000Z', '2026-10-19T12:00:00.000Z'],
      ['2026-10-26T08:00:00.000Z', '2026-10-26T13:00:00.000Z'],
      ['2026-10-26T15:00:00.000Z', '2026-10-26T17:00:00.000Z'],
    ])
  })
})

describe('previewChange', () => {
  const today = '2026-10-13'
  const series = rule({ id: 'serie', repeat: 'hasta', until: '2026-11-30' })
  // Lunes 19 de octubre, 10:00–10:30 (UTC+2)
  const monday = booking('b1', '2026-10-19T08:00:00Z', '2026-10-19T08:30:00Z')

  it('nuevo rango: días desde hoy, sin días quitados', () => {
    const preview = previewChange([], { id: null, rule: rule({ repeat: 'mes' }) }, [], today)
    expect(preview).toEqual({ days: ['2026-10-19', '2026-10-26'], removedDays: [], conflicts: [] })
  })

  it('acortar una serie avisa de los días que desaparecen', () => {
    const preview = previewChange(
      [series],
      { id: 'serie', rule: { ...series, repeat: 'mes' } },
      [],
      today,
    )
    expect(preview.removedDays).toEqual([
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
    ])
  })

  it('no deja marcar como no disponible el horario de una reserva', () => {
    const blocked = rule({ kind: 'no_disponible', day: '2026-10-19', start: '10:00', end: '11:00' })
    const preview = previewChange([series], { id: null, rule: blocked }, [monday], today)
    expect(preview.conflicts).toEqual([monday])
  })

  it('no deja borrar una serie con reservas, salvo que otro rango las siga cubriendo', () => {
    const remove = { id: 'serie', rule: null } as const
    expect(previewChange([series], remove, [monday], today).conflicts).toEqual([monday])

    const cover = rule({ id: 'otro', day: '2026-10-19', start: '10:00', end: '12:00' })
    expect(previewChange([series, cover], remove, [monday], today).conflicts).toEqual([])
  })

  it('una reserva que deja de caber entera en la franja también bloquea el cambio', () => {
    const edited = { ...series, start: '10:15' }
    expect(
      previewChange([series], { id: 'serie', rule: edited }, [monday], today).conflicts,
    ).toEqual([monday])
  })
})

describe('repeatLabel y formatDays', () => {
  it('describe la repetición en español', () => {
    expect(repeatLabel(rule({}))).toBe('Solo este día')
    expect(repeatLabel(rule({ repeat: 'mes', day: '2026-10-17' }))).toBe(
      'Todos los sábados de octubre',
    )
    expect(repeatLabel(rule({ repeat: 'hasta', until: '2026-12-14' }))).toBe(
      'Todos los lunes desde octubre hasta el 14 de diciembre',
    )
    expect(formatDays(['2026-10-12', '2026-10-19'])).toBe('lun 12 oct, lun 19 oct')
  })
})
