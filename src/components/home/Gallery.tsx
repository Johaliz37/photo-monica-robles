import Divider from '@/components/Divider'
import ResponsiveImage from '@/components/ResponsiveImage'

export default function Gallery() {
  return (
    <section aria-labelledby="galeria" className="bg-cream-dark/50 px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-center py-8 text-center">
          <Divider />
          <h2
            id="galeria"
            className="my-6 font-display text-4xl tracking-[0.1em] text-gold-dark sm:text-5xl"
          >
            Calendario
            <br />
            de faldilla
          </h2>
          <Divider />
        </div>
        <ResponsiveImage
          name="cal-2"
          alt="Dos calendarios de faldilla con fotos de tres hermanas sobre una alfombra con luces de Navidad"
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-[4/5] w-full rounded-sm object-cover"
        />
      </div>
    </section>
  )
}
