import { Link } from 'react-router-dom'
import type { Booking } from '@/lib/adminApi'
import { formatDateShort, formatDateTime, formatTime } from '@/lib/dates'
import { formatEUR } from '@/lib/money'
import { PackageLabel } from './bookingDisplay'
import StatusBadge from './StatusBadge'

type Props = {
  bookings: Booking[]
  /** Query string de la lista, para volver a la misma pestaña desde el detalle. */
  back: string
}

export default function BookingTable({ bookings, back }: Props) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-gold-light/60 text-xs uppercase tracking-[0.15em] text-ink/70">
        <tr>
          <th className="py-2 pr-4 font-normal">Sesión</th>
          <th className="py-2 pr-4 font-normal">Paquete</th>
          <th className="py-2 pr-4 font-normal">Cliente</th>
          <th className="py-2 pr-4 font-normal">Teléfono</th>
          <th className="py-2 pr-4 text-right font-normal">Total</th>
          <th className="py-2 pr-4 font-normal">Estado</th>
          <th className="py-2 font-normal">Recibida</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((b) => (
          <tr key={b.id} className="border-b border-gold-light/30 hover:bg-white/40">
            <td className="py-3 pr-4 whitespace-nowrap">
              <Link
                to={`/admin/reservas/${b.id}`}
                state={{ back }}
                className="inline-block text-gold-dark underline underline-offset-4 first-letter:uppercase"
              >
                {formatDateShort(b.starts_at)} · {formatTime(b.starts_at)}
              </Link>
            </td>
            <td className="py-3 pr-4">
              <PackageLabel booking={b} />
            </td>
            <td className="py-3 pr-4">{b.client_name}</td>
            <td className="py-3 pr-4 whitespace-nowrap">
              <a href={`tel:${b.phone}`} className="hover:text-gold-dark">
                {b.phone}
              </a>
            </td>
            <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
              {formatEUR(b.price_cents)}
            </td>
            <td className="py-3 pr-4">
              <StatusBadge status={b.status} />
            </td>
            <td className="py-3 whitespace-nowrap text-ink/70">{formatDateTime(b.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
