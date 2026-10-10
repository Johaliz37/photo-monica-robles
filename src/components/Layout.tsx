import { Link, Outlet } from 'react-router-dom'
import ResponsiveImage from '@/components/ResponsiveImage'
import Snowfall from '@/components/Snowfall'
import { CONTACT } from '@/content/site'

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Snowfall />
      <header className="bg-teal">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
          <Link to="/" className="shrink-0">
            <ResponsiveImage
              name="logo"
              alt="Mónica Robles Fotografía"
              priority
              sizes="(min-width: 640px) 210px, 140px"
              className="h-auto w-[140px] sm:w-[210px]"
            />
          </Link>
          <Link
            to="/reservar"
            className="rounded-full bg-leaf px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal transition hover:bg-cream"
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
