import { Link } from 'react-router-dom'
import type { Package } from '@/content/packages'
import { formatEURCompact } from '@/lib/money'
import { packagePrice, presaleStatus } from '@/lib/pricing'
import ResponsiveImage from './ResponsiveImage'

type Props = {
  pkg: Package
  now: Date
}

export default function PackageCard({ pkg, now }: Props) {
  const price = packagePrice(pkg, now)
  const upcoming = presaleStatus(now) === 'upcoming'
  const titleId = `paquete-${pkg.number}`

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col overflow-hidden rounded-sm bg-white/50 shadow-sm ring-1 ring-gold-light/40"
    >
      <div className="flex flex-1 flex-col px-6 pt-8 pb-6">
        <header className="flex items-start justify-between gap-4">
          <h3 id={titleId} className="relative">
            <span
              aria-hidden="true"
              className="absolute -top-6 -left-2 font-script text-7xl leading-none text-gold-light/60"
            >
              {pkg.number}
            </span>
            <span className="relative font-display text-xl tracking-[0.15em] text-gold-dark sm:text-2xl sm:tracking-[0.2em]">
              Paquete <span className="sr-only">{pkg.number}</span>
            </span>
          </h3>
          <div className="text-right">
            <p className="text-xs tracking-[0.15em] text-gold-dark">Inversión:</p>
            {price.original !== undefined && (
              <p className="font-display text-lg text-ink/60 line-through decoration-xmas-red decoration-2">
                <span className="sr-only">Antes </span>
                {formatEURCompact(price.original)}
              </p>
            )}
            <p className="font-display text-3xl font-semibold text-gold-dark">
              {price.discounted && <span className="sr-only">Ahora </span>}
              {formatEURCompact(price.current)}
            </p>
            {upcoming && (
              <p className="mt-1 text-xs text-xmas-red">
                Preventa: {formatEURCompact(pkg.presalePriceCents)}
              </p>
            )}
          </div>
        </header>

        <ul className="mt-6 flex-1 space-y-3 text-sm tracking-wide">
          {pkg.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="text-gold">
                ✦
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <Link
          to={`/reservar?paquete=${pkg.code}`}
          className="mt-8 rounded-full bg-gold-dark px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-cream transition hover:bg-ink"
        >
          Reservar este paquete
        </Link>
      </div>
      <ResponsiveImage
        name={pkg.image}
        alt={pkg.imageAlt}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="aspect-[4/3] w-full object-cover"
      />
    </article>
  )
}
