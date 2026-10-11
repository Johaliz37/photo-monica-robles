import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarList,
  ChartCard,
  ColumnChart,
  EmptyChart,
  SegmentBar,
  StatTile,
} from '@/components/admin/DashboardCharts'
import { BUTTON_SECONDARY } from '@/components/booking/Stepper'
import { PACKAGE_THEME } from '@/components/packageTheme'
import { Skeleton, SkeletonGroup } from '@/components/Skeleton'
import { findPackage } from '@/content/packages'
import { fetchDashboardData, type DashboardData } from '@/lib/adminApi'
import { computeDashboard, sessionMonths, type CountBucket } from '@/lib/dashboard'
import { toMadrid } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'
import { formatEUR } from '@/lib/money'

const pct = (ratio: number) => `${Math.round(ratio * 100)} %`

/** "2026-11-02" → "2 nov" */
const shortDay = (key: string) => format(toMadrid(`${key}T12:00:00Z`), 'd MMM', { locale: es })

/** "2026-11" → "Noviembre" */
const monthName = (key: string) => {
  const name = format(toMadrid(`${key}-15T12:00:00Z`), 'LLLL yyyy', { locale: es })
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function columns(series: CountBucket[], name: (key: string) => string) {
  return series.map((b) => ({ key: b.key, label: shortDay(b.key), name: name(b.key), value: b.count }))
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = searchParams.get('mes') ?? 'todo'

  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloads, setReloads] = useState(0)
  const reload = useCallback(() => setReloads((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    fetchDashboardData()
      .then((d) => {
        if (cancelled) return
        setData(d)
        setError(null)
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [reloads])

  const months = useMemo(() => (data ? sessionMonths(data.bookings) : []), [data])
  const stats = useMemo(
    () => (data ? computeDashboard(data.bookings, data.windows, period) : null),
    [data, period],
  )

  function setPeriod(value: string) {
    const next = new URLSearchParams(searchParams)
    if (value === 'todo') next.delete('mes')
    else next.set('mes', value)
    setSearchParams(next, { replace: true })
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl tracking-[0.2em] text-gold-dark">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            Sesiones de
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="min-h-11 rounded-sm bg-white/60 px-3 ring-1 ring-gold-light"
            >
              <option value="todo">Toda la temporada</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthName(m)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={reload} className={BUTTON_SECONDARY}>
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-6 rounded-sm bg-xmas-red/10 p-4 text-sm text-xmas-red">
          {error}
        </p>
      )}

      {!stats && !error && (
        <SkeletonGroup label="Cargando estadísticas…">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </SkeletonGroup>
      )}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              tone="gold"
              icon="📋"
              label="Reservas"
              value={stats.total}
              hint={`${stats.byStatus.pendiente} pend. · ${stats.byStatus.aceptada} acept. · ${stats.byStatus.rechazada} rech.`}
            />
            <StatTile
              tone="pine"
              icon="✅"
              label="Tasa de aceptación"
              value={stats.acceptanceRate === null ? '—' : pct(stats.acceptanceRate)}
              hint="De las reservas ya revisadas"
            />
            <StatTile
              tone="teal"
              icon="📅"
              label="Ocupación"
              value={
                stats.occupancy.totalMin > 0
                  ? pct(stats.occupancy.bookedMin / stats.occupancy.totalMin)
                  : '—'
              }
              hint={`${stats.occupancy.bookedMin} de ${stats.occupancy.totalMin} min abiertos`}
            />
            <StatTile
              tone="honey"
              icon="🏷️"
              label="Ticket medio"
              value={stats.avgTicketCents === null ? '—' : formatEUR(stats.avgTicketCents)}
              hint="Pendientes y aceptadas"
            />
            <StatTile
              tone="pine"
              icon="💶"
              label="Facturación aceptada"
              value={formatEUR(stats.revenueCents)}
              hint={`${formatEUR(stats.pendingCents)} más en pendientes`}
            />
            <StatTile
              tone="teal"
              icon="📲"
              label="Adelantos cobrados"
              value={formatEUR(stats.depositsCents)}
              hint="De las reservas aceptadas"
            />
            <StatTile
              tone="red"
              icon="👛"
              label="A cobrar en sesión"
              value={formatEUR(stats.dueAtSessionCents)}
              hint="En efectivo, de las aceptadas"
            />
            <StatTile
              tone="honey"
              icon="🎄"
              label="Preventa · bebé"
              value={`${stats.presaleCount} · ${stats.babyCount}`}
              hint="Reservas en preventa · con ampliación bebé"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Estado de las reservas" tone="gold">
              <SegmentBar
                segments={[
                  { label: 'Pendientes', value: stats.byStatus.pendiente, tone: 'gold' },
                  { label: 'Aceptadas', value: stats.byStatus.aceptada, tone: 'pine' },
                  { label: 'Rechazadas', value: stats.byStatus.rechazada, tone: 'red' },
                ]}
              />
            </ChartCard>

            <ChartCard title="Reservas por paquete" tone="red">
              {stats.byPackage.every((p) => p.count === 0) ? (
                <EmptyChart />
              ) : (
                <BarList
                  items={stats.byPackage.map((p) => ({
                    label: findPackage(p.code)?.name ?? p.code,
                    value: p.count,
                    valueLabel: `${p.count} · ${formatEUR(p.revenueCents)}`,
                    fill: PACKAGE_THEME[p.code].bg,
                  }))}
                />
              )}
              <p className="mt-4 text-xs">Pendientes y aceptadas. Importe sin descontar adelanto.</p>
            </ChartCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Sesiones por semana" tone="teal">
              {stats.bySessionWeek.length === 0 ? (
                <EmptyChart />
              ) : (
                <ColumnChart
                  caption="Sesiones por semana"
                  tone="teal"
                  items={columns(stats.bySessionWeek, (k) => `Semana del ${shortDay(k)}`)}
                />
              )}
            </ChartCard>

            <ChartCard title="Reservas recibidas por día" tone="pine">
              {stats.receivedByDay.length === 0 ? (
                <EmptyChart />
              ) : (
                <ColumnChart
                  caption="Reservas recibidas por día"
                  tone="pine"
                  items={columns(stats.receivedByDay, shortDay)}
                />
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </section>
  )
}
