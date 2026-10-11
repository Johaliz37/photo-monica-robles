import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { PackageLabel } from '@/components/admin/bookingDisplay'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import ReceiptViewer from '@/components/admin/ReceiptViewer'
import Spinner from '@/components/admin/Spinner'
import StatusBadge from '@/components/admin/StatusBadge'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/booking/Stepper'
import { PACKAGE_THEME } from '@/components/packageTheme'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { findPackage } from '@/content/packages'
import { shortCode, whatsappUrl } from '@/lib/admin'
import { fetchBooking, reviewBooking, type Booking } from '@/lib/adminApi'
import { formatDateLong, formatDateTime, formatTime } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'
import { formatEUR } from '@/lib/money'

type Action = 'aceptar' | 'rechazar' | 'cancelar'

const ACTIONS: Record<
  Action,
  { status: 'aceptada' | 'rechazada'; title: string; confirm: string; toast: string }
> = {
  aceptar: {
    status: 'aceptada',
    title: '¿Aceptar la reserva?',
    confirm: 'Aceptar',
    toast: 'Reserva aceptada',
  },
  rechazar: {
    status: 'rechazada',
    title: '¿Rechazar la reserva?',
    confirm: 'Rechazar',
    toast: 'Reserva rechazada',
  },
  cancelar: {
    status: 'rechazada',
    title: '¿Cancelar la reserva aceptada?',
    confirm: 'Cancelar reserva',
    toast: 'Reserva rechazada',
  },
}

// Aceptar en verde pino y rechazar en rojo, sobre los botones base de la web
const BUTTON_ACCEPT = BUTTON_PRIMARY.replaceAll('bg-gold-dark', 'bg-pine').replace(
  'hover:bg-ink',
  'hover:bg-teal',
)
const BUTTON_REJECT = BUTTON_SECONDARY.replace('text-gold-dark', 'text-xmas-red')
  .replace('ring-gold-light', 'ring-xmas-red')
  .replace('hover:bg-cream-dark', 'hover:bg-xmas-red/10')

export default function AdminBookingDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { back?: string } | null)?.back
  const back = state?.startsWith('/admin') ? state : '/admin/reservas'

  const [booking, setBooking] = useState<Booking | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchBooking(id)
      .then((b) => !cancelled && setBooking(b))
      .catch((err) => !cancelled && setLoadError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [id])

  function open(next: Action) {
    setAction(next)
    setNote('')
    setActionError(null)
  }

  async function confirm() {
    if (!action || !booking) return
    setBusy(true)
    setActionError(null)
    try {
      await reviewBooking(booking.id, ACTIONS[action].status, note)
      navigate(back, { state: { toast: ACTIONS[action].toast } })
    } catch (err) {
      setActionError(errorMessage(err))
      setBusy(false)
    }
  }

  const backLink = (
    <Link
      to={back}
      className="inline-flex min-h-11 items-center rounded-full bg-gold-dark/10 px-4 text-sm font-semibold text-gold-dark transition hover:bg-gold-dark/20"
    >
      ← Volver
    </Link>
  )

  if (loadError) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        {backLink}
        <p role="alert" className="mt-4 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {loadError}
        </p>
      </section>
    )
  }
  if (booking === undefined) return <Spinner />
  if (booking === null) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8">
        {backLink}
        <p className="mt-4 text-sm">No se ha encontrado la reserva.</p>
      </section>
    )
  }

  const durationMin = Math.round(
    (new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60_000,
  )
  const rest = booking.price_cents - booking.deposit_cents
  const pkg = findPackage(booking.package_code)
  const theme = pkg ? PACKAGE_THEME[pkg.code] : null
  // Sobre el amarillo del paquete 1 el texto va oscuro (contraste)
  const pkgTextClass = pkg?.code === 'P1' ? 'text-ink' : 'text-cream'

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      {backLink}

      <header className="relative mt-4 mb-6 overflow-hidden rounded-sm bg-teal p-5 text-cream shadow-md sm:p-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 -right-2 text-8xl opacity-15 select-none"
        >
          ❄
        </span>
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-leaf">
              Reserva {shortCode(booking.id)}
            </p>
            <h1 className="mt-1 font-display text-2xl tracking-[0.1em]">{booking.client_name}</h1>
            <p className="mt-1 text-sm first-letter:uppercase">
              {formatDateLong(booking.starts_at)} · {formatTime(booking.starts_at)} –{' '}
              {formatTime(booking.ends_at)}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2 text-sm font-semibold">
          <span className={`rounded-full px-3 py-1 ${theme ? `${theme.bg} ${pkgTextClass}` : 'bg-cream/15'}`}>
            <PackageLabel booking={booking} />
          </span>
          <span className="rounded-full bg-cream/15 px-3 py-1 ring-1 ring-cream/30">
            {durationMin} min
          </span>
          <span className="rounded-full bg-leaf px-3 py-1 text-teal tabular-nums">
            {formatEUR(booking.price_cents)}
          </span>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card title="Importe" icon="💶" accent="border-honey" titleClass="text-honey-dark">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Amount label="Total" value={booking.price_cents} className="bg-honey/20 text-ink" />
              <Amount
                label="Adelanto"
                value={booking.deposit_cents}
                className="bg-pine/10 text-pine"
              />
              <Amount label="Resto" value={rest} className="bg-teal/10 text-teal" />
            </div>
            <p className="pt-1 text-xs text-ink/70">El resto se paga en efectivo el día de la sesión.</p>
          </Card>

          <Card title="Cliente" icon="👤" accent="border-pine" titleClass="text-pine">
            <Row term="Email">
              <a href={`mailto:${booking.email}`} className="break-all text-teal underline">
                {booking.email}
              </a>
            </Row>
            <Row term="Participantes">
              <span className="whitespace-pre-line">{booking.participants}</span>
            </Row>
            {booking.notes && (
              <p className="rounded-sm bg-honey/15 px-3 py-2 italic text-ink/80 whitespace-pre-line">
                “{booking.notes}”
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2 font-semibold">
              <a
                href={`tel:${booking.phone}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-teal/10 px-4 text-teal ring-1 ring-teal/30 hover:bg-teal/20"
              >
                <span aria-hidden="true">📞</span> {booking.phone}
              </a>
              <a
                href={whatsappUrl(booking.phone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-whatsapp/10 px-4 text-pine ring-1 ring-whatsapp/50 hover:bg-whatsapp/20"
              >
                <WhatsAppIcon className="size-5 text-whatsapp" /> WhatsApp
              </a>
            </div>
          </Card>

          <Card title="Registro" icon="🗂" accent="border-gold-light" titleClass="text-gold-dark">
            <Row term="Recibida">{formatDateTime(booking.created_at)}</Row>
            <Row term="Consentimiento">{formatDateTime(booking.privacy_consent_at)}</Row>
            {booking.reviewed_at && (
              <Row term="Revisada">{formatDateTime(booking.reviewed_at)}</Row>
            )}
            {booking.admin_note && (
              <Row term="Nota interna">
                <span className="whitespace-pre-line">{booking.admin_note}</span>
              </Row>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Comprobante" icon="🧾" accent="border-xmas-red" titleClass="text-xmas-red">
            <ReceiptViewer path={booking.receipt_path} />
          </Card>

          {booking.status !== 'rechazada' && (
            <div className="flex flex-col gap-3 sm:flex-row">
              {booking.status === 'pendiente' ? (
                <>
                  <button
                    type="button"
                    onClick={() => open('aceptar')}
                    className={`${BUTTON_ACCEPT} flex-1`}
                  >
                    ✓ Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => open('rechazar')}
                    className={`${BUTTON_REJECT} flex-1`}
                  >
                    ✕ Rechazar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => open('cancelar')}
                  className={BUTTON_REJECT}
                >
                  Cancelar (rechazar)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={action !== null}
        title={action ? ACTIONS[action].title : ''}
        confirmLabel={action ? ACTIONS[action].confirm : ''}
        tone={action === 'aceptar' ? 'primary' : 'danger'}
        busy={busy}
        error={actionError}
        onConfirm={confirm}
        onCancel={() => setAction(null)}
      >
        <p>
          {booking.client_name} · {formatDateLong(booking.starts_at)},{' '}
          {formatTime(booking.starts_at)}
        </p>
        {action !== 'aceptar' && <p>El hueco quedará libre de nuevo para otras reservas.</p>}
        <label className="block">
          Nota interna (opcional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            className="mt-1 block w-full rounded-sm bg-white/70 p-3 ring-1 ring-gold-light"
          />
        </label>
      </ConfirmDialog>
    </section>
  )
}

type CardProps = {
  title: string
  icon: string
  /** Color de la franja superior (clase border-*). */
  accent: string
  titleClass: string
  children: React.ReactNode
}

function Card({ title, icon, accent, titleClass, children }: CardProps) {
  return (
    <div className={`rounded-sm border-t-4 bg-white/80 p-5 shadow-sm ring-1 ring-gold-light/40 ${accent}`}>
      <h2
        className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${titleClass}`}
      >
        <span aria-hidden="true" className="text-base">
          {icon}
        </span>
        {title}
      </h2>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  )
}

function Amount({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <dl className={`rounded-sm px-2 py-3 ${className}`}>
      <dt className="text-[0.65rem] uppercase tracking-[0.15em] opacity-80">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums">{formatEUR(value)}</dd>
    </dl>
  )
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <dl className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink/70">{term}</dt>
      <dd className="text-right">{children}</dd>
    </dl>
  )
}
