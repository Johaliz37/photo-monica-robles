import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { PackageLabel } from '@/components/admin/bookingDisplay'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import ReceiptViewer from '@/components/admin/ReceiptViewer'
import Spinner from '@/components/admin/Spinner'
import StatusBadge from '@/components/admin/StatusBadge'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/components/booking/Stepper'
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

export default function AdminBookingDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const back = (location.state as { back?: string } | null)?.back ?? ''

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
      navigate(`/admin${back}`, { state: { toast: ACTIONS[action].toast } })
    } catch (err) {
      setActionError(errorMessage(err))
      setBusy(false)
    }
  }

  const backLink = (
    <Link
      to={`/admin${back}`}
      className="inline-block py-2 text-sm text-gold-dark underline underline-offset-4"
    >
      ← Volver a la lista
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

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      {backLink}

      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-[0.15em] text-gold-dark">
          Reserva {shortCode(booking.id)}
        </h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card title="Sesión">
            <Row term="Fecha">
              <span className="inline-block first-letter:uppercase">
                {formatDateLong(booking.starts_at)}
              </span>
            </Row>
            <Row term="Hora">
              {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
            </Row>
            <Row term="Paquete">
              <PackageLabel booking={booking} /> · {durationMin} min
            </Row>
          </Card>

          <Card title="Importe">
            <Row term="Total">
              <strong className="font-semibold">{formatEUR(booking.price_cents)}</strong>
            </Row>
            <Row term="Adelanto">{formatEUR(booking.deposit_cents)}</Row>
            <Row term="Resto en efectivo">{formatEUR(rest)}</Row>
          </Card>

          <Card title="Cliente">
            <Row term="Nombre">{booking.client_name}</Row>
            <Row term="Email">
              <a href={`mailto:${booking.email}`} className="break-all text-gold-dark underline">
                {booking.email}
              </a>
            </Row>
            <Row term="Teléfono">
              <a href={`tel:${booking.phone}`} className="text-gold-dark underline">
                {booking.phone}
              </a>
              {' · '}
              <a
                href={whatsappUrl(booking.phone)}
                target="_blank"
                rel="noreferrer"
                className="text-gold-dark underline"
              >
                WhatsApp
              </a>
            </Row>
            <Row term="Participantes">
              <span className="whitespace-pre-line">{booking.participants}</span>
            </Row>
            {booking.notes && (
              <Row term="Notas">
                <span className="whitespace-pre-line">{booking.notes}</span>
              </Row>
            )}
          </Card>

          <Card title="Registro">
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
          <Card title="Comprobante">
            <ReceiptViewer path={booking.receipt_path} />
          </Card>

          {booking.status !== 'rechazada' && (
            <div className="flex flex-col gap-3 sm:flex-row">
              {booking.status === 'pendiente' ? (
                <>
                  <button type="button" onClick={() => open('aceptar')} className={BUTTON_PRIMARY}>
                    Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => open('rechazar')}
                    className={BUTTON_SECONDARY}
                  >
                    Rechazar
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => open('cancelar')} className={BUTTON_SECONDARY}>
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm bg-white/50 p-5 ring-1 ring-gold-light/40">
      <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-ink/70">{title}</h2>
      <dl className="space-y-2 text-sm">{children}</dl>
    </div>
  )
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink/70">{term}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}
