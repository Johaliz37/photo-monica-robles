import { Link } from 'react-router-dom'
import type { Package } from '@/content/packages'
import { shortCode } from '@/lib/admin'
import BookingSummary from './BookingSummary'
import { BUTTON_PRIMARY } from './Stepper'

type Props = {
  bookingId: string
  pkg: Package
  baby: boolean
  startsAt: string
  now: Date
}

export default function StepDone({ bookingId, pkg, baby, startsAt, now }: Props) {
  return (
    <div className="space-y-6 text-center">
      <p>
        Tu reserva está <strong className="font-semibold">pendiente de comprobación</strong>. Mónica
        revisará tu comprobante y te confirmará.
      </p>
      <p className="text-sm">
        Código de reserva:{' '}
        <strong className="font-display text-lg tracking-[0.15em] text-gold-dark">
          {shortCode(bookingId)}
        </strong>
      </p>
      <div className="text-left">
        <BookingSummary pkg={pkg} baby={baby} startsAt={startsAt} now={now} />
      </div>
      <Link to="/" className={`inline-block ${BUTTON_PRIMARY}`}>
        Volver al inicio
      </Link>
    </div>
  )
}
