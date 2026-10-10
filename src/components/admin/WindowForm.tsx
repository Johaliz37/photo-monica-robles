import { addDays, format } from 'date-fns'
import { useMemo, useState } from 'react'
import MonthCalendar from '@/components/booking/MonthCalendar'
import { BUTTON_PRIMARY } from '@/components/booking/Stepper'
import { SEASON } from '@/content/site'
import { buildWindows, timeOptions } from '@/lib/admin'
import { createWindows } from '@/lib/adminApi'
import { dayKey, formatDateLong, formatTime, monthKey } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

const TIMES = timeOptions(7, 22)
const SELECT_CLASS = 'mt-1 block min-h-11 w-full rounded-sm bg-white/70 px-3 ring-1 ring-gold-light'

type Props = {
  now: Date
  onCreated: () => void
}

/** Días seleccionables: de hoy al final de la temporada (fechas de calendario de Madrid). */
function seasonDays(now: Date): Set<string> {
  const days = new Set<string>()
  const last = dayKey(new Date(new Date(SEASON.to).getTime() - 1))
  const [y, m, d] = dayKey(now).split('-').map(Number)
  for (let date = new Date(y, m - 1, d); ; date = addDays(date, 1)) {
    const key = format(date, 'yyyy-MM-dd')
    if (key > last) break
    days.add(key)
  }
  return days
}

export default function WindowForm({ now, onCreated }: Props) {
  const available = useMemo(() => seasonDays(now), [now])
  const minMonth = monthKey(now)
  const maxMonth = monthKey(new Date(new Date(SEASON.to).getTime() - 1))

  const [month, setMonth] = useState(minMonth)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('14:00')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const windows = buildWindows(selected, startTime, endTime)
  const invalidTimes = endTime <= startTime

  function toggleDay(day: string) {
    setDone(null)
    setError(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (windows.length === 0) return
    setBusy(true)
    setError(null)
    try {
      await createWindows(windows)
      setDone(windows.length === 1 ? 'Franja creada.' : `${windows.length} franjas creadas.`)
      setSelected(new Set())
      onCreated()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm">Toca uno o varios días y elige el horario.</p>
      <MonthCalendar
        month={month}
        minMonth={minMonth}
        maxMonth={maxMonth}
        availableDays={available}
        selectedDays={selected}
        unavailableLabel="no seleccionable"
        onMonthChange={setMonth}
        onSelectDay={toggleDay}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Desde
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={SELECT_CLASS}
          >
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Hasta
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={SELECT_CLASS}
          >
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      <div aria-live="polite" className="text-sm">
        {invalidTimes ? (
          <p className="text-xmas-red">La hora de fin debe ser posterior a la de inicio.</p>
        ) : windows.length === 0 ? (
          <p className="text-ink/70">Selecciona al menos un día.</p>
        ) : (
          <>
            <p className="font-semibold">
              Se {windows.length === 1 ? 'creará 1 franja' : `crearán ${windows.length} franjas`}:
            </p>
            <ul className="mt-1 list-inside list-disc">
              {windows.map((w) => (
                <li key={w.start.toISOString()}>
                  <span className="inline-block first-letter:uppercase">
                    {formatDateLong(w.start)}
                  </span>
                  , {formatTime(w.start)}–{formatTime(w.end)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

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

      <button type="submit" disabled={busy || windows.length === 0} className={BUTTON_PRIMARY}>
        {busy ? 'Creando…' : 'Crear franjas'}
      </button>
    </form>
  )
}
