import { useEffect, useRef, useState } from 'react'
import { addDays, addMonths, format, getDaysInMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

type Props = {
  /** Mes visible, "2026-11". */
  month: string
  minMonth: string
  maxMonth: string
  /** Días con al menos una hora válida, "2026-11-07". */
  availableDays: ReadonlySet<string>
  selectedDay?: string | null
  /** Multiselección (panel de admin): si se indica, manda sobre selectedDay. */
  selectedDays?: ReadonlySet<string>
  /** Texto para lectores de pantalla en los días no seleccionables. */
  unavailableLabel?: string
  onMonthChange: (month: string) => void
  onSelectDay: (day: string) => void
}

const toKey = (date: Date) => format(date, 'yyyy-MM-dd')
const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Calendario mensual con el lunes como primer día. Trabaja con fechas de calendario puras
 * (año-mes-día), así que la zona horaria del navegador no influye.
 *
 * Teclado: un único día está en el orden de tabulación; las flechas mueven el foco por días y
 * semanas, Inicio/Fin van al principio/fin de la semana, RePág/AvPág cambian de mes y
 * Enter/Espacio seleccionan.
 */
export default function MonthCalendar({
  month,
  minMonth,
  maxMonth,
  availableDays,
  selectedDay = null,
  selectedDays,
  unavailableLabel = 'sin horas disponibles',
  onMonthChange,
  onSelectDay,
}: Props) {
  const [year, monthIndex] = month.split('-').map(Number)
  const first = new Date(year, monthIndex - 1, 1)
  const offset = (first.getDay() + 6) % 7
  const days = Array.from({ length: getDaysInMonth(first) }, (_, i) => i + 1)
  const prev = format(addMonths(first, -1), 'yyyy-MM')
  const next = format(addMonths(first, 1), 'yyyy-MM')

  const gridRef = useRef<HTMLDivElement>(null)
  const [focusDay, setFocusDay] = useState<string | null>(null)
  // Solo se mueve el foco tras una tecla, no al cambiar de mes con los botones
  const moveFocus = useRef(false)

  const keys = days.map((d) => `${month}-${String(d).padStart(2, '0')}`)
  const isSelected = (key: string) => (selectedDays ? selectedDays.has(key) : key === selectedDay)
  const tabStop =
    (focusDay?.startsWith(month) && focusDay) ||
    keys.find(isSelected) ||
    keys.find((k) => availableDays.has(k)) ||
    keys[0]

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${tabStop}"]`)?.focus()
  }, [tabStop])

  function handleKeyDown(e: React.KeyboardEvent, key: string) {
    const date = fromKey(key)
    const weekday = (date.getDay() + 6) % 7
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -weekday),
      End: () => addDays(date, 6 - weekday),
      PageUp: () => addMonths(date, -1),
      PageDown: () => addMonths(date, 1),
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    const target = toKey(move())
    const targetMonth = target.slice(0, 7)
    if (targetMonth < minMonth || targetMonth > maxMonth) return
    if (targetMonth !== month) onMonthChange(targetMonth)
    moveFocus.current = true
    setFocusDay(target)
  }

  return (
    <div className="rounded-sm bg-white/50 p-3 ring-1 ring-gold-light/50 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(prev)}
          disabled={prev < minMonth}
          aria-label="Mes anterior"
          className="size-11 rounded-full text-xl text-gold-dark hover:bg-cream-dark disabled:invisible"
        >
          ‹
        </button>
        <h3 aria-live="polite" className="font-display tracking-[0.15em] text-gold-dark capitalize">
          {format(first, 'LLLL yyyy', { locale: es })}
        </h3>
        <button
          type="button"
          onClick={() => onMonthChange(next)}
          disabled={next > maxMonth}
          aria-label="Mes siguiente"
          className="size-11 rounded-full text-xl text-gold-dark hover:bg-cream-dark disabled:invisible"
        >
          ›
        </button>
      </div>

      <div ref={gridRef} className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} aria-hidden="true" className="py-1 text-xs text-ink/70">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {keys.map((key, i) => {
          const available = availableDays.has(key)
          const selected = isSelected(key)
          const label = format(fromKey(key), "EEEE d 'de' MMMM", { locale: es })
          return (
            <button
              key={key}
              type="button"
              data-day={key}
              tabIndex={key === tabStop ? 0 : -1}
              // aria-disabled en vez de disabled: así el día sigue siendo navegable con las flechas
              aria-disabled={!available || undefined}
              onClick={() => available && onSelectDay(key)}
              onKeyDown={(e) => handleKeyDown(e, key)}
              onFocus={() => setFocusDay(key)}
              aria-pressed={selected}
              aria-label={available ? label : `${label}, ${unavailableLabel}`}
              className={`h-11 rounded-full text-sm transition ${
                selected
                  ? 'bg-gold-dark font-semibold text-cream'
                  : available
                    ? 'bg-cream-dark font-normal text-ink hover:bg-gold-light'
                    : 'cursor-default text-ink/30'
              }`}
            >
              {days[i]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
