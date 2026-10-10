import { Link } from 'react-router-dom'
import { BUTTON_PRIMARY } from '@/components/booking/Stepper'

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <span aria-hidden="true" className="text-2xl text-gold">
        ✦
      </span>
      <p aria-hidden="true" className="mt-2 font-script text-8xl leading-none text-gold-dark">
        404
      </p>
      <h1 className="mt-6 font-display text-xl uppercase tracking-[0.2em] text-ink sm:text-2xl">
        Página no encontrada
      </h1>
      <div className="mx-auto my-6 h-px w-24 bg-gold-light" />
      <p className="text-sm leading-relaxed">
        Parece que esta página se ha perdido entre los regalos. Puede que el enlace esté mal escrito
        o que ya no exista.
      </p>
      <Link to="/" className={`mt-10 inline-block ${BUTTON_PRIMARY}`}>
        Volver al inicio
      </Link>
    </section>
  )
}
