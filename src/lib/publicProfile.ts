// Lectura del perfil desde la web pública. Usa fetch contra la RPC de PostgREST en vez del
// cliente de Supabase para no cargar ese cliente (~55 kB gzip) en la home.
import { useEffect, useState } from 'react'
import { DEFAULT_PROFILE, type PublicProfile } from './profile'

let cached: Promise<PublicProfile> | null = null

async function fetchPublicProfile(): Promise<PublicProfile> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return DEFAULT_PROFILE

  const res = await fetch(`${url}/rest/v1/rpc/get_public_profile`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!res.ok) throw new Error(`get_public_profile: ${res.status}`)
  const rows = (await res.json()) as PublicProfile[]
  return rows[0] ?? DEFAULT_PROFILE
}

/** Una sola petición por carga de página; si falla, se usan los valores por defecto. */
export function loadPublicProfile(): Promise<PublicProfile> {
  cached ??= fetchPublicProfile().catch(() => {
    cached = null // reintenta en la próxima pantalla que lo pida
    return DEFAULT_PROFILE
  })
  return cached
}

/** Olvida el perfil cargado (tras guardarlo en el admin). */
export function invalidatePublicProfile(): void {
  cached = null
}

/** Perfil para la web pública. Devuelve los valores por defecto mientras carga. */
export function usePublicProfile(): PublicProfile {
  const [profile, setProfile] = useState<PublicProfile>(DEFAULT_PROFILE)
  useEffect(() => {
    let cancelled = false
    void loadPublicProfile().then((p) => !cancelled && setProfile(p))
    return () => {
      cancelled = true
    }
  }, [])
  return profile
}
