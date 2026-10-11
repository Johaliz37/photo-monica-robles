import { Link } from 'react-router-dom'
import ContactLinks from '@/components/ContactLinks'
import Divider from '@/components/Divider'
import type { PublicProfile } from '@/lib/profile'

export default function FinalCta({ profile }: { profile: PublicProfile }) {
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
      <ContactLinks
        profile={profile}
        variant="full"
        className="mt-10 flex flex-col items-center gap-1"
      />
    </section>
  )
}
