import { Link, Outlet } from 'react-router-dom'
import { CONTACT } from '@/content/site'

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-gold-light/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="font-display text-base whitespace-nowrap tracking-[0.2em] text-gold-dark sm:text-xl sm:tracking-[0.25em]"
          >
            MÓNICA ROBLES
          </Link>
          <Link
            to="/reservar"
            className="rounded-full bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cream transition hover:bg-ink"
          >
            Reservar
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-cream-dark">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-xs uppercase tracking-[0.2em] sm:flex-row sm:justify-between">
          <a
            href={CONTACT.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-gold-dark"
          >
            @{CONTACT.instagram}
          </a>
          <nav className="flex gap-6">
            <Link to="/privacidad" className="hover:text-gold-dark">
              Privacidad
            </Link>
            <Link to="/aviso-legal" className="hover:text-gold-dark">
              Aviso legal
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
