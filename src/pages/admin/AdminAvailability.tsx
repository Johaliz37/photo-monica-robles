import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCallback, useEffect, useState } from 'react'
import CalendarView from '@/components/admin/CalendarView'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import Spinner from '@/components/admin/Spinner'
import MonthAvailabilityForm from '@/components/admin/MonthAvailabilityForm'
import { deleteWindow, fetchAgenda, type Agenda, type AvailabilityWindow } from '@/lib/adminApi'
import { calendarDate, shiftAnchor, visibleDays, type CalendarMode } from '@/lib/calendar'
import { dayKey, formatDateLong, formatTime, madridDateTime } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

const MODES: { value: CalendarMode; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
]

function periodLabel(mode: CalendarMode, anchor: string, days: string[]): string {
  const first = calendarDate(days[0])
  const last = calendarDate(days[days.length - 1])
  if (mode === 'day') return format(first, "EEEE, d 'de' MMMM yyyy", { locale: es })
  if (mode === 'month') return format(calendarDate(anchor), 'LLLL yyyy', { locale: es })
  return `${format(first, 'd MMM', { locale: es })} – ${format(last, 'd MMM yyyy', { locale: es })}`
}

export default function AdminAvailability() {
  const [now] = useState(() => new Date())
  const today = dayKey(now)
  const [mode, setMode] = useState<CalendarMode>('week')
  const [anchor, setAnchor] = useState(today)
  const [toDelete, setToDelete] = useState<AvailabilityWindow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const days = visibleDays(mode, anchor)
  const fromKey = days[0]
  const toKey = shiftAnchor('day', days[days.length - 1], 1)
  const modeLabel = MODES.find((m) => m.value === mode)!.label

  // Resultado ligado al periodo que lo pidió: al cambiar de periodo se muestra "cargando"
  const periodKey = `${fromKey}|${toKey}`
  const [result, setResult] = useState<{ key: string; agenda?: Agenda; error?: string }>()
  const [reloads, setReloads] = useState(0)
  const reload = useCallback(() => setReloads((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    fetchAgenda(madridDateTime(fromKey, '00:00'), madridDateTime(toKey, '00:00'))
      .then((agenda) => !cancelled && setResult({ key: periodKey, agenda }))
      .catch((err) => !cancelled && setResult({ key: periodKey, error: errorMessage(err) }))
    return () => {
      cancelled = true
    }
  }, [fromKey, toKey, periodKey, reloads])

  const current = result?.key === periodKey ? result : undefined
  const agenda = current?.agenda ?? null
  const loadError = current?.error ?? null

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteWindow(toDelete.id)
      setToDelete(null)
      reload()
    } catch (err) {
      setDeleteError(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl tracking-[0.2em] text-gold-dark">Disponibilidad</h1>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-ink/70">Disponibilidad del mes</h2>
          <MonthAvailabilityForm now={now} refreshKey={reloads} onSaved={reload} />
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-ink/70">Agenda</h2>
            <div role="group" aria-label="Vista" className="flex gap-1 rounded-full bg-white/60 p-1 ring-1 ring-gold-light">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={mode === m.value}
                  onClick={() => setMode(m.value)}
                  className={`min-h-9 rounded-full px-4 text-sm ${
                    mode === m.value ? 'bg-gold-dark font-semibold text-cream' : 'hover:bg-cream-dark'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnchor(today)}
              disabled={days.includes(today) && (mode !== 'month' || anchor.slice(0, 7) === today.slice(0, 7))}
              className="min-h-11 rounded-full px-4 text-sm ring-1 ring-gold-light hover:bg-cream-dark disabled:opacity-50"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setAnchor(shiftAnchor(mode, anchor, -1))}
              aria-label={`${modeLabel} anterior`}
              className="size-11 rounded-full text-xl text-gold-dark hover:bg-cream-dark"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setAnchor(shiftAnchor(mode, anchor, 1))}
              aria-label={`${modeLabel} siguiente`}
              className="size-11 rounded-full text-xl text-gold-dark hover:bg-cream-dark"
            >
              ›
            </button>
            <p aria-live="polite" className="font-display tracking-[0.1em] text-gold-dark first-letter:uppercase">
              {periodLabel(mode, anchor, days)}
            </p>
          </div>

          {loadError && (
            <p role="alert" className="mb-4 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
              {loadError}
            </p>
          )}
          {agenda === null && !loadError && <Spinner label="Cargando agenda…" />}
          {agenda && (
            <>
              {agenda.windows.length === 0 && (
                <p className="mb-3 text-sm text-ink/70">No hay franjas en este periodo.</p>
              )}
              <CalendarView
                mode={mode}
                days={days}
                anchor={anchor}
                now={now}
                windows={agenda.windows}
                bookings={agenda.bookings}
                onDelete={(w) => {
                  setDeleteError(null)
                  setToDelete(w)
                }}
                onSelectDay={(day) => {
                  setAnchor(day)
                  setMode('day')
                }}
              />
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-3 rounded-sm bg-teal/10 ring-1 ring-teal/30" />
                  Franja disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-3 rounded-sm bg-teal" />
                  Reserva aceptada (color del paquete)
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-3 rounded-sm bg-white ring-2 ring-teal ring-inset" />
                  Reserva pendiente
                </span>
              </p>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Borrar la franja?"
        confirmLabel="Borrar"
        tone="danger"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && (
          <p>
            <span className="inline-block first-letter:uppercase">
              {formatDateLong(toDelete.starts_at)}
            </span>
            , {formatTime(toDelete.starts_at)} – {formatTime(toDelete.ends_at)}
          </p>
        )}
      </ConfirmDialog>
    </section>
  )
}
