import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { CAROUSEL, SITE_IMAGE_DEFAULT_ALT } from '@/content/site'
import { siteImageUrl, type PublicSiteImage } from '@/lib/siteImages'

// Destellos decorativos del fondo: posición (%) y tamaño
const SPARKLES = [
  { top: 8, left: 6, size: 'text-xl' },
  { top: 18, left: 88, size: 'text-3xl' },
  { top: 62, left: 3, size: 'text-2xl' },
  { top: 80, left: 92, size: 'text-xl' },
  { top: 40, left: 96, size: 'text-sm' },
  { top: 90, left: 14, size: 'text-sm' },
]

const BUTTON =
  'flex size-11 shrink-0 items-center justify-center rounded-full bg-cream/10 text-xl text-cream ring-1 ring-gold-light/60 transition hover:bg-gold-light hover:text-pine disabled:opacity-40'

/** Distancia mínima (px) del deslizamiento con el dedo para pasar de hoja. */
const SWIPE_PX = 40

type Side = 'left' | 'right'
type Flip = { dir: 'next' | 'prev'; to: number }

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/**
 * Fotos de sesiones de Navidad (subidas en /admin/imagenes) sobre el fondo navideño.
 * Desde md, un álbum antiguo a doble página; en móvil, una tira sencilla de fotos que se
 * desliza con el dedo. Sin fotos no se muestra.
 */
export default function ChristmasCarousel({ images }: { images: PublicSiteImage[] }) {
  const wide = useMediaQuery('(min-width: 768px)')
  if (images.length === 0) return null

  return (
    <section
      aria-labelledby="momentos"
      className="relative isolate overflow-hidden bg-pine px-4 py-16 text-cream sm:py-20"
    >
      {/* Luz cálida de fondo y destellos */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.35),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(168,38,43,0.35),transparent_55%)]"
      />
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`pointer-events-none absolute -z-10 animate-pulse text-gold-light/60 ${s.size}`}
          style={{ top: `${s.top}%`, left: `${s.left}%`, animationDelay: `${i * 0.4}s` }}
        >
          ✦
        </span>
      ))}

      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-light">{CAROUSEL.kicker}</p>
          <h2
            id="momentos"
            className="mt-3 font-display text-3xl uppercase tracking-[0.15em] text-cream sm:text-5xl"
          >
            {CAROUSEL.title}
            <span className="-mt-1 block font-script text-5xl normal-case tracking-normal text-gold-light sm:text-7xl">
              {CAROUSEL.script}
            </span>
          </h2>
          <div aria-hidden="true" className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-16 bg-gold-light/70 sm:w-24" />
            <span className="text-sm text-gold-light">✦</span>
            <span className="h-px w-16 bg-gold-light/70 sm:w-24" />
          </div>
          <p className="mt-6 text-sm leading-relaxed tracking-wide text-cream/90 sm:text-base">
            {CAROUSEL.intro}
          </p>
        </header>

        {wide ? <Album images={images} /> : <PhotoStrip images={images} />}

        <div className="mt-10 text-center">
          <Link
            to="/reservar"
            className="inline-block rounded-full bg-gold-light px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-pine shadow-lg transition hover:bg-cream"
          >
            {CAROUSEL.cta}
          </Link>
        </div>
      </div>
    </section>
  )
}

/**
 * Móvil: las fotos en fila, deslizando con el dedo (scroll-snap nativo), con marco dorado.
 * Se asoma un trozo de la siguiente para que se note que hay más.
 */
function PhotoStrip({ images }: { images: PublicSiteImage[] }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return (
    <ul
      aria-label="Fotos de sesiones de Navidad"
      className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-[10%] py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {images.map((image, i) => {
        const url = siteImageUrl(supabaseUrl, image.path)
        return (
          <li
            key={image.path}
            className="aspect-[3/4] w-[80%] max-w-xs shrink-0 snap-center overflow-hidden rounded-lg bg-cream/10 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.7)] ring-2 ring-gold-light/70"
          >
            {url && (
              <img
                src={url}
                width={image.width}
                height={image.height}
                alt={image.alt || SITE_IMAGE_DEFAULT_ALT}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className="size-full object-cover"
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Álbum de fotos antiguo a doble página (a una sola si solo hay una foto). Las hojas pasan con
 * un giro 3D (flechas, puntos, teclado, deslizamiento o pase automático, que se pausa al pasar
 * el ratón, al enfocar o con el botón de pausa).
 */
function Album({ images }: { images: PublicSiteImage[] }) {
  const count = images.length
  const perView = count > 1 ? 2 : 1
  const spreads = Math.max(1, Math.ceil(count / perView))

  const [rawIndex, setIndex] = useState(0)
  // Primera foto visible, alineada al inicio de la vista
  const index = Math.floor(Math.min(rawIndex, Math.max(0, count - 1)) / perView) * perView
  const spread = index / perView
  const [flip, setFlip] = useState<Flip | null>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [paused, setPaused] = useState(prefersReducedMotion)
  const swipeStart = useRef<number | null>(null)

  /** Pasa a la vista `target` (se da la vuelta al llegar al final o al principio). */
  function turnTo(target: number, dir?: Flip['dir']) {
    if (flip || count === 0) return
    const to = (((target % spreads) + spreads) % spreads) * perView
    if (to === index) return
    if (prefersReducedMotion()) {
      setIndex(to)
      return
    }
    setFlip({ dir: dir ?? (to > index ? 'next' : 'prev'), to })
  }

  // Al terminar el giro, la hoja nueva queda fija
  useEffect(() => {
    if (!flip) return
    const id = window.setTimeout(() => {
      setIndex(flip.to)
      setFlip(null)
    }, CAROUSEL.flipMs)
    return () => window.clearTimeout(id)
  }, [flip])

  const running = !paused && !hovered && !focused && spreads > 1
  useEffect(() => {
    if (!running || flip) return
    const id = window.setTimeout(() => {
      if (document.visibilityState !== 'visible' || prefersReducedMotion()) return
      setFlip({ dir: 'next', to: ((spread + 1) % spreads) * perView })
    }, CAROUSEL.autoplayMs)
    return () => window.clearTimeout(id)
  }, [running, flip, spread, spreads, perView])

  // Precarga las fotos de la siguiente vista para que la hoja no gire en blanco
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  useEffect(() => {
    const next = ((spread + 1) % spreads) * perView
    for (const img of images.slice(next, next + perView)) {
      const url = siteImageUrl(supabaseUrl, img.path)
      if (url) new Image().src = url
    }
  }, [images, spread, spreads, perView, supabaseUrl])

  const page = (i: number, side: Side) =>
    i < count ? (
      <AlbumPage image={images[i]} number={i + 1} side={side} />
    ) : (
      <EmptyPage side={side} />
    )

  // Lo que queda debajo de la hoja que gira es ya la vista nueva
  let leftSlot = index
  let rightSlot = perView === 2 ? index + 1 : index
  if (flip?.dir === 'prev' && perView === 2) leftSlot = flip.to
  if (flip?.dir === 'next') rightSlot = perView === 2 ? flip.to + 1 : flip.to

  let leaf: { className: string; style: CSSProperties; front: ReactNode; back: ReactNode } | null =
    null
  if (flip && perView === 2) {
    leaf =
      flip.dir === 'next'
        ? {
            className: 'album-turn-next',
            style: { left: '50%', transformOrigin: 'left center' },
            front: page(index + 1, 'right'),
            back: page(flip.to, 'left'),
          }
        : {
            className: 'album-turn-prev',
            style: { left: 0, transformOrigin: 'right center' },
            front: page(index, 'left'),
            back: page(flip.to + 1, 'right'),
          }
  } else if (flip) {
    // Una página: la hoja gira sobre el lomo de la izquierda; su dorso es papel en blanco
    leaf = {
      className: flip.dir === 'next' ? 'album-turn-next' : 'album-turn-back',
      style: { left: 0, transformOrigin: 'left center' },
      front: page(flip.dir === 'next' ? index : flip.to, 'right'),
      back: <div className="album-paper album-page-left size-full" />,
    }
  }

  const first = index + 1
  const last = Math.min(count, index + perView)
  const pagesLabel =
    first === last ? `Foto ${first} de ${count}` : `Fotos ${first} y ${last} de ${count}`

  function onPointerDown(e: PointerEvent) {
    swipeStart.current = e.clientX
  }
  function onPointerUp(e: PointerEvent) {
    if (swipeStart.current === null) return
    const delta = e.clientX - swipeStart.current
    swipeStart.current = null
    if (Math.abs(delta) >= SWIPE_PX)
      turnTo(spread + (delta < 0 ? 1 : -1), delta < 0 ? 'next' : 'prev')
  }

  return (
    <div
      role="region"
      aria-roledescription="álbum de fotos"
      aria-label="Álbum de sesiones de Navidad"
      tabIndex={0}
      className="mt-12 rounded-md focus-visible:outline-gold-light"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') turnTo(spread + 1, 'next')
        else if (e.key === 'ArrowLeft') turnTo(spread - 1, 'prev')
      }}
    >
      {/* Libro: tapas de cuero y hojas encima */}
      <div
        className={`album-cover relative mx-auto touch-pan-y rounded-md p-4 select-none sm:p-6 ${perView === 2 ? 'max-w-4xl' : 'max-w-sm'}`}
        style={
          { perspective: '2400px', '--album-flip-ms': `${CAROUSEL.flipMs}ms` } as CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStart.current = null)}
      >
        <div
          aria-live={running ? 'off' : 'polite'}
          aria-label={pagesLabel}
          role="group"
          className={`relative grid ${perView === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {perView === 2 && <div className="aspect-[3/4]">{page(leftSlot, 'left')}</div>}
          <div className="aspect-[3/4]">{page(rightSlot, 'right')}</div>

          {/* Lomo */}
          {perView === 2 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-8 -translate-x-1/2 bg-[linear-gradient(to_right,transparent,rgba(40,20,5,0.35)_45%,rgba(40,20,5,0.45)_50%,rgba(40,20,5,0.35)_55%,transparent)]"
            />
          )}

          {/* Cinta marcapáginas */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 right-[12%] z-10 h-28 w-4 bg-xmas-red shadow-md sm:-top-8 sm:h-32"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%)' }}
          />

          {leaf && (
            <div
              key={`${flip?.dir}-${flip?.to}`}
              aria-hidden="true"
              className={`album-leaf absolute inset-y-0 z-20 ${perView === 2 ? 'w-1/2' : 'w-full'} ${leaf.className}`}
              style={leaf.style}
            >
              <div className="album-face absolute inset-0">
                {leaf.front}
                <span className="album-shade pointer-events-none absolute inset-0" />
              </div>
              <div className="album-face album-face-back absolute inset-0">
                {leaf.back}
                <span className="album-shade pointer-events-none absolute inset-0" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 px-4">
        <button
          type="button"
          onClick={() => turnTo(spread - 1, 'prev')}
          disabled={spreads < 2}
          aria-label="Página anterior"
          className={BUTTON}
        >
          ‹
        </button>
        <p className="min-w-24 text-center text-sm">
          <span className="font-display text-lg text-gold-light">
            {first === last ? first : `${first}–${last}`}
          </span>
          <span className="text-cream/70"> / {count}</span>
        </p>
        <button
          type="button"
          onClick={() => turnTo(spread + 1, 'next')}
          disabled={spreads < 2}
          aria-label="Página siguiente"
          className={BUTTON}
        >
          ›
        </button>
        {spreads > 1 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Reanudar el pase automático' : 'Pausar el pase automático'}
            className={`${BUTTON} text-sm`}
          >
            {paused ? '▶' : '❚❚'}
          </button>
        )}
      </div>

      {spreads > 1 && spreads <= 24 && (
        <div className="mt-4 flex flex-wrap justify-center gap-1 px-4">
          {Array.from({ length: spreads }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => turnTo(i)}
              aria-label={`Ir a la página ${i + 1}`}
              aria-current={i === spread ? 'true' : undefined}
              className="flex size-6 items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  i === spread ? 'w-5 bg-gold-light' : 'w-1.5 bg-cream/40'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Hoja del álbum con la foto sujeta con esquineros y un pie manuscrito. */
function AlbumPage({
  image,
  number,
  side,
}: {
  image: PublicSiteImage
  number: number
  side: Side
}) {
  const url = siteImageUrl(import.meta.env.VITE_SUPABASE_URL, image.path)
  const landscape = image.width > image.height
  // Cada foto un poco torcida, como pegada a mano
  const tilt = number % 2 === 0 ? 'rotate-[1.2deg]' : '-rotate-[1.4deg]'
  return (
    <figure
      className={`album-paper album-page-${side} flex size-full flex-col items-center px-[9%] pt-[10%] pb-[6%]`}
    >
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          className={`relative bg-[#fbf5e6] p-[3%] shadow-[0_6px_14px_-6px_rgba(40,20,5,0.6)] ${tilt} ${landscape ? 'w-full' : 'h-full'}`}
          style={{
            aspectRatio: `${image.width} / ${image.height}`,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {url && (
            <img
              src={url}
              width={image.width}
              height={image.height}
              alt={image.alt || SITE_IMAGE_DEFAULT_ALT}
              loading="eager"
              decoding="async"
              draggable={false}
              className="album-photo size-full object-cover"
            />
          )}
          <span aria-hidden="true" className="album-corner album-corner-tl" />
          <span aria-hidden="true" className="album-corner album-corner-tr" />
          <span aria-hidden="true" className="album-corner album-corner-bl" />
          <span aria-hidden="true" className="album-corner album-corner-br" />
        </div>
      </div>
      <figcaption className="mt-[6%] line-clamp-1 text-center font-script text-2xl leading-tight text-gold-dark sm:text-3xl">
        {image.alt || CAROUSEL.caption}
      </figcaption>
      <p
        aria-hidden="true"
        className="mt-1 font-display text-[0.65rem] tracking-[0.3em] text-gold/80"
      >
        — {number} —
      </p>
    </figure>
  )
}

/** Hoja en blanco al final del álbum: invita a reservar. */
function EmptyPage({ side }: { side: Side }) {
  return (
    <div
      className={`album-paper album-page-${side} flex size-full flex-col items-center justify-center gap-4 p-[12%] text-center`}
    >
      <span aria-hidden="true" className="text-2xl text-gold">
        ❦
      </span>
      <p className="font-script text-4xl text-gold-dark sm:text-5xl">{CAROUSEL.emptyPage.title}</p>
      <p className="text-sm leading-relaxed text-ink/80">{CAROUSEL.emptyPage.text}</p>
      <Link
        to="/reservar"
        className="mt-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark ring-1 ring-gold-light transition hover:bg-gold-light/30"
      >
        {CAROUSEL.emptyPage.link}
      </Link>
    </div>
  )
}
