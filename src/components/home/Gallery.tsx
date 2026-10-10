import Divider from '@/components/Divider'
import ResponsiveImage from '@/components/ResponsiveImage'

export default function Gallery() {
  return (
    <section aria-labelledby="galeria" className="bg-cream-dark/50 px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-center gap-4">
          <div className="py-8 text-center">
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
        <ResponsiveImage
          name="cal-1"
          alt="Manos sosteniendo un calendario de faldilla con la foto de una niña sonriente con gorro rojo"
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-[3/4] w-full rounded-sm object-cover object-[center_45%]"
        />
        <ResponsiveImage
          name="studio-1"
          alt="Niño pequeño riendo junto a un reno dorado y árboles de Navidad en el estudio"
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-[3/4] h-full w-full rounded-sm object-cover"
        />
        <ResponsiveImage
          name="studio-2"
          alt="Niña con jersey de corazones y falda de tul roja sentada entre regalos en el estudio navideño"
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-[3/4] h-full w-full rounded-sm object-cover"
        />
      </div>
    </section>
  )
}
