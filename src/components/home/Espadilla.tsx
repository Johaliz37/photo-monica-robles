import Divider from '@/components/Divider'
import ResponsiveImage from '@/components/ResponsiveImage'
import { ESPADILLA, type EspadillaCard } from '@/content/site'

const imageClass = 'h-full w-full rounded-sm object-cover shadow-sm'
// Media columna del contenedor (max-w-6xl = 1152 px) a partir de md; el navegador elige
// en el srcset el ancho que corresponda a la densidad de la pantalla.
const imageSizes = '(min-width: 1184px) 568px, (min-width: 768px) 50vw, 100vw'

function CardText({ card }: { card: EspadillaCard }) {
  return (
    <div className="flex flex-col justify-center p-6 sm:p-8">
      <div aria-hidden="true" className="flex items-center gap-3 text-gold">
        ✦<span className="h-px w-32 bg-gold-light" />
      </div>
      <h3 className="mt-3 font-display text-lg uppercase tracking-[0.2em] text-gold-dark">
        {card.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed tracking-wide">{card.text}</p>
    </div>
  )
}

/** Collage como la página 6 del PDF: imagen a la izquierda y texto a la derecha. */
export default function Espadilla() {
  return (
    <section aria-labelledby="espadilla" className="px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-center px-2 py-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">{ESPADILLA.kicker}</p>
          <h2
            id="espadilla"
            className="mt-2 font-display text-4xl uppercase tracking-[0.05em] text-gold-dark sm:text-6xl"
          >
            {ESPADILLA.title}
          </h2>
          <Divider className="mt-4" />
          <p className="mx-auto mt-4 max-w-sm text-xs uppercase tracking-[0.25em] text-gold-dark">
            {ESPADILLA.subtitle}
          </p>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed tracking-wide">
            {ESPADILLA.intro}
          </p>
        </div>
        <ResponsiveImage
          name={ESPADILLA.image}
          alt={ESPADILLA.imageAlt}
          sizes={imageSizes}
          className={`aspect-[4/5] object-[center_30%] ${imageClass}`}
        />

        {ESPADILLA.cards.map((card) =>
          card.image ? (
            <div key={card.title} className="contents">
              <ResponsiveImage
                name={card.image}
                alt={card.imageAlt ?? ''}
                sizes={imageSizes}
                className={`${card.imageFrame ?? 'aspect-[2/1]'} ${imageClass}`}
              />
              <CardText card={card} />
            </div>
          ) : (
            <div key={card.title} className="bg-cream-dark/50 md:col-span-2 md:text-center">
              <div className="mx-auto max-w-xl">
                <CardText card={card} />
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  )
}
