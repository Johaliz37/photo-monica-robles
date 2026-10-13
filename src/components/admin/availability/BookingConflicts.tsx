import { Link } from 'react-router-dom'
import { findPackage } from '@/content/packages'
import { shortCode } from '@/lib/admin'
import type { Booking } from '@/lib/adminApi'
import { formatDateLong, formatTime } from '@/lib/dates'

type Props = {
  bookings: Booking[]
  /** "guardar este rango", "eliminar la serie"… */
  action: string
}

/** Aviso que bloquea un cambio de disponibilidad porque dejaría reservas activas fuera. */
export default function BookingConflicts({ bookings, action }: Props) {
  if (bookings.length === 0) return null
  const one = bookings.length === 1
  return (
    <div role="alert" className="rounded-sm bg-xmas-red/10 p-3 text-sm text-xmas-red">
      <p className="font-semibold">
        No se puede {action}:{' '}
        {one ? 'esta reserva activa se quedaría' : 'estas reservas activas se quedarían'} sin
        disponibilidad que la{one ? '' : 's'} cubra.
      </p>
      <ul className="mt-2 space-y-1">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link to={`/admin/reservas/${b.id}`} className="font-semibold underline">
              {shortCode(b.id)}
            </Link>{' '}
            ·{' '}
            <span className="inline-block first-letter:uppercase">
              {formatDateLong(b.starts_at)}
            </span>
            , {formatTime(b.starts_at)}–{formatTime(b.ends_at)} · {b.client_name} ·{' '}
            {findPackage(b.package_code)?.name ?? b.package_code} · {b.status}
          </li>
        ))}
      </ul>
      <p className="mt-2">
        Ajusta el rango para que {one ? 'la' : 'las'} siga cubriendo, o rechaza o cancela antes{' '}
        {one ? 'la reserva' : 'esas reservas'}.
      </p>
    </div>
  )
}
