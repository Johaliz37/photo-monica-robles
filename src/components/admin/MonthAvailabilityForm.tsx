import { addMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useMemo, useState } from 'react'
import MonthCalendar from '@/components/booking/MonthCalendar'
import { BUTTON_PRIMARY } from '@/components/booking/Stepper'
import { PACKAGES } from '@/content/packages'
import { SEASON } from '@/content/site'
import {
  buildMonthWindows,
  monthDays,
  rangesError,
  shortCode,
  timeOptions,
  uncoveredSessions,
  type Exclusion,
  type TimeRange,
} from '@/lib/admin'
import {
  fetchAgenda,
  fetchMonthConfig,
  saveMonthAvailability,
  type Agenda,
  type MonthConfig,
} from '@/lib/adminApi'
import {
  dayKey,
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatTime,
  madridDateTime,
  monthKey,
} from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

const TIMES = timeOptions(7, 22)
const SELECT_CLASS = 'mt-1 block min-h-11 w-full rounded-sm bg-white/70 px-3 ring-1 ring-gold-light'
const WEEKDAYS = [
  { short: 'L', name: 'lunes' },
  { short: 'M', name: 'martes' },
  { short: 'X', name: 'miércoles' },
  { short: 'J', name: 'jueves' },
  { short: 'V', name: 'viernes' },
  { short: 'S', name: 'sábado' },
  { short: 'D', name: 'domingo' },
]
const DEFAULT_RANGES: TimeRange[] = [{ start: '10:00', end: '14:00' }]
// Un tramo más corto que la sesión más corta no sirve para reservar
const MIN_WINDOW_MIN = Math.min(...PACKAGES.map((p) => p.durationMin))

type Props = {
  now: Date
  /** Cambia cuando la agenda se modifica desde fuera (p. ej. al borrar una franja). */
  refreshKey: number
  onSaved: () => void
}

/** "2026-11" → Date del día 1 (fecha de calendario). */
const monthDate = (month: string) => {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1)
}
const shiftMonth = (month: string, delta: number) => format(addMonths(monthDate(month), delta), 'yyyy-MM')
const monthLabel = (month: string) => format(monthDate(month), "LLLL 'de' yyyy", { locale: es })
const dayLabel = (day: string) => formatDateLong(madridDateTime(day, '12:00'))

interface Loaded {
  month: string
  config: MonthConfig | null
  agenda: Agenda
}

export default function MonthAvailabilityForm({ now, refreshKey, onSaved }: Props) {
  const today = dayKey(now)
  const minMonth = monthKey(now)
  const maxMonth = monthKey(new Date(new Date(SEASON.to).getTime() - 1))

  const [month, setMonth] = useState(minMonth)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loadError, setLoadError] = useState<{ month: string; message: string } | null>(null)

  // Configuración en edición
  const [weekdays, setWeekdays] = useState<ReadonlySet<number>>(new Set())
  const [ranges, setRanges] = useState<TimeRange[]>(DEFAULT_RANGES)
  const [exclusions, setExclusions] = useState<Exclusion[]>([])

  // Editor de excepciones del día seleccionado
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [exStart, setExStart] = useState('10:00')
  const [exEnd, setExEnd] = useState('11:00')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  // Carga la configuración guardada y la agenda del mes, y rellena el formulario
  useEffect(() => {
    let cancelled = false
    const from = madridDateTime(`${month}-01`, '00:00')
    const to = madridDateTime(`${shiftMonth(month, 1)}-01`, '00:00')
    Promise.all([fetchMonthConfig(month), fetchAgenda(from, to)])
      .then(([config, agenda]) => {
        if (cancelled) return
        setLoaded({ month, config, agenda })
        setLoadError(null)
        setWeekdays(new Set(config?.weekdays ?? []))
        setRanges(config?.ranges.length ? config.ranges : DEFAULT_RANGES)
        setExclusions(config?.exclusions ?? [])
        setEditingDay(null)
      })
      .catch((err) => !cancelled && setLoadError({ month, message: errorMessage(err) }))
    return () => {
      cancelled = true
    }
  }, [month, refreshKey])

  const current = loaded?.month === month ? loaded : null
  const rangeError = rangesError(ranges)

  const days = useMemo(() => monthDays(month, weekdays, today), [month, weekdays, today])
  const daySet = useMemo(() => new Set(days), [days])
  // Solo cuentan las excepciones de días que siguen dentro de la base
  const activeExclusions = exclusions.filter((ex) => daySet.has(ex.day))
  const exclusionDays = new Set(activeExclusions.map((ex) => ex.day))
  const windows = buildMonthWindows(days, ranges, activeExclusions, MIN_WINDOW_MIN)

  const dayStart = ranges.reduce((min, r) => (r.start < min ? r.start : min), '23:59')
  const dayEnd = ranges.reduce((max, r) => (r.end > max ? r.end : max), '00:00')
  const exTimes = TIMES.filter((t) => t >= dayStart && t <= dayEnd)
  const editing = editingDay && daySet.has(editingDay) ? editingDay : null

  // Lo que hay ahora desde hoy (lo que se reemplazará) y reservas que quedarían fuera
  const replaced = current ? current.agenda.windows.filter((w) => dayKey(w.starts_at) >= today) : []
  const conflicts = current
    ? uncoveredSessions(
        current.agenda.bookings
          .filter((b) => dayKey(b.starts_at) >= today)
          .map((b) => ({ ...b, start: new Date(b.starts_at), end: new Date(b.ends_at) })),
        windows,
      )
    : []

  function changed() {
    setDone(null)
    setError(null)
  }

  function toggleWeekday(index: number) {
    changed()
    setWeekdays((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function updateRange(index: number, patch: Partial<TimeRange>) {
    changed()
    setRanges((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addRange() {
    changed()
    setRanges((prev) => {
      // Propuesta: 2 h después del final de la última franja, de 2 h (de 09–14 sugiere 16–18)
      const lastEnd = prev.reduce((max, r) => (r.end > max ? r.end : max), '00:00')
      const startIdx = Math.max(0, Math.min(TIMES.indexOf(lastEnd) + 8, TIMES.length - 2))
      const endIdx = Math.min(startIdx + 8, TIMES.length - 1)
      return [...prev, { start: TIMES[startIdx], end: TIMES[endIdx] }]
    })
  }

  function removeRange(index: number) {
    changed()
    setRanges((prev) => prev.filter((_, i) => i !== index))
  }

  function selectDay(day: string) {
    changed()
    setEditingDay(day === editing ? null : day)
    setExStart(dayStart)
    setExEnd(exTimes.find((t) => t > dayStart) ?? dayEnd)
  }

  function addExclusion(start: string, end: string) {
    if (!editing || end <= start) return
    changed()
    setExclusions((prev) => [...prev, { day: editing, start, end }])
  }

  function removeExclusion(target: Exclusion) {
    changed()
    setExclusions((prev) => prev.filter((ex) => ex !== target))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!current || rangeError || conflicts.length > 0) return
    setBusy(true)
    setError(null)
    try {
      await saveMonthAvailability(
        month,
        {
          weekdays: [...weekdays].sort(),
          ranges: [...ranges].sort((a, b) => a.start.localeCompare(b.start)),
          exclusions: activeExclusions,
        },
        windows,
      )
      setDone(
        windows.length === 0
          ? 'Disponibilidad guardada: el mes queda sin franjas.'
          : `Disponibilidad guardada: ${windows.length} ${windows.length === 1 ? 'franja' : 'franjas'}.`,
      )
      // El padre recarga la agenda y cambia refreshKey: el formulario se rellena con lo guardado
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const sortedExclusions = [...activeExclusions].sort((a, b) =>
    `${a.day}${a.start}`.localeCompare(`${b.day}${b.start}`),
  )

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Mes */}
      <div>
        <div className="flex items-center justify-between rounded-sm bg-teal/10 px-1 ring-1 ring-teal/30">
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            disabled={month <= minMonth}
            aria-label="Mes anterior"
            className="size-11 rounded-full text-xl text-teal hover:bg-teal/10 disabled:invisible"
          >
            ‹
          </button>
          <p aria-live="polite" className="font-display tracking-[0.1em] text-teal capitalize">
            {monthLabel(month)}
          </p>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={month >= maxMonth}
            aria-label="Mes siguiente"
            className="size-11 rounded-full text-xl text-teal hover:bg-teal/10 disabled:invisible"
          >
            ›
          </button>
        </div>
        {loadError?.month === month && !current && (
          <p role="alert" className="mt-2 rounded-sm bg-xmas-red/10 p-3 text-sm text-xmas-red">
            No se ha podido cargar la disponibilidad del mes: {loadError.message} Mientras tanto no
            se puede guardar.
          </p>
        )}
        <p className="mt-2 text-xs">
          {!current
            ? loadError?.month === month
              ? ''
              : 'Cargando…'
            : current.config
              ? `Configuración guardada el ${formatDateTime(current.config.updatedAt)}. Edítala y guarda los cambios.`
              : current.agenda.windows.length > 0
                ? 'Este mes tiene franjas sin configuración guardada. Al guardar se reemplazarán desde hoy.'
                : 'Este mes aún no tiene disponibilidad.'}
        </p>
      </div>

      {/* 1. Días de la semana */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">1. Días de la semana disponibles</legend>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d, i) => (
            <button
              key={d.short}
              type="button"
              aria-pressed={weekdays.has(i)}
              aria-label={d.name}
              onClick={() => toggleWeekday(i)}
              className={`h-11 rounded-full text-sm font-semibold ring-1 transition ${
                weekdays.has(i)
                  ? 'bg-teal text-cream ring-teal'
                  : 'bg-white/60 ring-gold-light hover:bg-cream-dark'
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 2. Franjas horarias */}
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">2. Franjas horarias de esos días</legend>
        <ul className="space-y-2">
          {ranges.map((r, i) => (
            <li key={i} className="flex items-end gap-2">
              <label className="flex-1 text-sm">
                Desde
                <select
                  value={r.start}
                  onChange={(e) => updateRange(i, { start: e.target.value })}
                  className={SELECT_CLASS}
                >
                  {TIMES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="flex-1 text-sm">
                Hasta
                <select
                  value={r.end}
                  onChange={(e) => updateRange(i, { end: e.target.value })}
                  className={SELECT_CLASS}
                >
                  {TIMES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => removeRange(i)}
                disabled={ranges.length === 1}
                aria-label={`Quitar franja ${r.start}–${r.end}`}
                className="size-11 shrink-0 rounded-full text-lg text-xmas-red hover:bg-xmas-red/10 disabled:invisible"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addRange}
          className="mt-2 min-h-11 rounded-full px-4 text-sm font-semibold text-teal ring-1 ring-teal/40 hover:bg-teal/10"
        >
          + Añadir franja horaria
        </button>
        {rangeError && <p className="mt-2 text-sm text-xmas-red">{rangeError}</p>}
      </fieldset>

      {/* 3. Excepciones por día */}
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">3. Excepciones (opcional)</legend>
        <p className="mb-2 text-sm">
          Toca un día disponible para marcar las horas en las que <strong>no</strong> estás.
        </p>
        <MonthCalendar
          month={month}
          minMonth={minMonth}
          maxMonth={maxMonth}
          availableDays={daySet}
          selectedDays={editing ? new Set([...exclusionDays, editing]) : exclusionDays}
          unavailableLabel="no disponible"
          onMonthChange={setMonth}
          onSelectDay={selectDay}
        />
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-full bg-cream-dark ring-1 ring-gold-light" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-full bg-gold-dark" />
            Con excepciones o seleccionado
          </span>
        </p>

        {editing && (
          <div className="mt-3 rounded-sm bg-xmas-red/5 p-3 ring-1 ring-xmas-red/30">
            <p className="text-sm font-semibold">
              <span className="inline-block first-letter:uppercase">{dayLabel(editing)}</span>: no
              disponible
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="text-sm">
                Desde
                <select value={exStart} onChange={(e) => setExStart(e.target.value)} className={SELECT_CLASS}>
                  {exTimes.slice(0, -1).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Hasta
                <select value={exEnd} onChange={(e) => setExEnd(e.target.value)} className={SELECT_CLASS}>
                  {exTimes.slice(1).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={exEnd <= exStart}
                onClick={() => addExclusion(exStart, exEnd)}
                className="min-h-11 rounded-full bg-xmas-red px-4 text-sm font-semibold text-cream disabled:opacity-50"
              >
                Añadir horario
              </button>
              <button
                type="button"
                onClick={() => addExclusion(dayStart, dayEnd)}
                className="min-h-11 rounded-full px-4 text-sm ring-1 ring-xmas-red/50 hover:bg-xmas-red/10"
              >
                Todo el día
              </button>
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                className="min-h-11 rounded-full px-4 text-sm hover:bg-cream-dark"
              >
                Cerrar
              </button>
            </div>
            {exEnd <= exStart && (
              <p className="mt-2 text-sm text-xmas-red">La hora de fin debe ser posterior a la de inicio.</p>
            )}
          </div>
        )}

        {sortedExclusions.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {sortedExclusions.map((ex, i) => (
              <li
                key={`${ex.day}-${ex.start}-${ex.end}-${i}`}
                className="flex items-center justify-between gap-2 rounded-sm bg-white/60 px-3 py-1 ring-1 ring-gold-light/50"
              >
                <span>
                  <span className="inline-block first-letter:uppercase">{dayLabel(ex.day)}</span>: no
                  disponible{' '}
                  {ex.start <= dayStart && ex.end >= dayEnd ? 'todo el día' : `${ex.start}–${ex.end}`}
                </span>
                <button
                  type="button"
                  onClick={() => removeExclusion(ex)}
                  aria-label="Quitar excepción"
                  className="size-11 shrink-0 rounded-full text-lg text-xmas-red hover:bg-xmas-red/10"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {/* Resumen */}
      {current && !rangeError && (
        <div aria-live="polite" className="space-y-2 text-sm">
          {windows.length === 0 ? (
            <p>
              {weekdays.size === 0
                ? 'No hay días de la semana elegidos: '
                : 'No queda ningún tramo disponible: '}
              {replaced.length > 0
                ? `al guardar se borrarán las ${replaced.length} franjas del mes desde hoy.`
                : 'el mes quedará sin disponibilidad.'}
            </p>
          ) : (
            <details>
              <summary className="cursor-pointer font-semibold">
                {windows.length === 1 ? '1 franja' : `${windows.length} franjas`} en{' '}
                {new Set(windows.map((w) => dayKey(w.start))).size} días
                {replaced.length > 0 && ` (reemplazan las ${replaced.length} actuales desde hoy)`}
              </summary>
              <ul className="mt-1 list-inside list-disc">
                {windows.map((w) => (
                  <li key={w.start.toISOString()}>
                    <span className="inline-block first-letter:uppercase">{formatDateLong(w.start)}</span>,{' '}
                    {formatTime(w.start)}–{formatTime(w.end)}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {today > `${month}-01` && (
            <p className="text-xs">Los días anteriores a hoy no se modifican.</p>
          )}
        </div>
      )}

      {conflicts.length > 0 && (
        <div role="alert" className="rounded-sm bg-xmas-red/10 p-3 text-sm text-xmas-red">
          <p className="font-semibold">
            Estas reservas quedarían fuera del nuevo horario. Ajusta la disponibilidad para cubrirlas
            o recházalas antes de guardar:
          </p>
          <ul className="mt-1 list-inside list-disc">
            {conflicts.map((b) => (
              <li key={b.id}>
                {formatDateShort(b.starts_at)}, {formatTime(b.starts_at)}–{formatTime(b.ends_at)} ·{' '}
                {b.client_name} ({shortCode(b.id)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-sm bg-xmas-red/10 p-3 text-sm text-xmas-red">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="rounded-sm bg-pine/10 p-3 text-sm text-pine">
          {done}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !current || rangeError !== null || conflicts.length > 0}
        className={BUTTON_PRIMARY}
      >
        {busy ? 'Guardando…' : 'Guardar disponibilidad del mes'}
      </button>
    </form>
  )
}
