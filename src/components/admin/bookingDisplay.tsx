import { findPackage } from '@/content/packages'
import type { Booking } from '@/lib/adminApi'

/** "Paquete 02" (+ icono si hay ampliación para bebé). */
export function PackageLabel({ booking }: { booking: Booking }) {
  const pkg = findPackage(booking.package_code)
  return (
    <span className="whitespace-nowrap">
      {pkg ? `Paquete ${pkg.number} · ${pkg.name}` : booking.package_code}
      {booking.baby_extension && (
        <span title="Con ampliación para bebé" className="ml-1">
          <span aria-hidden="true">👶</span>
          <span className="sr-only"> con ampliación para bebé</span>
        </span>
      )}
    </span>
  )
}
