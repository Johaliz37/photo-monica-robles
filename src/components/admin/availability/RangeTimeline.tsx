import { useState } from 'react'
import { toMinutes, type TimeRange } from '@/lib/admin'
import type { Booking } from '@/lib/adminApi'
import type { Rule } from '@/lib/availability'
import { formatTime, minutesOfDay } from '@/lib/dates'

type Props = {
  /** Rangos "no disponible" del día (los disponibles se pintan ya restados en `available`). */
  blocked: Rule[]
  /** Tramos reservables del día. */
  available: TimeRange[]
  bookings: Booking[]
  /** Rango que se está creando o editando. */
  selection: TimeRange | null
  /** Día pasado o fuera de temporada: solo consulta. */
  readOnly: boolean
  onSelect: (range: TimeRange) => void
}

export const FROM_HOUR = 7
export const TO_HOUR = 22
const SLOT_MIN = 15
const SLOT_PX = 8
const SLOTS = ((TO_HOUR - FROM_HOUR) * 60) / SLOT_MIN
const HOUR_PX = (60 / SLOT_MIN) * SLOT_PX

const slotTime = (slot: number) => {
  const m = FROM_HOUR * 60 + slot * SLOT_MIN
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Posición vertical (px) de un tramo "HH:mm" dentro de la rejilla. */
function span(start: number, end: number) {
  const from = FROM_HOUR * 60
  const to = TO_HOUR * 60
  const top = Math.max(from, Math.min(to, start)) - from
  const bottom = Math.max(from, Math.min(to, end)) - from
  return { top: (top / SLOT_MIN) * SLOT_PX, height: ((bottom - top) / SLOT_MIN) * SLOT_PX }
}
const timeSpan = (r: TimeRange) => span(toMinutes(r.start), toMinutes(r.end))

const BLOCKED_BG = {
  backgroundImage:
    'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-xmas-red) 22%, transparent) 0 4px, transparent 4px 9px)',
}

/**
 * Rejilla horaria de un día para seleccionar un rango: arrastrando (ratón) o tocando la hora de
 * inicio y después la de fin (móvil, donde arrastrar desplaza la página).
 */
export default function RangeTimeline({
  blocked,
  available,
  bookings,
  selection,
  readOnly,
  onSelect,
}: Props) {
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  const [tapStart, setTapStart] = useState<number | null>(null)
  const hours = Array.from({ length: TO_HOUR - FROM_HOUR + 1 }, (_, i) => FROM_HOUR + i)

  function slotAt(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.min(SLOTS - 1, Math.max(0, Math.floor((e.clientY - rect.top) / SLOT_PX)))
  }

  function select(a: number, b: number) {
    onSelect({ start: slotTime(Math.min(a, b)), end: slotTime(Math.max(a, b) + 1) })
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return
    const slot = slotAt(e)
    setDrag(null)
    if (slot !== drag.from) {
      setTapStart(null)
      select(drag.from, slot)
    } else if (tapStart === null) {
      setTapStart(slot)
    } else {
      setTapStart(null)
      select(tapStart, slot)
    }
  }

  // Lo que se resalta: el arrastre en curso, la hora de inicio tocada o el rango del formulario
  const highlight = drag
    ? span(
        FROM_HOUR * 60 + Math.min(drag.from, drag.to) * SLOT_MIN,
        FROM_HOUR * 60 + (Math.max(drag.from, drag.to) + 1) * SLOT_MIN,
      )
    : tapStart !== null
      ? span(FROM_HOUR * 60 + tapStart * SLOT_MIN, FROM_HOUR * 60 + (tapStart + 1) * SLOT_MIN)
      : selection
        ? timeSpan(selection)
        : null
  const highlightLabel = drag
    ? `${slotTime(Math.min(drag.from, drag.to))}–${slotTime(Math.max(drag.from, drag.to) + 1)}`
    : tapStart !== null
      ? `Desde ${slotTime(tapStart)}: toca la hora de fin`
      : selection && `${selection.start}–${selection.end}`

  return (
    <div className="flex select-none">
      <div
        aria-hidden="true"
        className="relative w-12 shrink-0"
        style={{ height: SLOTS * SLOT_PX }}
      >
        {hours.map((h, i) => (
          <span
            key={h}
            className="absolute right-2 -translate-y-1/2 text-[0.7rem] text-ink/60 tabular-nums"
            style={{ top: i * HOUR_PX }}
          >
            {String(h).padStart(2, '0')}:00
          </span>
        ))}
      </div>

      <div
        className="relative flex-1 rounded-sm bg-white/60 ring-1 ring-gold-light/60"
        style={{
          height: SLOTS * SLOT_PX,
          backgroundImage: `repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.08) 0, rgb(0 0 0 / 0.08) 1px, transparent 1px, transparent ${HOUR_PX}px)`,
        }}
      >
        {available.map((r) => (
          <div
            key={`a-${r.start}`}
            className="absolute inset-x-0 rounded-sm bg-teal/15 ring-1 ring-teal/40 ring-inset"
            style={timeSpan(r)}
          >
            <span className="block px-1.5 pt-0.5 text-[0.7rem] leading-tight text-teal tabular-nums">
              Disponible {r.start}–{r.end}
            </span>
          </div>
        ))}
        {blocked.map((r) => (
          <div
            key={`b-${r.id}`}
            className="absolute inset-x-0 rounded-sm ring-1 ring-xmas-red/50 ring-inset"
            style={{ ...timeSpan(r), ...BLOCKED_BG }}
          >
            <span className="block px-1.5 pt-0.5 text-right text-[0.7rem] leading-tight text-xmas-red tabular-nums">
              No disponible {r.start}–{r.end}
            </span>
          </div>
        ))}
        {bookings.map((b) => {
          const { top, height } = span(minutesOfDay(b.starts_at), minutesOfDay(b.ends_at))
          return (
            <div
              key={b.id}
              className={`absolute right-1 left-1/3 z-10 overflow-hidden rounded px-1 text-[0.7rem] leading-tight shadow-sm ${
                b.status === 'pendiente'
                  ? 'bg-white text-ink ring-2 ring-honey ring-inset'
                  : 'bg-honey text-ink'
              }`}
              style={{ top: top + 1, height: Math.max(height - 2, 12) }}
            >
              <span className="truncate font-semibold">
                {b.status === 'pendiente' && '⏳ '}
                {formatTime(b.starts_at)} {b.client_name}
              </span>
            </div>
          )
        })}
        {highlight && (
          <div
            className="absolute inset-x-0 z-20 rounded-sm bg-gold-dark/25 ring-2 ring-gold-dark ring-inset"
            style={{ top: highlight.top, height: Math.max(highlight.height, SLOT_PX) }}
          >
            <span className="absolute -top-5 left-1 rounded bg-gold-dark px-1.5 text-[0.7rem] leading-5 whitespace-nowrap text-cream tabular-nums">
              {highlightLabel}
            </span>
          </div>
        )}

        {/* Capa que recibe el arrastre o los toques */}
        {!readOnly && (
          <div
            aria-hidden="true"
            data-testid="range-picker"
            className="absolute inset-0 z-30 cursor-crosshair touch-pan-y"
            onPointerDown={(e) => {
              if (e.button !== 0) return
              if (e.pointerType !== 'touch') e.currentTarget.setPointerCapture(e.pointerId)
              const slot = slotAt(e)
              setDrag({ from: slot, to: slot })
            }}
            onPointerMove={(e) => {
              if (drag) setDrag({ ...drag, to: slotAt(e) })
            }}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
          />
        )}
      </div>
    </div>
  )
}
