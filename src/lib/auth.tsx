import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  isAdmin: boolean
  loading: boolean
  /** Devuelve true si las credenciales son correctas. */
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // undefined = todavía no se sabe si hay sesión
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  // Usuario para el que se ha comprobado is_admin() y el resultado
  const [adminCheck, setAdminCheck] = useState<{ userId: string; isAdmin: boolean } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    // Fuera del callback de onAuthStateChange: llamar a Supabase dentro puede bloquearse
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!cancelled) setAdminCheck({ userId, isAdmin: !error && data === true })
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return !error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthState>(() => {
    const checked = adminCheck !== null && adminCheck.userId === userId
    return {
      session: session ?? null,
      isAdmin: checked && adminCheck.isAdmin,
      loading: session === undefined || (session !== null && !checked),
      signIn,
      signOut,
    }
  }, [session, adminCheck, userId, signIn, signOut])

  return <AuthContext value={value}>{children}</AuthContext>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return auth
}
