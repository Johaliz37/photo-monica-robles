import { Link } from 'react-router-dom'
import { occupancy } from '@/lib/admin'
import type { AvailabilityWindow, Booking } from '@/lib/adminApi'
import { dayKey, formatDateLong, formatTime } from '@/lib/dates'
import { PackageLabel } from './bookingDisplay'

type Props = {
  windows: AvailabilityWindow[]
  /** Reservas activas del periodo. */
  bookings: Booking[]
  onDelete: (window: AvailabilityWindow) => void
}

const BOOKING_CLASS = {
  pendiente: 'border-gold-light bg-gold-light/20',
  aceptada: 'border-pine bg-pine/10',
  rechazada: 'border-xmas-red bg-xmas-red/10',
} as const

export default function AgendaView({ windows, bookings, onDelete }: Props) {
  if (windows.length === 0) {
    return (
      <p className="rounded-sm bg-white/50 p-6 text-center text-sm ring-1 ring-gold-light/50">
        No hay franjas en este periodo.
      </p>
    )
  }

  const days = new Map<string, AvailabilityWindow[]>()
  for (const w of windows) {
    const key = dayKey(w.starts_at)
    days.set(key, [...(days.get(key) ?? []), w])
  }

  return (
    <div className="space-y-6">
      {[...days].map(([day, dayWindows]) => (
        <section key={day}>
          <h3 className="mb-2 font-display tracking-[0.1em] text-gold-dark first-letter:uppercase">
            {formatDateLong(dayWindows[0].starts_at)}
          </h3>
          <ul className="space-y-3">
            {dayWindows.map((w) => {
              const start = new Date(w.starts_at).getTime()
              const end = new Date(w.ends_at).getTime()
              const inside = bookings.filter((b) => {
                const t = new Date(b.starts_at).getTime()
                return t >= start && t < end
              })
              const { bookedMin, totalMin } = occupancy(
                { start: new Date(start), end: new Date(end) },
                inside.map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) })),
              )
              const pct = totalMin > 0 ? Math.round((bookedMin / totalMin) * 100) : 0
              return (
                <li key={w.id} className="rounded-sm bg-white/50 p-4 ring-1 ring-gold-light/50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold tabular-nums">
                      {formatTime(w.starts_at)} – {formatTime(w.ends_at)}
                    </p>
                    <button
                      type="button"
                      onClick={() => onDelete(w)}
                      className="min-h-11 px-2 text-xs uppercase tracking-[0.15em] text-xmas-red hover:underline"
                    >
                      Borrar
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-ink/70">
                    <div
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={totalMin}
                      aria-valuenow={bookedMin}
                      aria-label="Ocupación"
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-dark"
                    >
                      <div className="h-full bg-gold-dark" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="tabular-nums">
                      {bookedMin} / {totalMin} min
                    </span>
                  </div>
                  {inside.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {inside.map((b) => (
                        <li key={b.id}>
                          <Link
                            to={`/admin/reservas/${b.id}`}
                            className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4 px-3 py-2 text-sm hover:bg-white/60 ${BOOKING_CLASS[b.status]}`}
                          >
                            <span className="tabular-nums">
                              {formatTime(b.starts_at)}–{formatTime(b.ends_at)}
                            </span>
                            <PackageLabel booking={b} />
                            <span className="truncate">{b.client_name}</span>
                            {b.status === 'pendiente' && (
                              <span className="text-xs text-gold-dark">(pendiente)</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
