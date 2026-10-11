import { addDays } from 'date-fns'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminContext } from '@/components/admin/AdminLayout'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { PackageLabel } from '@/components/admin/bookingDisplay'
import StatusBadge from '@/components/admin/StatusBadge'
import { bookingColorClass, PACKAGE_THEME } from '@/components/packageTheme'
import { Skeleton, SkeletonGroup } from '@/components/Skeleton'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { findPackage } from '@/content/packages'
import { whatsappUrl } from '@/lib/admin'
import { fetchActiveBookings, reviewBooking, type Booking } from '@/lib/adminApi'
import { formatDateLong, formatTime, startOfMadridDay, toMadrid } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'
import AdminBookings from './AdminBookings'

/**
 * Pantalla principal del admin: la agenda de hoy (sesiones pendientes y aceptadas).
 * Si hoy no hay sesiones, muestra directamente la lista de reservas.
 */
export default function AdminToday() {
  const { refreshPending } = useAdminContext()
  const [state, setState] = useState<{ bookings?: Booking[]; error?: string }>({})
  const [reloads, setReloads] = useState(0)
  const reload = useCallback(() => setReloads((n) => n + 1), [])
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    const from = startOfMadridDay(new Date())
    const to = startOfMadridDay(addDays(toMadrid(from), 1))
    fetchActiveBookings(from, to)
      .then((bookings) => {
        if (cancelled) return
        setState({ bookings })
        setNow(new Date())
      })
      .catch((err) => !cancelled && setState({ error: errorMessage(err) }))
    return () => {
      cancelled = true
    }
  }, [reloads])

  // Recarga al volver a la pestaña del navegador
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  // Aprobar una reserva pendiente desde la agenda
  const navigate = useNavigate()
  const [approving, setApproving] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  async function approve() {
    if (!approving) return
    setBusy(true)
    setApproveError(null)
    try {
      await reviewBooking(approving.id, 'aceptada', '')
      setApproving(null)
      reload()
      // El aviso y el contador de pendientes los gestiona el layout al cambiar de navegación
      navigate('/admin', { replace: true, state: { toast: 'Reserva aceptada' } })
    } catch (err) {
      setApproveError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const { bookings, error } = state

  if (bookings?.length === 0) {
    return (
      <>
        <div className="mx-auto max-w-5xl px-4 pt-8">
          <p className="flex items-center justify-center gap-2 rounded-sm bg-honey/20 p-4 text-center text-sm text-honey-dark ring-1 ring-honey/50">
            <span aria-hidden="true">🎄</span>
            Hoy no tienes sesiones agendadas. Aquí tienes las reservas.
          </p>
        </div>
        <AdminBookings />
      </>
    )
  }

  const isDone = (b: Booking) => new Date(b.ends_at) <= now
  const pendingCount = bookings?.filter((b) => b.status === 'pendiente').length ?? 0
  const doneCount = bookings?.filter(isDone).length ?? 0
  // La sesión en curso o la siguiente que empieza
  const nextId = bookings?.find((b) => !isDone(b))?.id

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <header className="relative mb-6 overflow-hidden rounded-sm bg-teal p-5 text-cream shadow-md sm:p-6">
        <span aria-hidden="true" className="pointer-events-none absolute -top-4 -right-2 text-8xl opacity-15 select-none">
          ❄
        </span>
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-leaf">Tareas del día</p>
            <h1 className="mt-1 font-display text-2xl tracking-[0.1em] first-letter:uppercase">
              {formatDateLong(now)}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              reload()
              refreshPending()
            }}
            className="min-h-11 rounded-full bg-cream/10 px-4 text-sm ring-1 ring-cream/40 transition hover:bg-cream/20"
          >
            Actualizar
          </button>
        </div>

        {bookings && (
          <div className="relative mt-4 flex flex-wrap gap-2 text-sm">
            <Chip className="bg-leaf text-teal">
              {bookings.length === 1 ? '1 sesión' : `${bookings.length} sesiones`}
            </Chip>
            {pendingCount > 0 && (
              <Chip className="bg-xmas-red text-cream">
                {pendingCount === 1 ? '1 pendiente' : `${pendingCount} pendientes`} de revisar
              </Chip>
            )}
            {doneCount > 0 && (
              <Chip className="bg-cream/15 text-cream ring-1 ring-cream/30">
                {doneCount === 1 ? '1 hecha' : `${doneCount} hechas`}
              </Chip>
            )}
          </div>
        )}
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {error}
        </p>
      )}

      {!bookings && !error && (
        <SkeletonGroup label="Cargando la agenda…">
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </SkeletonGroup>
      )}

      {bookings && bookings.length > 0 && (
        <ol className="space-y-4">
          {bookings.map((b) => (
            <li key={b.id}>
              <SessionCard
                booking={b}
                done={isDone(b)}
                next={b.id === nextId}
                onApprove={() => {
                  setApproving(b)
                  setApproveError(null)
                }}
              />
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={approving !== null}
        title="¿Aprobar la reserva?"
        confirmLabel="Aprobar"
        busy={busy}
        error={approveError}
        onConfirm={approve}
        onCancel={() => setApproving(null)}
      >
        {approving && (
          <>
            <p>
              {approving.client_name} · {formatTime(approving.starts_at)}–
              {formatTime(approving.ends_at)}
            </p>
            <p>Antes de aprobar, revisa el comprobante del adelanto en el detalle de la reserva.</p>
          </>
        )}
      </ConfirmDialog>

      <Link
        to="/admin/reservas"
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-gold-dark px-5 text-sm text-cream transition hover:bg-gold"
      >
        Ver todas las reservas →
      </Link>
    </section>
  )
}

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`rounded-full px-3 py-1 font-semibold ${className}`}>{children}</span>
}

type SessionCardProps = {
  booking: Booking
  done: boolean
  next: boolean
  onApprove: () => void
}

function SessionCard({ booking: b, done, next, onApprove }: SessionCardProps) {
  const pkg = findPackage(b.package_code)
  const theme = pkg ? PACKAGE_THEME[pkg.code] : null

  return (
    <article
      className={`relative flex overflow-hidden rounded-sm bg-white/80 shadow-sm ring-1 ${
        next ? 'ring-2 ring-leaf shadow-lg shadow-leaf/30' : (theme?.ring ?? 'ring-gold-light/50')
      } ${done ? 'opacity-55 saturate-50' : ''}`}
    >
      <div
        className={`flex w-24 shrink-0 flex-col items-center justify-center gap-0.5 p-3 tabular-nums ${bookingColorClass(b)}`}
      >
        <span className="text-xl font-semibold">{formatTime(b.starts_at)}</span>
        <span className="text-xs opacity-80">hasta {formatTime(b.ends_at)}</span>
        {done && <span className="mt-1 text-[0.65rem] uppercase tracking-[0.15em]">✓ Hecha</span>}
      </div>
      <div className="min-w-0 flex-1">
        {/* Toda la tarjeta enlaza al detalle (enlace estirado), salvo el botón "Aprobar" */}
        <div className="relative space-y-1 p-4 hover:bg-cream/60">
          <div className="flex items-start justify-between gap-3">
            <Link
              to={`/admin/reservas/${b.id}`}
              state={{ back: '/admin' }}
              className="font-semibold after:absolute after:inset-0"
            >
              {b.client_name}
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {b.status === 'pendiente' && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="relative z-10 rounded-full bg-pine px-3 py-1 text-xs font-semibold text-cream transition hover:bg-pine/85"
                >
                  Aprobar
                </button>
              )}
              <StatusBadge status={b.status} />
            </div>
          </div>
          <p className={`text-sm font-semibold ${theme?.text ?? 'text-gold-dark'}`}>
            <PackageLabel booking={b} />
          </p>
          <p className="text-sm text-ink/70">{b.participants}</p>
          {b.notes && (
            <p className="rounded-sm bg-honey/15 px-2 py-1 text-sm italic text-ink/80">“{b.notes}”</p>
          )}
        </div>
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
      </div>
    </article>
  )
}
