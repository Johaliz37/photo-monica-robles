import { describe, expect, it } from 'vitest'
import { buildWindows, occupancy, shortCode, timeOptions, whatsappUrl } from './admin'
import { madridDateTime, startOfMadridDay } from './dates'

describe('madridDateTime', () => {
  it('convierte la hora de Madrid a UTC en invierno y en verano', () => {
    expect(madridDateTime('2026-11-07', '10:00').toISOString()).toBe('2026-11-07T09:00:00.000Z')
    expect(madridDateTime('2026-10-17', '10:00').toISOString()).toBe('2026-10-17T08:00:00.000Z')
  })

  it('calcula la medianoche de Madrid', () => {
    expect(startOfMadridDay('2026-11-06T23:30:00Z').toISOString()).toBe('2026-11-06T23:00:00.000Z')
  })
})

describe('buildWindows', () => {
  it('crea una franja por día, ordenadas, respetando el cambio de hora', () => {
    const windows = buildWindows(['2026-10-31', '2026-10-24'], '10:00', '14:00')
    expect(windows.map((w) => [w.start.toISOString(), w.end.toISOString()])).toEqual([
      ['2026-10-24T08:00:00.000Z', '2026-10-24T12:00:00.000Z'],
      ['2026-10-31T09:00:00.000Z', '2026-10-31T13:00:00.000Z'],
    ])
  })

  it('no crea nada si la hora de fin no es posterior a la de inicio', () => {
    expect(buildWindows(['2026-11-07'], '14:00', '14:00')).toEqual([])
    expect(buildWindows(['2026-11-07'], '14:00', '10:00')).toEqual([])
  })
})

describe('occupancy', () => {
  const window = { start: new Date('2026-11-07T09:00:00Z'), end: new Date('2026-11-07T13:00:00Z') }

  it('suma los minutos de sesión dentro de la franja', () => {
    const sessions = [
      { start: new Date('2026-11-07T09:00:00Z'), end: new Date('2026-11-07T09:30:00Z') },
      { start: new Date('2026-11-07T10:00:00Z'), end: new Date('2026-11-07T10:45:00Z') },
    ]
    expect(occupancy(window, sessions)).toEqual({ bookedMin: 75, totalMin: 240 })
  })

  it('ignora lo que queda fuera de la franja', () => {
    const sessions = [
      { start: new Date('2026-11-07T12:45:00Z'), end: new Date('2026-11-07T13:15:00Z') },
      { start: new Date('2026-11-08T09:00:00Z'), end: new Date('2026-11-08T09:30:00Z') },
    ]
    expect(occupancy(window, sessions)).toEqual({ bookedMin: 15, totalMin: 240 })
  })
})

describe('timeOptions', () => {
  it('genera horas cada 15 minutos', () => {
    const options = timeOptions(9, 10)
    expect(options).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00'])
  })
})

describe('whatsappUrl', () => {
  it('añade +34 a los móviles españoles sin prefijo', () => {
    expect(whatsappUrl('612345678')).toBe('https://wa.me/34612345678')
  })

  it('respeta el prefijo internacional', () => {
    expect(whatsappUrl('+33612345678')).toBe('https://wa.me/33612345678')
    expect(whatsappUrl('0033612345678')).toBe('https://wa.me/33612345678')
  })
})

describe('shortCode', () => {
  it('usa los 8 primeros caracteres en mayúsculas', () => {
    expect(shortCode('3f2a9c1b-0000-4000-8000-000000000000')).toBe('3F2A9C1B')
  })
})
