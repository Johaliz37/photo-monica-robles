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
  booking: Booking
  back: string
}

export default function BookingCard({ booking: b, back }: Props) {
  const pkg = findPackage(b.package_code)
  const theme = pkg ? PACKAGE_THEME[pkg.code] : null

  return (
    <article
      className={`overflow-hidden rounded-sm border-l-4 bg-white/80 shadow-sm ring-1 ${
        theme ? `${theme.border} ${theme.ring}` : 'border-gold-light ring-gold-light/50'
      }`}
    >
      <Link
        to={`/admin/reservas/${b.id}`}
        state={{ back }}
        className="block space-y-2 p-4 hover:bg-cream/60"
      >
        <div className="flex items-start justify-between gap-3">
          <p
            className={`rounded-full px-3 py-1 font-semibold first-letter:uppercase ${bookingColorClass(b)}`}
          >
            {formatDateShort(b.starts_at)} · {formatTime(b.starts_at)}
          </p>
          <StatusBadge status={b.status} />
        </div>
        <p className="font-semibold">{b.client_name}</p>
        <p className="flex justify-between gap-3 text-sm">
          <span className={`font-semibold ${theme?.text ?? 'text-gold-dark'}`}>
            <PackageLabel booking={b} />
          </span>
          <span className="font-semibold tabular-nums">{formatEUR(b.price_cents)}</span>
        </p>
        <p className="text-xs text-ink/70">Recibida el {formatDateTime(b.created_at)}</p>
      </Link>
      <div className="flex border-t border-gold-light/40 text-sm font-semibold">
        <a
          href={`tel:${b.phone}`}
          className="flex min-h-11 flex-1 items-center gap-2 px-4 text-teal hover:bg-teal/10"
        >
          <span aria-hidden="true">📞</span> {b.phone}
        </a>
        <a
          href={whatsappUrl(b.phone)}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center gap-2 border-l border-gold-light/40 px-4 text-pine hover:bg-pine/10"
        >
          <WhatsAppIcon className="size-5 text-whatsapp" /> WhatsApp
        </a>
      </div>
    </article>
  )
}
