import { addMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useMemo, useRef, useState } from 'react'
import Spinner from '@/components/admin/Spinner'
import AvailabilityMonthGrid from '@/components/admin/availability/AvailabilityMonthGrid'
import DayPanel from '@/components/admin/availability/DayPanel'
import DeleteRangeDialog from '@/components/admin/availability/DeleteRangeDialog'
import type { Draft } from '@/components/admin/availability/RangeForm'
import { PACKAGES } from '@/content/packages'
import { SEASON } from '@/content/site'
import type { TimeRange } from '@/lib/admin'
import { fetchActiveBookings, fetchAvailabilityRules, type Booking } from '@/lib/adminApi'
import { rulesByDay, type Rule } from '@/lib/availability'
import { calendarDate, groupByDay } from '@/lib/calendar'
import { dayKey, madridDateTime, monthKey } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

// Un tramo más corto que la sesión más corta no sirve para reservar (igual que rebuild_availability)
const MIN_WINDOW_MIN = Math.min(...PACKAGES.map((p) => p.durationMin))
const LAST_DAY = dayKey(new Date(new Date(SEASON.to).getTime() - 1))
const DEFAULT_RANGE: TimeRange = { start: '10:00', end: '11:00' }

const shiftMonth = (month: string, delta: number) =>
  format(addMonths(calendarDate(`${month}-01`), delta), 'yyyy-MM')

interface Data {
  rules: Rule[]
  /** Reservas activas desde el día 1 del mes actual. */
  bookings: Booking[]
}

export default function AdminAvailability() {
  const [now] = useState(() => new Date())
  const today = dayKey(now)
  const minMonth = monthKey(now)
  const maxMonth = LAST_DAY.slice(0, 7)

  const [month, setMonth] = useState(minMonth)
  const [selectedDay, setSelectedDay] = useState(today)
  const [focusRuleId, setFocusRuleId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [toDelete, setToDelete] = useState<Rule | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<Data | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchAvailabilityRules(),
      fetchActiveBookings(madridDateTime(`${minMonth}-01`, '00:00')),
    ])
      .then(([rules, bookings]) => {
        if (cancelled) return
        setData({ rules, bookings })
        setLoadError(null)
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [minMonth, reloads])

  const byDay = useMemo(() => rulesByDay(data?.rules ?? []), [data])
  const bookingsByDay = useMemo(() => groupByDay(data?.bookings ?? []), [data])

  function selectDay(day: string) {
    setSelectedDay(day)
    setFocusRuleId(null)
    setDraft(null)
    setNotice(null)
    if (day.slice(0, 7) !== month && day.slice(0, 7) >= minMonth && day.slice(0, 7) <= maxMonth) {
      setMonth(day.slice(0, 7))
    }
    // En el móvil el panel del día queda debajo del calendario
    if (window.matchMedia?.('(max-width: 1023px)').matches) {
      panelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }

  function startDraft(range: TimeRange) {
    setNotice(null)
    setDraft((prev) =>
      prev
        ? { ...prev, rule: { ...prev.rule, ...range } }
        : {
            id: null,
            rule: { kind: 'disponible', day: selectedDay, ...range, repeat: 'unico', until: null },
          },
    )
  }

  function editRule(rule: Rule) {
    const { id, ...input } = rule
    setNotice(null)
    setFocusRuleId(id)
    setDraft({ id, rule: input })
  }

  function changed(message: string) {
    setDraft(null)
    setToDelete(null)
    setNotice(message)
    setReloads((n) => n + 1)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 font-display text-2xl tracking-[0.2em] text-gold-dark">Disponibilidad</h1>
      <p className="mb-6 max-w-2xl text-sm">
        Elige un día y selecciona un rango de horas. Puedes marcarlo como disponible o no disponible
        y repetirlo en serie. Los clientes solo pueden reservar en lo disponible.
      </p>

      {loadError && (
        <p role="alert" className="mb-4 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          No se ha podido cargar la disponibilidad: {loadError}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMonth(minMonth)
                selectDay(today)
              }}
              disabled={month === minMonth && selectedDay === today}
              className="min-h-11 rounded-full px-4 text-sm ring-1 ring-gold-light hover:bg-cream-dark disabled:opacity-50"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              disabled={month <= minMonth}
              aria-label="Mes anterior"
              className="size-11 rounded-full text-xl text-gold-dark hover:bg-cream-dark disabled:invisible"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={month >= maxMonth}
              aria-label="Mes siguiente"
              className="size-11 rounded-full text-xl text-gold-dark hover:bg-cream-dark disabled:invisible"
            >
              ›
            </button>
            <p
              aria-live="polite"
              className="font-display tracking-[0.1em] text-gold-dark first-letter:uppercase"
            >
              {format(calendarDate(`${month}-01`), 'LLLL yyyy', { locale: es })}
            </p>
          </div>

          {data ? (
            <AvailabilityMonthGrid
              month={month}
              today={today}
              selectedDay={selectedDay}
              rulesByDay={byDay}
              bookingsByDay={bookingsByDay}
              onSelectDay={selectDay}
              onSelectRule={(rule, day) => {
                selectDay(day)
                setFocusRuleId(rule.id)
              }}
            />
          ) : (
            !loadError && <Spinner label="Cargando disponibilidad…" />
          )}
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-3 rounded-sm bg-teal/10 ring-1 ring-teal/30"
              />
              Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-3 rounded-sm bg-xmas-red/10 ring-1 ring-xmas-red/30"
              />
              ✕ No disponible
            </span>
            <span>↻ En serie</span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full bg-honey" />
              Reservas
            </span>
          </p>
        </div>

        <div ref={panelRef} className="min-w-0 scroll-mt-4">
          {data && (
            <DayPanel
              day={selectedDay}
              today={today}
              lastDay={LAST_DAY}
              minMin={MIN_WINDOW_MIN}
              dayRules={byDay.get(selectedDay) ?? []}
              dayBookings={bookingsByDay.get(selectedDay) ?? []}
              rules={data.rules}
              bookings={data.bookings}
              focusRuleId={focusRuleId}
              draft={draft}
              notice={notice}
              onSelectRange={startDraft}
              onNew={() => startDraft(DEFAULT_RANGE)}
              onEdit={editRule}
              onDelete={(rule) => {
                setNotice(null)
                setFocusRuleId(rule.id)
                setToDelete(rule)
              }}
              onDraftChange={(rule) => setDraft((prev) => prev && { ...prev, rule })}
              onCancelDraft={() => setDraft(null)}
              onSaved={changed}
            />
          )}
        </div>
      </div>

      {data && (
        <DeleteRangeDialog
          rule={toDelete}
          rules={data.rules}
          bookings={data.bookings}
          today={today}
          minMin={MIN_WINDOW_MIN}
          onCancel={() => setToDelete(null)}
          onDeleted={changed}
        />
      )}
    </section>
  )
}
