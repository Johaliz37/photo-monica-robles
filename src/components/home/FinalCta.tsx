import { Link } from 'react-router-dom'
import Divider from '@/components/Divider'
import { CONTACT } from '@/content/site'

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function FinalCta() {
  return (
    <section aria-labelledby="reserva-cta" className="bg-cream-dark/50 px-4 py-20 text-center">
      <h2 id="reserva-cta" className="font-script text-6xl text-gold-dark sm:text-7xl">
        ¿Reservamos tu sesión?
      </h2>
      <Divider className="mt-4" />
      <Link
        to="/reservar"
        className="mt-8 inline-block rounded-full bg-gold-dark px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-cream shadow transition hover:bg-ink"
      >
        Reservar mi sesión
      </Link>
      <p className="mt-10">
        <a
          href={CONTACT.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 font-display tracking-[0.1em] text-gold-dark hover:text-ink"
        >
          <InstagramIcon />@{CONTACT.instagram}
        </a>
      </p>
    </section>
  )
}
