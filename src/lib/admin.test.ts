import { describe, expect, it } from 'vitest'
import {
  mergeRanges,
  occupancy,
  shortCode,
  subtractTimes,
  timeOptions,
  uncoveredSessions,
  weekdayIndex,
  whatsappUrl,
} from './admin'
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

describe('weekdayIndex', () => {
  it('usa el lunes como 0 y el domingo como 6', () => {
    expect(weekdayIndex('2026-11-02')).toBe(0) // lunes
    expect(weekdayIndex('2026-11-08')).toBe(6) // domingo
  })
})

describe('subtractTimes', () => {
  it('parte el horario en dos si la excepción cae en medio', () => {
    expect(subtractTimes('10:00', '14:00', [{ start: '11:00', end: '12:00' }])).toEqual([
      { start: '10:00', end: '11:00' },
      { start: '12:00', end: '14:00' },
    ])
  })

  it('recorta por los bordes y aplica varias excepciones', () => {
    expect(
      subtractTimes('10:00', '18:00', [
        { start: '09:00', end: '10:30' },
        { start: '17:00', end: '20:00' },
        { start: '13:00', end: '14:00' },
      ]),
    ).toEqual([
      { start: '10:30', end: '13:00' },
      { start: '14:00', end: '17:00' },
    ])
  })

  it('no deja nada si se excluye todo el horario', () => {
    expect(subtractTimes('10:00', '14:00', [{ start: '10:00', end: '14:00' }])).toEqual([])
  })
})

describe('mergeRanges', () => {
  it('ordena y fusiona los tramos que se solapan o se tocan', () => {
    const merged = mergeRanges(
      [
        { start: '13:00', end: '15:00' },
        { start: '17:00', end: '19:00' },
      ],
      [
        { start: '09:00', end: '14:00' },
        { start: '15:00', end: '16:00' },
      ],
    )
    expect(merged).toEqual([
      { start: '09:00', end: '16:00' },
      { start: '17:00', end: '19:00' },
    ])
  })
})

describe('uncoveredSessions', () => {
  it('devuelve las sesiones que no caben enteras en ninguna franja', () => {
    const windows = [
      { start: new Date('2026-11-07T08:00:00Z'), end: new Date('2026-11-07T13:00:00Z') },
    ]
    const inside = {
      start: new Date('2026-11-07T12:30:00Z'),
      end: new Date('2026-11-07T13:00:00Z'),
    }
    const crossing = {
      start: new Date('2026-11-07T12:45:00Z'),
      end: new Date('2026-11-07T13:15:00Z'),
    }
    expect(uncoveredSessions([inside, crossing], windows)).toEqual([crossing])
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

  it('añade el mensaje codificado', () => {
    expect(whatsappUrl('612345678', '¿Hay hueco el sábado?')).toBe(
      'https://wa.me/34612345678?text=%C2%BFHay%20hueco%20el%20s%C3%A1bado%3F',
    )
  })
})

describe('shortCode', () => {
  it('usa los 8 primeros caracteres en mayúsculas', () => {
    expect(shortCode('3f2a9c1b-0000-4000-8000-000000000000')).toBe('3F2A9C1B')
  })
})
