import { Link } from 'react-router-dom'
import SiteImage from '@/components/SiteImage'
import { PRESALE } from '@/content/site'
import { presaleStatus } from '@/lib/pricing'
import type { SiteImagesState } from '@/lib/publicSiteImages'
import { FIXED_SECTIONS } from '@/lib/siteImages'

type Props = {
  now: Date
  siteImages: SiteImagesState
}

export default function Hero({ now, siteImages }: Props) {
  const showPresale = presaleStatus(now) !== 'ended'
  const image = siteImages.images.hero

  return (
    <section className="relative isolate overflow-hidden">
      {/* Foto de portada: la subida en /admin/imagenes o, si no hay, la del código */}
      <SiteImage
        image={image}
        ready={siteImages.ready}
        fallback={FIXED_SECTIONS.hero.fallback}
        fallbackAlt={FIXED_SECTIONS.hero.fallbackAlt}
        priority
        // La foto por defecto se encuadra por abajo; una subida, por el centro
        className={`absolute inset-0 -z-20 h-full w-full object-cover ${image ? 'object-center' : 'object-bottom'}`}
      />
      {/* Velo crema para que el texto se lea sobre la foto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-cream via-cream/85 to-cream/40"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-14 pb-20 text-center sm:pt-20 sm:pb-28">
        <span aria-hidden="true" className="text-2xl text-gold">
          ✦
        </span>
        <h1 className="mt-2">
          <span className="block font-display text-2xl tracking-[0.2em] text-ink sm:text-5xl sm:tracking-[0.25em]">
            PAQUETES DE
          </span>
          <span className="block font-script text-7xl leading-tight text-gold-dark sm:text-9xl">
            Navidad
          </span>
        </h1>

        {showPresale && (
          <>
            <div className="mt-6 flex items-center gap-4">
              <span className="h-px w-12 bg-gold sm:w-20" />
              <p className="font-display text-lg tracking-[0.25em] text-ink sm:text-xl sm:tracking-[0.3em]">
                PREVENTA
              </p>
              <span className="h-px w-12 bg-gold sm:w-20" />
            </div>
            <p className="mt-2 max-w-sm font-display text-base tracking-[0.12em] text-ink sm:max-w-none sm:text-lg">
              DEL DOMINGO 11 AL VIERNES 16 DE OCTUBRE
            </p>
            <p className="mt-6 flex size-32 flex-col items-center justify-center rounded-full border border-gold-light bg-cream/90 font-display text-gold-dark shadow-md">
              <span className="text-4xl font-semibold">{PRESALE.discountPct}%</span>
              <span className="text-xs leading-tight tracking-wider">
                DE
                <br />
                DESCUENTO
              </span>
            </p>
          </>
        )}

        <Link
          to="/reservar"
          className="mt-10 rounded-full bg-gold-dark px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-cream shadow transition hover:bg-ink"
        >
          Reservar mi sesión
        </Link>

        <p className="mt-12 font-display text-sm tracking-[0.3em] text-ink">
          MÓNICA ROBLES
          <span aria-hidden="true" className="mx-auto my-1 block h-px w-32 bg-gold" />
          2026
        </p>
      </div>
    </section>
  )
}
