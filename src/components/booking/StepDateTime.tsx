import { useEffect, useMemo, useState } from 'react'
import { CalendarSkeleton } from '@/components/Skeleton'
import type { Package } from '@/content/packages'
import { CONTACT, SEASON } from '@/content/site'
import { fetchAvailability, type Availability } from '@/lib/api'
import { dayKey, monthKey } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'
import { getStartTimes, groupByMadridDay } from '@/lib/slots'
import DayTimeline from './DayTimeline'
import MonthCalendar from './MonthCalendar'
import { StepNav } from './Stepper'

const REFRESH_MS = 60_000
const SEASON_FROM = new Date(SEASON.from)
const SEASON_TO = new Date(SEASON.to)

type Props = {
  pkg: Package
  baby: boolean
  startsAt: string | null
  /** Aviso a mostrar al llegar (p. ej. SLOT_TAKEN). */
  notice: string | null
  onSelect: (startsAt: string | null) => void
  onBack: () => void
  onNext: () => void
}

export default function StepDateTime({
  pkg,
  baby,
  startsAt,
  notice,
  onSelect,
  onBack,
  onNext,
}: Props) {
  // `loadedAt` es el "ahora" con el que se filtran las horas: se renueva en cada recarga
  const [data, setData] = useState<(Availability & { loadedAt: Date }) | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(() =>
    startsAt ? dayKey(startsAt) : null,
  )
  const [month, setMonth] = useState<string | null>(null)

  // Disponibilidad al entrar y cada 60 s mientras se está en el paso
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const from = new Date(Math.max(Date.now(), SEASON_FROM.getTime()))
        const result = await fetchAvailability(from, SEASON_TO)
        if (!cancelled) {
          setData({ ...result, loadedAt: new Date() })
          setLoadError(null)
        }
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err))
      }
    }
    void load()
    const id = setInterval(() => {
      if (!document.hidden) void load()
    }, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // La duración usa la configuración del servidor, que es la que valida create_booking
  const durationMin = pkg.durationMin + (baby ? (data?.config.babyExtraMin ?? 0) : 0)

  const slots = useMemo(() => {
    if (!data) return null
    return getStartTimes({
      windows: data.windows,
      busy: data.busy,
      durationMin,
      bufferMin: data.config.bufferMin,
      stepMin: data.config.stepMin,
      now: data.loadedAt,
      minLeadMin: data.config.minNoticeMin,
    })
  }, [data, durationMin])

  const byDay = useMemo(() => groupByMadridDay(slots ?? []), [slots])
  const availableDays = useMemo(() => new Set(byDay.keys()), [byDay])

  // Si la hora elegida deja de ser válida (otro paquete, bebé o alguien la reservó), se borra
  useEffect(() => {
    if (slots && startsAt && !slots.some((s) => s.toISOString() === startsAt)) onSelect(null)
  }, [slots, startsAt, onSelect])

  const minMonth = data
    ? [monthKey(data.loadedAt), monthKey(SEASON_FROM)].sort()[1]
    : monthKey(SEASON_FROM)
  const maxMonth = monthKey(SEASON_TO.getTime() - 1)
  const firstAvailable = slots?.[0] ? monthKey(slots[0]) : null
  const visibleMonth =
    month ?? (selectedDay ? selectedDay.slice(0, 7) : null) ?? firstAvailable ?? minMonth

  const empty = slots !== null && slots.length === 0

  return (
    <div>
      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!startsAt}
        hint={startsAt ? undefined : 'Elige día y hora para continuar.'}
      />
      {notice && (
        <p role="alert" className="mb-6 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {notice}
        </p>
      )}

      {loadError && (
        <p role="alert" className="mb-6 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {loadError}
        </p>
      )}

      {slots === null && !loadError && <CalendarSkeleton />}

      {empty && (
        <p className="rounded-sm bg-white/50 p-6 text-center text-sm ring-1 ring-gold-light/50">
          De momento no hay huecos disponibles.{' '}
          <a
            href={CONTACT.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="font-normal text-gold-dark underline"
          >
            Síguenos en Instagram
          </a>{' '}
          para enterarte de nuevas fechas.
        </p>
      )}

      {slots && !empty && (
        <div className="grid gap-6 md:grid-cols-2">
          <MonthCalendar
            month={visibleMonth}
            minMonth={minMonth}
            maxMonth={maxMonth}
            availableDays={availableDays}
            selectedDay={selectedDay}
            onMonthChange={setMonth}
            onSelectDay={setSelectedDay}
          />
          <div aria-live="polite">
            {selectedDay && data ? (
              <>
                <p className="mb-3 text-sm">
                  Pasa el cursor por los huecos libres para ver la franja y pulsa para elegirla:
                </p>
                <DayTimeline
                  day={selectedDay}
                  windows={data.windows}
                  busy={data.busy}
                  slots={byDay.get(selectedDay) ?? []}
                  durationMin={durationMin}
                  bufferMin={data.config.bufferMin}
                  stepMin={data.config.stepMin}
                  selected={startsAt}
                  onSelect={onSelect}
                />
              </>
            ) : (
              <p className="text-sm text-ink/75">
                Elige un día resaltado en el calendario para ver las horas libres.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
