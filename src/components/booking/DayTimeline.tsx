import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { dayKey, formatTime, madridDateTime, toMadrid } from '@/lib/dates'
import type { Range } from '@/lib/slots'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
/** Altura en píxeles de un minuto en la rejilla. */
const PX_PER_MIN = 1.6

type Props = {
  /** Día visible, "2026-11-07". */
  day: string
  /** Franjas publicadas (de cualquier día; se filtran las de `day`). */
  windows: Range[]
  /** [starts_at, blocked_until) de las reservas activas. */
  busy: Range[]
  /** Horas de inicio válidas de este día. */
  slots: Date[]
  durationMin: number
  bufferMin: number
  stepMin: number
  selected: string | null
  onSelect: (startsAt: string) => void
}

/** Primera hora en punto (Madrid) igual o anterior a `date`. */
function floorHour(day: string, date: Date): number {
  return madridDateTime(day, `${formatTime(date).slice(0, 2)}:00`).getTime()
}

function BanIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Vista de un día al estilo Google Calendar: rejilla horaria con las sesiones ya reservadas
 * (deshabilitadas) y los huecos libres. Al pasar el cursor por un hueco libre se dibuja la
 * franja que ocuparía la sesión; en los no disponibles aparece el icono de prohibido.
 */
export default function DayTimeline({
  day,
  windows,
  busy,
  slots,
  durationMin,
  bufferMin,
  stepMin,
  selected,
  onSelect,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const dayWindows = windows.filter((w) => dayKey(w.start) === day)
  const valid = new Set(slots.map((s) => s.getTime()))

  // Rango visible: de la hora en punto anterior a la primera franja a la posterior a la última
  const anchors = dayWindows.length > 0 ? dayWindows : slots.map((s) => ({ start: s, end: s }))
  const firstStart = Math.min(...anchors.map((w) => w.start.getTime()))
  const lastEnd =
    Math.max(...anchors.map((w) => w.end.getTime())) +
    (dayWindows.length ? 0 : durationMin * MINUTE)
  const rangeStart = floorHour(day, new Date(firstStart))
  const lastFloor = floorHour(day, new Date(lastEnd))
  const rangeEnd = lastFloor === lastEnd ? lastEnd : lastFloor + HOUR

  const top = (t: number) => ((t - rangeStart) / MINUTE) * PX_PER_MIN
  const height = (from: number, to: number) => ((to - from) / MINUTE) * PX_PER_MIN

  const hours: number[] = []
  for (let t = rangeStart; t <= rangeEnd; t += HOUR) hours.push(t)

  const cells: number[] = []
  for (let t = rangeStart; t < rangeEnd; t += stepMin * MINUTE) cells.push(t)

  const dayBusy = busy.filter((b) => b.start.getTime() < rangeEnd && b.end.getTime() > rangeStart)
  const selectedTime = selected && dayKey(selected) === day ? new Date(selected).getTime() : null
  const duration = durationMin * MINUTE

  // Al cambiar de día, se desplaza hasta la sesión elegida o el primer hueco libre
  // (solo entonces: no en cada recarga de disponibilidad ni al elegir hora)
  useEffect(() => {
    const target = selectedTime ?? slots[0]?.getTime()
    if (scrollRef.current && target !== undefined) {
      scrollRef.current.scrollTop = Math.max(0, top(target) - 2 * 15 * PX_PER_MIN)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  const madridDay = toMadrid(madridDateTime(day, '12:00'))

  return (
    <div className="rounded-sm bg-white/50 ring-1 ring-gold-light/50">
      <div className="flex items-center gap-3 border-b border-gold-light/50 px-4 py-3">
        <div className="flex flex-col items-center leading-none">
          <span className="text-xs uppercase tracking-[0.15em] text-gold-dark">
            {format(madridDay, 'EEE', { locale: es })}
          </span>
          <span className="mt-1 grid size-10 place-items-center rounded-full bg-gold-dark font-display text-xl text-cream">
            {format(madridDay, 'd')}
          </span>
        </div>
        <div className="text-sm">
          <p className="capitalize">{format(madridDay, 'LLLL yyyy', { locale: es })}</p>
          <p className="text-ink/70">
            Sesión de <strong className="font-semibold">{durationMin} min</strong>
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[28rem] overflow-y-auto py-2 pr-2">
        <div className="relative flex" style={{ height: height(rangeStart, rangeEnd) }}>
          {/* Etiquetas de hora */}
          <div aria-hidden="true" className="relative w-14 shrink-0">
            {hours.map((h) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-ink/60"
                style={{ top: top(h) }}
              >
                {formatTime(h)}
              </span>
            ))}
          </div>

          <div
            className="relative flex-1 border-l border-gold-light/50 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(234_219_200/0.5)_6px_7px)]"
            onMouseLeave={() => setHovered(null)}
          >
            {/* Franjas publicadas: fondo claro sobre el rayado de "fuera de horario" */}
            {dayWindows.map((w) => (
              <div
                key={w.start.toISOString()}
                aria-hidden="true"
                className="absolute inset-x-0 bg-white/70"
                style={{
                  top: top(w.start.getTime()),
                  height: height(w.start.getTime(), w.end.getTime()),
                }}
              />
            ))}

            {/* Líneas de hora y media hora */}
            {hours.map((h) => (
              <div key={h} aria-hidden="true">
                <div
                  className="absolute inset-x-0 border-t border-gold-light/50"
                  style={{ top: top(h) }}
                />
                {h < rangeEnd && (
                  <div
                    className="absolute inset-x-0 border-t border-dashed border-gold-light/25"
                    style={{ top: top(h + 30 * MINUTE) }}
                  />
                )}
              </div>
            ))}

            {/* Celdas: botón si es una hora de inicio válida, prohibido si no */}
            <ul className="absolute inset-0">
              {cells.map((t) => {
                const style = { top: top(t), height: stepMin * PX_PER_MIN }
                if (!valid.has(t)) {
                  return (
                    <li
                      key={t}
                      aria-hidden="true"
                      onMouseEnter={() => setHovered(null)}
                      className="group absolute inset-x-0 grid cursor-not-allowed place-items-center"
                      style={style}
                    >
                      <BanIcon className="size-4 text-xmas-red/70 opacity-0 transition group-hover:opacity-100" />
                    </li>
                  )
                }
                const iso = new Date(t).toISOString()
                const label = `${formatTime(t)} – ${formatTime(t + duration)}`
                return (
                  <li key={t} className="absolute inset-x-0" style={style}>
                    <button
                      type="button"
                      onClick={() => onSelect(iso)}
                      onMouseEnter={() => setHovered(t)}
                      onFocus={() => setHovered(t)}
                      onBlur={() => setHovered(null)}
                      aria-pressed={t === selectedTime}
                      aria-label={`Sesión de ${label}`}
                      className="size-full cursor-pointer rounded-sm hover:bg-gold-light/15 focus-visible:outline-2 focus-visible:outline-gold-dark"
                    />
                  </li>
                )
              })}
            </ul>

            {/* Sesiones ya reservadas (sin el margen posterior) */}
            {dayBusy.map((b) => {
              const from = Math.max(b.start.getTime(), rangeStart)
              const to = Math.min(Math.max(b.end.getTime() - bufferMin * MINUTE, from), rangeEnd)
              return (
                <div
                  key={b.start.toISOString()}
                  className="pointer-events-none absolute inset-x-1 overflow-hidden rounded-md border-l-4 border-ink/30 bg-cream-dark/90 px-2 py-0.5 text-xs text-ink/50"
                  style={{ top: top(from) + 1, height: Math.max(height(from, to) - 2, 14) }}
                >
                  <span className="font-semibold">Reservado</span>{' '}
                  <span className="tabular-nums">
                    {formatTime(b.start)} – {formatTime(to)}
                  </span>
                </div>
              )
            })}

            {/* Sesión elegida */}
            {selectedTime !== null && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1 overflow-hidden rounded-md bg-gold-dark px-2 py-1 text-xs text-cream shadow-md"
                style={{
                  top: top(selectedTime) + 1,
                  height: height(selectedTime, selectedTime + duration) - 2,
                }}
              >
                <span className="font-semibold">Tu sesión</span>{' '}
                <span className="tabular-nums">
                  {formatTime(selectedTime)} – {formatTime(selectedTime + duration)}
                </span>
              </div>
            )}

            {/* Vista previa de la franja al pasar el cursor */}
            {hovered !== null && hovered !== selectedTime && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1 overflow-hidden rounded-md border-2 border-dashed border-gold-dark bg-gold-light/30 px-2 py-1 text-xs text-gold-dark"
                style={{ top: top(hovered) + 1, height: height(hovered, hovered + duration) - 2 }}
              >
                <span className="font-semibold tabular-nums">
                  {formatTime(hovered)} – {formatTime(hovered + duration)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ul
        aria-hidden="true"
        className="flex flex-wrap gap-x-4 gap-y-1 border-t border-gold-light/50 px-4 py-2 text-xs text-ink/70"
      >
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-white ring-1 ring-gold-light" /> Disponible
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border-l-4 border-ink/30 bg-cream-dark" /> Reservado
        </li>
        <li className="flex items-center gap-1.5">
          <BanIcon className="size-3 text-xmas-red/70" /> No disponible
        </li>
      </ul>
    </div>
  )
}
