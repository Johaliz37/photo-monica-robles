import { addDays, addMonths, addWeeks, format, startOfMonth, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCallback, useEffect, useState } from 'react'
import AgendaView from '@/components/admin/AgendaView'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import Spinner from '@/components/admin/Spinner'
import MonthAvailabilityForm from '@/components/admin/MonthAvailabilityForm'
import { deleteWindow, fetchAgenda, type Agenda, type AvailabilityWindow } from '@/lib/adminApi'
import { dayKey, formatDateLong, formatTime, madridDateTime } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'

type Mode = 'semana' | 'mes'

/** Fecha de calendario (sin hora) a partir de "2026-11-07". */
function calendarDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Primer día del periodo y primer día del siguiente, como fechas de calendario. */
function period(mode: Mode, anchor: Date): [Date, Date] {
  if (mode === 'semana') {
    const first = startOfWeek(anchor, { weekStartsOn: 1 })
    return [first, addDays(first, 7)]
  }
  const first = startOfMonth(anchor)
  return [first, addMonths(first, 1)]
}

function periodLabel(mode: Mode, [first, next]: [Date, Date]): string {
  if (mode === 'mes') return format(first, 'LLLL yyyy', { locale: es })
  return `${format(first, 'd MMM', { locale: es })} – ${format(addDays(next, -1), 'd MMM yyyy', { locale: es })}`
}

export default function AdminAvailability() {
  const [now] = useState(() => new Date())
  const [mode, setMode] = useState<Mode>('semana')
  const [anchor, setAnchor] = useState(() => calendarDate(dayKey(now)))
  const [toDelete, setToDelete] = useState<AvailabilityWindow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [first, next] = period(mode, anchor)
  const fromKey = format(first, 'yyyy-MM-dd')
  const toKey = format(next, 'yyyy-MM-dd')

  // Resultado ligado al periodo que lo pidió: al cambiar de semana/mes se muestra "cargando"
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

  function move(delta: number) {
    setAnchor((a) => (mode === 'semana' ? addWeeks(a, delta) : addMonths(a, delta)))
  }

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
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl tracking-[0.2em] text-gold-dark">Disponibilidad</h1>

      <div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-ink/70">Disponibilidad del mes</h2>
          <MonthAvailabilityForm now={now} refreshKey={reloads} onSaved={reload} />
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-ink/70">Agenda</h2>
            <div role="group" aria-label="Vista" className="flex gap-2">
              {(['semana', 'mes'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={`min-h-11 rounded-full px-4 text-sm capitalize ring-1 ${
                    mode === m
                      ? 'bg-gold-dark font-semibold text-cream ring-gold-dark'
                      : 'bg-white/60 ring-gold-light hover:bg-cream-dark'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={mode === 'semana' ? 'Semana anterior' : 'Mes anterior'}
              className="size-11 rounded-full text-xl text-gold-dark hover:bg-cream-dark"
            >
              ‹
            </button>
            <p
              aria-live="polite"
              className="font-display tracking-[0.1em] text-gold-dark capitalize"
            >
              {periodLabel(mode, [first, next])}
            </p>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={mode === 'semana' ? 'Semana siguiente' : 'Mes siguiente'}
              className="size-11 rounded-full text-xl text-gold-dark hover:bg-cream-dark"
            >
              ›
            </button>
          </div>

          {loadError && (
            <p role="alert" className="mb-4 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
              {loadError}
            </p>
          )}
          {agenda === null && !loadError && <Spinner label="Cargando agenda…" />}
          {agenda && (
            <AgendaView
              windows={agenda.windows}
              bookings={agenda.bookings}
              onDelete={(w) => {
                setDeleteError(null)
                setToDelete(w)
              }}
            />
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
