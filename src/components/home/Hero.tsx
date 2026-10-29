import { Link } from 'react-router-dom'
import SiteImage from '@/components/SiteImage'
import { IMAGES } from '@/content/images.generated'
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
  // Alto/ancho de la foto (mientras carga, el hueco reservado es 3:2)
  const fallback = IMAGES[FIXED_SECTIONS.hero.fallback]
  const ratio = !siteImages.ready
    ? 2 / 3
    : image
      ? image.height / image.width
      : fallback.height / fallback.width
  // El texto se monta sobre el 20 % superior de la foto (el margen en % va sobre el ancho)
  const overlap = `${-20 * ratio}%`

  return (
    <section className="bg-cream">
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 pt-14 text-center sm:pt-20">
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
          className="mt-8 rounded-full bg-gold-dark px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-cream shadow transition hover:bg-ink"
        >
          Reservar mi sesión
        </Link>

        <p className="mt-8 font-display text-sm tracking-[0.3em] text-ink">
          MÓNICA ROBLES
          <span aria-hidden="true" className="mx-auto my-1 block h-px w-32 bg-gold" />
          2026
        </p>
      </div>

      {/* Foto de portada completa, sin recortes: la subida en /admin/imagenes o, si no hay, la del código.
          En el móvil, a todo el ancho; desde md, al ancho del resto de la web (max-w-5xl). El margen
          del solapamiento se calcula sobre este contenedor, que mide lo mismo que la foto. */}
      <div className="mx-auto max-w-5xl md:px-4">
        <div
          className={`relative ${siteImages.ready ? '' : 'aspect-[3/2]'}`}
          style={{ marginTop: overlap }}
        >
          <SiteImage
            image={image}
            ready={siteImages.ready}
            fallback={FIXED_SECTIONS.hero.fallback}
            fallbackAlt={FIXED_SECTIONS.hero.fallbackAlt}
            priority
            className="block h-auto w-full"
          />
          {/* Degradado crema de arriba hacia abajo: el 20 % superior, bajo el texto, queda casi crema */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream from-5% via-cream/75 via-20% to-transparent to-45%"
          />
        </div>
      </div>
    </section>
  )
}
