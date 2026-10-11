import { describe, expect, it } from 'vitest'
import {
  EMPTY_SEARCH,
  filterBookings,
  isSearchActive,
  matchesSearch,
  normalizeText,
} from './bookingSearch'

// 7 nov 2026 (CET, UTC+1): 10:00–10:45 y 17:30–18:00 en Madrid
const ana = {
  id: '3f2a9c1b-0000-4000-8000-000000000001',
  client_name: 'Ana María Núñez',
  starts_at: '2026-11-07T09:00:00Z',
  ends_at: '2026-11-07T09:45:00Z',
}
const jose = {
  id: 'a1b2c3d4-0000-4000-8000-000000000002',
  client_name: 'José Pérez',
  starts_at: '2026-11-07T16:30:00Z',
  ends_at: '2026-11-07T17:00:00Z',
}

describe('normalizeText', () => {
  it('quita tildes, mayúsculas y espacios', () => {
    expect(normalizeText('  José NÚÑEZ ')).toBe('jose nunez')
  })
})

describe('isSearchActive', () => {
  it('es falso con la búsqueda vacía o solo espacios', () => {
    expect(isSearchActive(EMPTY_SEARCH)).toBe(false)
    expect(isSearchActive({ ...EMPTY_SEARCH, name: '   ' })).toBe(false)
    expect(isSearchActive({ ...EMPTY_SEARCH, date: '2026-11-07' })).toBe(true)
  })
})

describe('matchesSearch', () => {
  it('busca por código sin distinguir mayúsculas, con # o parcial', () => {
    expect(matchesSearch(ana, { ...EMPTY_SEARCH, code: '3f2a' })).toBe(true)
    expect(matchesSearch(ana, { ...EMPTY_SEARCH, code: '#3F2A9C1B' })).toBe(true)
    expect(matchesSearch(jose, { ...EMPTY_SEARCH, code: '3F2A' })).toBe(false)
  })

  it('busca por nombre sin tildes', () => {
    expect(matchesSearch(ana, { ...EMPTY_SEARCH, name: 'nunez' })).toBe(true)
    expect(matchesSearch(jose, { ...EMPTY_SEARCH, name: 'jose p' })).toBe(true)
    expect(matchesSearch(jose, { ...EMPTY_SEARCH, name: 'ana' })).toBe(false)
  })

  it('busca por día de Madrid', () => {
    expect(matchesSearch(ana, { ...EMPTY_SEARCH, date: '2026-11-07' })).toBe(true)
    expect(matchesSearch(ana, { ...EMPTY_SEARCH, date: '2026-11-08' })).toBe(false)
  })

  it('busca por hora: la sesión debe estar en curso a esa hora (hora de Madrid)', () => {
    expect(matchesSearch(ana, { ...EMPTY_SEARCH, time: '10:00' })).toBe(true)
    expect(matchesSearch(ana, { ...EMPTY_SEARCH, time: '10:30' })).toBe(true)
    expect(matchesSearch(ana, { ...EMPTY_SEARCH, time: '10:45' })).toBe(false)
    expect(matchesSearch(jose, { ...EMPTY_SEARCH, time: '17:30' })).toBe(true)
  })

  it('combina todos los criterios', () => {
    const search = { code: 'a1b2', name: 'pérez', date: '2026-11-07', time: '17:45' }
    expect(matchesSearch(jose, search)).toBe(true)
    expect(matchesSearch(jose, { ...search, time: '09:00' })).toBe(false)
  })
})

describe('filterBookings', () => {
  it('devuelve la misma lista si no hay búsqueda', () => {
    const list = [ana, jose]
    expect(filterBookings(list, EMPTY_SEARCH)).toBe(list)
    expect(filterBookings(list, { ...EMPTY_SEARCH, name: 'ana' })).toEqual([ana])
  })
})
