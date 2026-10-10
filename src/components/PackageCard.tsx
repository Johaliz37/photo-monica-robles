import { Link } from 'react-router-dom'
import type { Package } from '@/content/packages'
import { formatEURCompact } from '@/lib/money'
import { packagePrice, presaleStatus } from '@/lib/pricing'
import { PACKAGE_THEME } from './packageTheme'
import PeekingCharacter from './PeekingCharacter'
import ResponsiveImage from './ResponsiveImage'

type Props = {
  pkg: Package
  now: Date
}

export default function PackageCard({ pkg, now }: Props) {
  const price = packagePrice(pkg, now)
  const upcoming = presaleStatus(now) === 'upcoming'
  const titleId = `paquete-${pkg.number}`
  const theme = PACKAGE_THEME[pkg.code]

  return (
    // El contenedor se agranda al resaltar y lleva consigo al personaje que se asoma.
    <div className="group relative flex transition duration-300 ease-out hover:z-10 hover:scale-105 focus-within:z-10 focus-within:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-within:scale-100">
      <PeekingCharacter code={pkg.code} side={pkg.code === 'P2' ? 'left' : 'right'} />
      <article
        aria-labelledby={titleId}
        className={`relative flex flex-1 flex-col overflow-hidden rounded-sm bg-white/50 shadow-sm ring-1 transition-shadow duration-300 group-hover:shadow-2xl group-focus-within:shadow-2xl ${theme.ring} ${theme.shadow}`}
      >
        <div aria-hidden="true" className={`h-1.5 ${theme.bg}`} />
        <ResponsiveImage
          name={pkg.image}
          alt={pkg.imageAlt}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="aspect-[4/3] w-full object-cover"
        />
        <div className="flex flex-1 flex-col px-6 pt-8 pb-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h3 id={titleId} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute -top-6 -left-2 font-script text-7xl leading-none ${theme.number}`}
                >
                  {pkg.number}
                </span>
                <span className="relative font-display text-xl tracking-[0.15em] text-gold-dark sm:text-2xl sm:tracking-[0.2em]">
                  Paquete <span className="sr-only">{pkg.number}: </span>
                </span>
                <span
                  className={`relative mt-1 block font-script text-2xl sm:text-3xl ${theme.text}`}
                >
                  {pkg.name}
                </span>
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs tracking-[0.15em] text-gold-dark">Inversión:</p>
              {price.original !== undefined && (
                <p className="font-display text-lg text-ink/60 line-through decoration-xmas-red decoration-2">
                  <span className="sr-only">Antes </span>
                  {formatEURCompact(price.original)}
                </p>
              )}
              <p className={`font-display text-3xl font-semibold ${theme.text}`}>
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
                <span aria-hidden="true" className={theme.text}>
                  ✦
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link
            to={`/reservar?paquete=${pkg.code}`}
            className={`mt-8 rounded-full px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-ink ${theme.bg} ${theme.buttonText}`}
          >
            Reservar este paquete
          </Link>
        </div>
      </article>
    </div>
  )
}
