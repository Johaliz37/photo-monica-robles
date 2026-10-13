import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Booking } from '@/lib/adminApi'
import type { Rule } from '@/lib/availability'
import { calendarDate, visibleDays } from '@/lib/calendar'
import { ruleChipClass } from './ruleStyle'

type Props = {
  /** "2026-10" */
  month: string
  today: string
  selectedDay: string | null
  rulesByDay: Map<string, Rule[]>
  bookingsByDay: Map<string, Booking[]>
  onSelectDay: (day: string) => void
  /** Al pulsar un rango del día: lo muestra con sus opciones de editar y eliminar. */
  onSelectRule: (rule: Rule, day: string) => void
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
// En escritorio, rangos por día antes de "+N más"
const MAX_ITEMS = 3

/** Calendario del mes con los rangos de cada día. */
export default function AvailabilityMonthGrid({
  month,
  today,
  selectedDay,
  rulesByDay,
  bookingsByDay,
  onSelectDay,
  onSelectRule,
}: Props) {
  const days = visibleDays('month', `${month}-01`)

  return (
    <div className="overflow-hidden rounded-sm bg-white/50 ring-1 ring-gold-light/50">
      <div className="grid grid-cols-7 border-b border-gold-light/60">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="py-1.5 text-center text-[0.7rem] uppercase tracking-[0.15em] text-ink/70"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const rules = rulesByDay.get(day) ?? []
          const bookings = bookingsByDay.get(day) ?? []
          const inMonth = day.startsWith(month)
          const past = day < today
          const selected = day === selectedDay
          const hidden = Math.max(0, rules.length - MAX_ITEMS)
          const date = calendarDate(day)
          const summary = [
            rules.length > 0 && `${rules.length} ${rules.length === 1 ? 'rango' : 'rangos'}`,
            bookings.length > 0 &&
              `${bookings.length} ${bookings.length === 1 ? 'reserva' : 'reservas'}`,
          ]
            .filter(Boolean)
            .join(', ')
          return (
            <div
              key={day}
              onClick={() => onSelectDay(day)}
              className={`min-h-16 cursor-pointer border-gold-light/60 p-1 sm:min-h-24 ${i % 7 === 0 ? '' : 'border-l'} ${
                i >= 7 ? 'border-t' : ''
              } ${inMonth ? '' : 'bg-cream-dark/40'} ${past || !inMonth ? 'text-ink/50' : ''} ${
                selected
                  ? 'relative z-10 outline-2 -outline-offset-2 outline-gold-dark'
                  : 'hover:bg-cream-dark/50'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectDay(day)
                }}
                aria-pressed={selected}
                aria-label={`${format(date, "EEEE d 'de' MMMM", { locale: es })}${summary ? `: ${summary}` : ''}`}
                className={`mx-auto flex size-7 items-center justify-center rounded-full text-sm tabular-nums ${
                  day === today
                    ? 'bg-xmas-red font-semibold text-cream'
                    : selected
                      ? 'bg-gold-dark text-cream'
                      : ''
                }`}
              >
                {format(date, 'd')}
              </button>

              {/* Móvil: solo puntos */}
              <div
                aria-hidden="true"
                className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden"
              >
                {rules.some((r) => r.kind === 'disponible') && (
                  <span className="size-1.5 rounded-full bg-teal" />
                )}
                {rules.some((r) => r.kind === 'no_disponible') && (
                  <span className="size-1.5 rounded-full bg-xmas-red" />
                )}
                {bookings.length > 0 && <span className="size-1.5 rounded-full bg-honey" />}
              </div>

              {/* Escritorio: rangos */}
              <ul className="mt-1 hidden space-y-0.5 sm:block">
                {rules.slice(0, MAX_ITEMS).map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectRule(r, day)
                      }}
                      title={r.kind === 'disponible' ? 'Disponible' : 'No disponible'}
                      className={`flex w-full items-center gap-0.5 truncate rounded px-1 text-left text-[0.7rem] leading-5 ring-1 ring-inset hover:brightness-95 ${ruleChipClass(r)} ${
                        past ? 'opacity-60' : ''
                      }`}
                    >
                      {r.kind === 'no_disponible' && <span aria-label="No disponible">✕</span>}
                      <span className="truncate tabular-nums">
                        {r.start}–{r.end}
                      </span>
                      {r.repeat !== 'unico' && (
                        <span aria-label="En serie" className="ml-auto">
                          ↻
                        </span>
                      )}
                    </button>
                  </li>
                ))}
                {hidden > 0 && (
                  <li className="px-1 text-[0.7rem] font-semibold text-ink/70">+{hidden} más</li>
                )}
                {bookings.length > 0 && (
                  <li className="flex items-center gap-1 px-1 text-[0.7rem] leading-5 text-honey-dark">
                    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-honey" />
                    {bookings.length} {bookings.length === 1 ? 'reserva' : 'reservas'}
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
