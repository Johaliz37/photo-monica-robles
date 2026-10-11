import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { bookingColorClass } from '@/components/packageTheme'
import { findPackage } from '@/content/packages'
import { occupancy } from '@/lib/admin'
import type { AvailabilityWindow, Booking } from '@/lib/adminApi'
import {
  calendarDate,
  groupByDay,
  hourBounds,
  verticalSpan,
  type CalendarMode,
} from '@/lib/calendar'
import { dayKey, formatTime, minutesOfDay } from '@/lib/dates'

type Props = {
  mode: CalendarMode
  /** Días visibles ("2026-11-07"), de visibleDays(). */
  days: string[]
  /** Día de referencia: en la vista de mes, los días de otros meses salen atenuados. */
  anchor: string
  now: Date
  windows: AvailabilityWindow[]
  /** Reservas activas del periodo. */
  bookings: Booking[]
  onDelete: (window: AvailabilityWindow) => void
  /** Al pulsar un día en la vista de semana o mes: abre la vista de día. */
  onSelectDay: (day: string) => void
}

// Altura de una hora en la rejilla de día/semana
const HOUR_PX = 48
const MIN_PX = HOUR_PX / 60
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
// En la vista de mes, eventos por día antes de "+N más"
const MONTH_MAX_ITEMS = 3

function bookingTitle(b: Booking): string {
  const pkg = findPackage(b.package_code)
  return [
    `${formatTime(b.starts_at)}–${formatTime(b.ends_at)}`,
    b.client_name,
    pkg ? `Paquete ${pkg.number} · ${pkg.name}` : b.package_code,
    b.baby_extension ? 'con ampliación para bebé' : null,
    b.status,
  ]
    .filter(Boolean)
    .join(' · ')
}

export default function CalendarView(props: Props) {
  return props.mode === 'month' ? <MonthGrid {...props} /> : <TimeGrid {...props} />
}

// ===== Día y semana: rejilla horaria =====

function TimeGrid({ mode, days, now, windows, bookings, onDelete, onSelectDay }: Props) {
  const today = dayKey(now)
  const bounds = hourBounds([...windows, ...bookings])
  const [startHour, endHour] = bounds
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const windowsByDay = groupByDay(windows)
  const bookingsByDay = groupByDay(bookings)
  const columns = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }
  const nowMin = minutesOfDay(now)
  const showNow = days.includes(today) && nowMin >= startHour * 60 && nowMin < endHour * 60

  return (
    <div className="overflow-x-auto rounded-sm bg-white/50 ring-1 ring-gold-light/50">
      <div className={mode === 'week' ? 'min-w-[36rem]' : ''}>
        {/* Cabecera con los días */}
        <div style={columns} className="grid border-b border-gold-light/60">
          <div />
          {days.map((day) => {
            const date = calendarDate(day)
            const isToday = day === today
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDay(day)}
                disabled={mode === 'day'}
                className="flex flex-col items-center py-2 text-ink/70 hover:bg-cream-dark disabled:hover:bg-transparent"
              >
                <span className="text-[0.7rem] uppercase tracking-[0.15em]">
                  {format(date, 'EEE', { locale: es })}
                </span>
                <span
                  className={`mt-0.5 flex size-9 items-center justify-center rounded-full text-lg tabular-nums ${
                    isToday ? 'bg-xmas-red font-semibold text-cream' : 'text-ink'
                  }`}
                >
                  {format(date, 'd')}
                </span>
              </button>
            )
          })}
        </div>

        {/* Rejilla */}
        <div style={columns} className="grid">
          <div className="relative" style={{ height: hours.length * HOUR_PX }}>
            {hours.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[0.7rem] text-ink/60 tabular-nums"
                style={{ top: i * HOUR_PX }}
              >
                {i === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </span>
            ))}
          </div>

          {days.map((day) => (
            <div
              key={day}
              className="relative border-l border-gold-light/60"
              style={{
                height: hours.length * HOUR_PX,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, rgb(0 0 0 / 0.07) ${HOUR_PX - 1}px, rgb(0 0 0 / 0.07) ${HOUR_PX}px)`,
              }}
            >
              {(windowsByDay.get(day) ?? []).map((w) => (
                <WindowBlock
                  key={w.id}
                  window={w}
                  bookings={bookings}
                  bounds={bounds}
                  compact={mode === 'week'}
                  onDelete={onDelete}
                />
              ))}
              {(bookingsByDay.get(day) ?? []).map((b) => {
                const { top, height } = verticalSpan(b, bounds)
                return (
                  <Link
                    key={b.id}
                    to={`/admin/reservas/${b.id}`}
                    title={bookingTitle(b)}
                    className={`absolute inset-x-1 z-10 overflow-hidden rounded-md px-1.5 py-0.5 text-xs leading-tight shadow-sm hover:brightness-95 ${bookingColorClass(b)}`}
                    style={{ top: top * MIN_PX + 1, height: Math.max(height * MIN_PX - 2, 18) }}
                  >
                    <span className="block truncate font-semibold">
                      {b.status === 'pendiente' && '⏳ '}
                      {b.client_name}
                    </span>
                    <span className="block truncate tabular-nums opacity-90">
                      {formatTime(b.starts_at)}–{formatTime(b.ends_at)}
                      {mode === 'day' && ` · ${findPackage(b.package_code)?.name ?? b.package_code}`}
                      {b.baby_extension && ' 👶'}
                    </span>
                  </Link>
                )
              })}
              {showNow && day === today && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-xmas-red"
                  style={{ top: (nowMin - startHour * 60) * MIN_PX }}
                >
                  <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-xmas-red" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Franja de disponibilidad: fondo de color tenue detrás de las reservas. */
function WindowBlock({
  window: w,
  bookings,
  bounds,
  compact,
  onDelete,
}: {
  window: AvailabilityWindow
  bookings: Booking[]
  bounds: [number, number]
  compact: boolean
  onDelete: (window: AvailabilityWindow) => void
}) {
  const { top, height } = verticalSpan(w, bounds)
  const start = new Date(w.starts_at)
  const end = new Date(w.ends_at)
  const { bookedMin, totalMin } = occupancy(
    { start, end },
    bookings
      .filter((b) => {
        const t = new Date(b.starts_at).getTime()
        return t >= start.getTime() && t < end.getTime()
      })
      .map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) })),
  )
  const label = `Disponible ${formatTime(w.starts_at)}–${formatTime(w.ends_at)}`

  return (
    <div
      title={`${label} · ${bookedMin} / ${totalMin} min reservados`}
      className="group absolute inset-x-0.5 rounded-md bg-teal/10 ring-1 ring-teal/30 ring-inset"
      style={{ top: top * MIN_PX, height: height * MIN_PX }}
    >
      <div className="flex items-start justify-between gap-1 px-1.5 pt-0.5 text-[0.7rem] leading-tight text-teal">
        <span className="truncate tabular-nums">
          {compact ? `${formatTime(w.starts_at)}–${formatTime(w.ends_at)}` : label}
          {!compact && ` · ${bookedMin} / ${totalMin} min reservados`}
        </span>
        <button
          type="button"
          onClick={() => onDelete(w)}
          aria-label={`Borrar franja ${formatTime(w.starts_at)}–${formatTime(w.ends_at)}`}
          className="relative z-20 -mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-base text-xmas-red hover:bg-xmas-red/10"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ===== Mes =====

function MonthGrid({ days, anchor, now, windows, bookings, onSelectDay }: Props) {
  const today = dayKey(now)
  const month = anchor.slice(0, 7)
  const windowsByDay = groupByDay(windows)
  const bookingsByDay = groupByDay(bookings)

  return (
    <div className="overflow-hidden rounded-sm bg-white/50 ring-1 ring-gold-light/50">
      <div className="grid grid-cols-7 border-b border-gold-light/60">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1.5 text-center text-[0.7rem] uppercase tracking-[0.15em] text-ink/70">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayWindows = windowsByDay.get(day) ?? []
          const dayBookings = bookingsByDay.get(day) ?? []
          const inMonth = day.startsWith(month)
          const isToday = day === today
          const items = dayBookings.length + dayWindows.length
          const hidden = Math.max(0, items - MONTH_MAX_ITEMS)
          return (
            <div
              key={day}
              className={`min-h-24 border-gold-light/60 p-1 ${i % 7 === 0 ? '' : 'border-l'} ${
                i >= 7 ? 'border-t' : ''
              } ${inMonth ? '' : 'bg-cream-dark/40 text-ink/50'}`}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                aria-label={`Ver el ${format(calendarDate(day), "d 'de' MMMM", { locale: es })}`}
                className={`mx-auto flex size-7 items-center justify-center rounded-full text-sm tabular-nums hover:bg-cream-dark ${
                  isToday ? 'bg-xmas-red font-semibold text-cream hover:bg-xmas-red' : ''
                }`}
              >
                {format(calendarDate(day), 'd')}
              </button>

              {/* Móvil: solo puntos */}
              {items > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="mt-1 flex w-full flex-wrap justify-center gap-0.5 sm:hidden"
                >
                  {dayWindows.length > 0 && <span className="size-1.5 rounded-full bg-teal" />}
                  {dayBookings.map((b) => (
                    <span
                      key={b.id}
                      className={`size-1.5 rounded-full ${b.status === 'pendiente' ? 'bg-gold-light' : 'bg-pine'}`}
                    />
                  ))}
                </button>
              )}

              {/* Escritorio: eventos */}
              <ul className="mt-1 hidden space-y-0.5 sm:block">
                {dayBookings.slice(0, MONTH_MAX_ITEMS).map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/admin/reservas/${b.id}`}
                      title={bookingTitle(b)}
                      className={`block truncate rounded px-1 text-[0.7rem] leading-5 hover:brightness-95 ${bookingColorClass(b)}`}
                    >
                      <span className="tabular-nums">{formatTime(b.starts_at)}</span> {b.client_name}
                    </Link>
                  </li>
                ))}
                {dayWindows.slice(0, Math.max(0, MONTH_MAX_ITEMS - dayBookings.length)).map((w) => (
                  <li
                    key={w.id}
                    title={`Disponible ${formatTime(w.starts_at)}–${formatTime(w.ends_at)}`}
                    className="flex items-center gap-1 truncate px-1 text-[0.7rem] leading-5 text-teal"
                  >
                    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-teal" />
                    <span className="truncate tabular-nums">
                      {formatTime(w.starts_at)}–{formatTime(w.ends_at)}
                    </span>
                  </li>
                ))}
                {hidden > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => onSelectDay(day)}
                      className="px-1 text-[0.7rem] font-semibold text-ink/70 hover:underline"
                    >
                      +{hidden} más
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
