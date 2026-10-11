// Piezas del dashboard: tarjetas de cifra y gráficos de barras sin librerías (HTML + Tailwind).
// El color acompaña, pero nunca va solo: cada barra y segmento lleva su etiqueta y su valor escritos.
import type { ReactNode } from 'react'

export type Tone = 'gold' | 'pine' | 'red' | 'teal' | 'honey'

type ToneClasses = {
  /** Franja superior de la tarjeta. */
  border: string
  /** Fondo suave de la tarjeta. */
  tint: string
  /** Texto de la etiqueta (contraste suficiente sobre crema). */
  text: string
  /** Relleno de barras y columnas. */
  fill: string
  /** Relleno al pasar el ratón. */
  fillHover: string
}

// Colores de la paleta (@theme). Clases literales para que Tailwind las detecte.
const TONES: Record<Tone, ToneClasses> = {
  gold: {
    border: 'border-gold-light',
    tint: 'bg-gold-light/15',
    text: 'text-gold-dark',
    fill: 'bg-gold-light',
    fillHover: 'group-hover:bg-gold-dark',
  },
  pine: {
    border: 'border-pine',
    tint: 'bg-pine/10',
    text: 'text-pine',
    fill: 'bg-pine',
    fillHover: 'group-hover:bg-ink',
  },
  red: {
    border: 'border-xmas-red',
    tint: 'bg-xmas-red/10',
    text: 'text-xmas-red',
    fill: 'bg-xmas-red',
    fillHover: 'group-hover:bg-ink',
  },
  teal: {
    border: 'border-teal',
    tint: 'bg-teal/10',
    text: 'text-teal',
    fill: 'bg-teal',
    fillHover: 'group-hover:bg-ink',
  },
  honey: {
    border: 'border-honey',
    tint: 'bg-honey/15',
    text: 'text-honey-dark',
    fill: 'bg-honey',
    fillHover: 'group-hover:bg-honey-dark',
  },
}

export function StatTile({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone: Tone
  icon?: string
}) {
  const t = TONES[tone]
  return (
    <div className={`rounded-sm border-t-4 p-4 ring-1 ring-gold-light/40 ${t.border} ${t.tint}`}>
      <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] ${t.text}`}>
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </p>
      <p className="mt-1 font-display text-2xl text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs">{hint}</p>}
    </div>
  )
}

export function ChartCard({
  title,
  tone,
  children,
}: {
  title: string
  tone: Tone
  children: ReactNode
}) {
  const t = TONES[tone]
  return (
    <section className={`rounded-sm border-t-4 bg-white/60 p-4 ring-1 ring-gold-light/40 ${t.border}`}>
      <h2 className={`mb-4 text-xs font-semibold uppercase tracking-[0.15em] ${t.text}`}>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function EmptyChart() {
  return <p className="py-8 text-center text-sm">Sin datos en este periodo.</p>
}

export interface BarItem {
  label: string
  value: number
  /** Texto del valor junto a la barra (por defecto, el número). */
  valueLabel?: string
  /** Clase de relleno de la barra (por defecto, dorado). */
  fill?: string
}

/** Barras horizontales con etiqueta y valor directos. */
export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-2.5 rounded-full ${item.fill ?? TONES.gold.fill}`} />
              {item.label}
            </span>
            <span className="font-semibold tabular-nums">{item.valueLabel ?? item.value}</span>
          </div>
          <div className="h-3 rounded-full bg-cream-dark">
            <div
              className={`h-full rounded-full ${item.fill ?? TONES.gold.fill}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export interface Segment {
  label: string
  value: number
  tone: Tone
}

/** Barra apilada al 100 % con leyenda (etiqueta, número y porcentaje). */
export function SegmentBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((acc, s) => acc + s.value, 0)
  if (total === 0) return <EmptyChart />
  return (
    <div>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              title={`${s.label}: ${s.value}`}
              className={TONES[s.tone].fill}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-2.5 rounded-full ${TONES[s.tone].fill}`} />
              {s.label}
            </span>
            <span className="tabular-nums">
              <span className="font-semibold">{s.value}</span>
              <span className="ml-2 text-xs">{Math.round((s.value / total) * 100)} %</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface ColumnItem {
  key: string
  /** Etiqueta corta bajo la columna ("2 nov"). */
  label: string
  /** Nombre completo, para el tooltip y la tabla ("Semana del 2 nov"). */
  name: string
  value: number
}

function reservas(n: number): string {
  return `${n} ${n === 1 ? 'reserva' : 'reservas'}`
}

/** Columnas verticales con tooltip al pasar el ratón y tabla accesible. */
export function ColumnChart({
  items,
  caption,
  tone,
}: {
  items: ColumnItem[]
  caption: string
  tone: Tone
}) {
  const t = TONES[tone]
  const max = Math.max(1, ...items.map((i) => i.value))
  // Con muchas columnas solo se rotulan algunas para que no se pisen
  const labelEvery = Math.ceil(items.length / 8)

  return (
    <div>
      <div className="flex h-40 items-end gap-0.5 border-b border-gold-light" aria-hidden="true">
        {items.map((item) => (
          <div key={item.key} className="group relative flex h-full flex-1 items-end">
            <div
              className={`w-full rounded-t-[4px] transition ${t.fill} ${t.fillHover}`}
              style={{ height: item.value > 0 ? `${(item.value / max) * 100}%` : 0 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-sm bg-ink px-2 py-1 text-xs whitespace-nowrap text-cream group-hover:block">
              {item.name}: {reservas(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-0.5 text-[0.65rem]" aria-hidden="true">
        {items.map((item, i) => (
          <span key={item.key} className="flex-1 truncate text-center">
            {i % labelEvery === 0 ? item.label : ''}
          </span>
        ))}
      </div>
      <details className="mt-3 text-xs">
        <summary className={`cursor-pointer ${t.text}`}>Ver tabla</summary>
        <table className="mt-2 w-full">
          <caption className="sr-only">{caption}</caption>
          <tbody>
            {items.map((item) => (
              <tr key={item.key} className="border-b border-gold-light/30">
                <td className="py-1">{item.name}</td>
                <td className="py-1 text-right tabular-nums">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
