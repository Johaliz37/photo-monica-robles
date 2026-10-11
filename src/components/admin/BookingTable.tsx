import { Link } from 'react-router-dom'
import { bookingColorClass, PACKAGE_THEME } from '@/components/packageTheme'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { findPackage } from '@/content/packages'
import { whatsappUrl } from '@/lib/admin'
import type { Booking } from '@/lib/adminApi'
import { formatDateShort, formatDateTime, formatTime } from '@/lib/dates'
import { formatEUR } from '@/lib/money'
import { PackageLabel } from './bookingDisplay'
import StatusBadge from './StatusBadge'

type Props = {
  bookings: Booking[]
  /** Ruta de la lista (con su query string), para volver a la misma pestaña desde el detalle. */
  back: string
}

export default function BookingTable({ bookings, back }: Props) {
  return (
    <div className="overflow-x-auto rounded-sm bg-white/80 shadow-sm ring-1 ring-gold-light/40">
      <table className="w-full text-left text-sm">
        <thead className="bg-teal text-xs uppercase tracking-[0.15em] text-cream">
          <tr>
            <th className="py-3 pr-4 pl-4 font-semibold">Sesión</th>
            <th className="py-3 pr-4 font-semibold">Paquete</th>
            <th className="py-3 pr-4 font-semibold">Cliente</th>
            <th className="py-3 pr-4 font-semibold">Teléfono</th>
            <th className="py-3 pr-4 text-right font-semibold">Total</th>
            <th className="py-3 pr-4 font-semibold">Estado</th>
            <th className="py-3 pr-4 font-semibold">Recibida</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const pkg = findPackage(b.package_code)
            const theme = pkg ? PACKAGE_THEME[pkg.code] : null
            return (
              <tr
                key={b.id}
                className="border-b border-gold-light/30 last:border-0 odd:bg-cream/40 hover:bg-leaf/15"
              >
                <td className="py-3 pr-4 pl-4 whitespace-nowrap">
                  <Link
                    to={`/admin/reservas/${b.id}`}
                    state={{ back }}
                    className={`inline-block rounded-full px-3 py-1 font-semibold first-letter:uppercase hover:brightness-95 ${bookingColorClass(b)}`}
                  >
                    {formatDateShort(b.starts_at)} · {formatTime(b.starts_at)}
                  </Link>
                </td>
                <td className={`py-3 pr-4 font-semibold ${theme?.text ?? 'text-gold-dark'}`}>
                  <PackageLabel booking={b} />
                </td>
                <td className="py-3 pr-4">{b.client_name}</td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <a href={`tel:${b.phone}`} className="text-teal hover:underline">
                      {b.phone}
                    </a>
                    <a
                      href={whatsappUrl(b.phone)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`WhatsApp a ${b.client_name}`}
                      className="rounded-full p-1 hover:bg-whatsapp/15"
                    >
                      <WhatsAppIcon className="size-4 text-whatsapp" />
                    </a>
                  </span>
                </td>
                <td className="py-3 pr-4 text-right font-semibold whitespace-nowrap tabular-nums">
                  {formatEUR(b.price_cents)}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={b.status} />
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-ink/70">
                  {formatDateTime(b.created_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
