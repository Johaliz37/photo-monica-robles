import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import Spinner from '@/components/admin/Spinner'
import { BUTTON_PRIMARY } from '@/components/booking/Stepper'
import { useAuth } from '@/lib/auth'

const INPUT_CLASS =
  'mt-1 block min-h-11 w-full rounded-sm bg-white/70 px-3 ring-1 ring-gold-light focus:ring-gold-dark'

/** Solo rutas internas del admin (evita redirecciones abiertas con ?next=//otro.com). */
function safeNext(next: string | null): string {
  return next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'
}

export default function AdminLogin() {
  const { session, loading, signIn } = useAuth()
  const [searchParams] = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <Spinner />
  // Con sesión, el guard decide (lista o "sin acceso")
  if (session) return <Navigate to={next} replace />

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    const ok = await signIn(String(form.get('email')).trim(), String(form.get('password')))
    // Si va bien, onAuthStateChange actualiza la sesión y se redirige solo
    if (!ok) {
      setError('Credenciales incorrectas')
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-center font-display text-2xl tracking-[0.25em] text-gold">ACCESO</h1>
      <div className="mx-auto my-6 h-px w-24 bg-gold-light" />
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className={INPUT_CLASS}
          />
        </label>
        <label className="block text-sm">
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={INPUT_CLASS}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-sm bg-xmas-red/10 p-3 text-sm text-xmas-red">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`w-full ${BUTTON_PRIMARY}`}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}
