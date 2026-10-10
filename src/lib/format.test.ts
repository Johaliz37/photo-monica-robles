import { describe, expect, it } from 'vitest'
import { formatDateLong, formatTime } from './dates'
import { formatEUR } from './money'

// Intl usa espacios no separables antes del símbolo €
const normalize = (s: string) => s.replace(/\s/g, ' ')

describe('formatEUR', () => {
  it('formatea céntimos en euros (es-ES)', () => {
    expect(normalize(formatEUR(7650))).toBe('76,50 €')
    expect(normalize(formatEUR(2000))).toBe('20,00 €')
  })
})

describe('fechas en Europe/Madrid', () => {
  it('convierte UTC a hora de Madrid (horario de invierno)', () => {
    const date = '2026-11-07T09:30:00Z'
    expect(formatDateLong(date)).toBe('sábado, 7 de noviembre')
    expect(formatTime(date)).toBe('10:30')
  })

  it('respeta el horario de verano', () => {
    expect(formatTime('2026-10-11T08:00:00Z')).toBe('10:00')
  })
})
