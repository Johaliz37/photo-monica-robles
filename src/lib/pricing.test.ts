import { describe, expect, it } from 'vitest'
import { PACKAGES } from '@/content/packages'
import { bookingTotal, isPresale, packagePrice, presaleStatus } from './pricing'

const [p1, p2, p3] = PACKAGES
const before = new Date('2026-10-10T23:59:59+02:00')
const start = new Date('2026-10-11T00:00:00+02:00')
const during = new Date('2026-10-14T12:00:00+02:00')
const lastSecond = new Date('2026-10-16T23:59:59+02:00')
const after = new Date('2026-10-17T00:00:00+02:00')

describe('preventa', () => {
  it('detecta el estado según la hora de Madrid', () => {
    expect(presaleStatus(before)).toBe('upcoming')
    expect(presaleStatus(start)).toBe('active')
    expect(presaleStatus(during)).toBe('active')
    expect(presaleStatus(lastSecond)).toBe('active')
    expect(presaleStatus(after)).toBe('ended')
    expect(isPresale(before)).toBe(false)
    expect(isPresale(during)).toBe(true)
    expect(isPresale(after)).toBe(false)
  })

  it('los precios de preventa son un 10 % menos', () => {
    for (const pkg of PACKAGES) {
      expect(pkg.presalePriceCents).toBe(Math.round(pkg.priceCents * 0.9))
    }
  })
})

describe('packagePrice', () => {
  it('antes de la preventa aplica el precio normal', () => {
    expect(packagePrice(p1, before)).toEqual({ current: 8500, discounted: false })
  })

  it('durante la preventa aplica el descuento', () => {
    expect(packagePrice(p1, during)).toEqual({ current: 7650, original: 8500, discounted: true })
    expect(packagePrice(p2, during).current).toBe(13050)
    expect(packagePrice(p3, during).current).toBe(17550)
  })

  it('después de la preventa vuelve al precio normal', () => {
    expect(packagePrice(p3, after)).toEqual({ current: 19500, discounted: false })
  })
})

describe('bookingTotal', () => {
  it('sin ampliación bebé es el precio del paquete', () => {
    expect(bookingTotal(p2, false, during)).toBe(13050)
    expect(bookingTotal(p2, false, after)).toBe(14500)
  })

  it('la ampliación bebé suma 20 € (sin descuento)', () => {
    expect(bookingTotal(p1, true, during)).toBe(7650 + 2000)
    expect(bookingTotal(p3, true, after)).toBe(19500 + 2000)
  })
})
