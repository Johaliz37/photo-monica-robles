// Cálculos de precio solo para MOSTRAR. El importe real lo calcula create_booking en el servidor.
import type { Package } from '@/content/packages'
import { BOOKING, PRESALE } from '@/content/site'

const presaleStart = new Date(PRESALE.startsAt).getTime()
const presaleEnd = new Date(PRESALE.endsAt).getTime()

export type PresaleStatus = 'upcoming' | 'active' | 'ended'

export function presaleStatus(now: Date): PresaleStatus {
  const t = now.getTime()
  if (t < presaleStart) return 'upcoming'
  if (t <= presaleEnd) return 'active'
  return 'ended'
}

export function isPresale(now: Date): boolean {
  return presaleStatus(now) === 'active'
}

export interface PackagePrice {
  /** Precio a pagar ahora, en céntimos. */
  current: number
  /** Precio sin descuento (solo si hay descuento). */
  original?: number
  discounted: boolean
}

export function packagePrice(pkg: Package, now: Date): PackagePrice {
  if (isPresale(now)) {
    return { current: pkg.presalePriceCents, original: pkg.priceCents, discounted: true }
  }
  return { current: pkg.priceCents, discounted: false }
}

/** Total de la sesión: paquete (con descuento si aplica) + ampliación bebé. */
export function bookingTotal(pkg: Package, baby: boolean, now: Date): number {
  return packagePrice(pkg, now).current + (baby ? BOOKING.babyExtraCents : 0)
}
