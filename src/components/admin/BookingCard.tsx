import { Link } from 'react-router-dom'
import type { Booking } from '@/lib/adminApi'
import { formatDateShort, formatDateTime, formatTime } from '@/lib/dates'
import { formatEUR } from '@/lib/money'
import { PackageLabel } from './bookingDisplay'
import StatusBadge from './StatusBadge'

type Props = {
  booking: Booking
  back: string
}

export default function BookingCard({ booking: b, back }: Props) {
  return (
    <article className="rounded-sm bg-white/50 ring-1 ring-gold-light/50">
      <Link
        to={`/admin/reservas/${b.id}`}
        state={{ back }}
        className="block space-y-2 p-4 hover:bg-white/40"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold first-letter:uppercase">
            {formatDateShort(b.starts_at)} · {formatTime(b.starts_at)}
          </p>
          <StatusBadge status={b.status} />
        </div>
        <p>{b.client_name}</p>
        <p className="flex justify-between text-sm">
          <PackageLabel booking={b} />
          <span className="tabular-nums">{formatEUR(b.price_cents)}</span>
        </p>
        <p className="text-xs text-ink/70">Recibida el {formatDateTime(b.created_at)}</p>
      </Link>
      <a
        href={`tel:${b.phone}`}
        className="flex min-h-11 items-center border-t border-gold-light/40 px-4 text-sm text-gold-dark"
      >
        Llamar · {b.phone}
      </a>
    </article>
  )
}
