import type { Package } from '@/content/packages'
import { BOOKING } from '@/content/site'
import { formatDateLong, formatTime } from '@/lib/dates'
import { formatEUR } from '@/lib/money'
import { bookingTotal } from '@/lib/pricing'

type Props = {
  pkg: Package
  baby: boolean
  startsAt: string | null
  now: Date
}

export default function BookingSummary({ pkg, baby, startsAt, now }: Props) {
  const durationMin = pkg.durationMin + (baby ? BOOKING.babyExtraMin : 0)
  const total = bookingTotal(pkg, baby, now)
  const endsAt = startsAt ? new Date(new Date(startsAt).getTime() + durationMin * 60_000) : null

  return (
    <div className="rounded-sm bg-white/50 p-5 ring-1 ring-gold-light/40">
      <dl className="space-y-2 text-sm">
        <Row term="Paquete">
          Paquete {pkg.number} · {pkg.durationMin} min
        </Row>
        {baby && (
          <Row term="Ampliación bebé">
            +{BOOKING.babyExtraMin} min · +{formatEUR(BOOKING.babyExtraCents)}
          </Row>
        )}
        {startsAt && endsAt && (
          <>
            <Row term="Fecha">
              <span className="block first-letter:uppercase">{formatDateLong(startsAt)}</span>
            </Row>
            <Row term="Hora">
              {formatTime(startsAt)} – {formatTime(endsAt)}
            </Row>
          </>
        )}
        <Row term="Total">
          <strong className="font-semibold">{formatEUR(total)}</strong>
        </Row>
        <Row term="Adelanto (Bizum o transferencia)">{formatEUR(BOOKING.depositCents)}</Row>
      </dl>
      <p className="mt-4 border-t border-gold-light/40 pt-3 text-sm">
        Resto (<strong className="font-semibold">{formatEUR(total - BOOKING.depositCents)}</strong>)
        en efectivo el día de la sesión.
      </p>
    </div>
  )
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/70">{term}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}
