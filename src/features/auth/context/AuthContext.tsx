import { useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { authService } from '../services/auth.service'
import { AuthContext } from './auth-context-def'
export { AuthContext }
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { AuthContextType } from '../types/auth.types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<AuthError | null>(null)
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [isAdmin, setIsAdmin] = useState(false)

  // Resolves user role from secure claims and profile
  const resolveUserRole = async (currentUser: User | null): Promise<'admin' | 'user'> => {
    if (!currentUser) return 'user'
    // 1. Secure app_metadata (set by Supabase Auth / Admin RPC)
    if (currentUser.app_metadata?.role === 'admin' || currentUser.app_metadata?.is_admin === true) {
      return 'admin'
    }
    // 2. User metadata (development override)
    if (currentUser.user_metadata?.role === 'admin') {
      return 'admin'
    }
    // 3. Database profile role column if available
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      if (data && (data as { role?: string }).role === 'admin') {
        return 'admin'
      }
    } catch {
      // Ignore query errors in offline/unmigrated mode
    }
    return 'user'
  }

  useEffect(() => {
    let isCancelled = false

    if (user) {
      resolveUserRole(user).then((resolvedRole) => {
        if (!isCancelled) {
          setRole(resolvedRole)
          setIsAdmin(resolvedRole === 'admin')
        }
      })
    } else {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setRole('user')
          setIsAdmin(false)
        }
      })
    }

    return () => {
      isCancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    // 1. Fetch initial session
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError)
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    // 2. Listen to active auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    setError(null)
    const { session: newSession, error: signInError } = await authService.signInWithEmail(email, password)
    if (signInError) {
      setError(signInError)
      return { error: signInError }
    }
    setSession(newSession)
    setUser(newSession?.user ?? null)
    return { error: null }
  }

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    setError(null)
    const { session: newSession, error: signUpError } = await authService.signUpWithEmail(email, password, fullName)
    if (signUpError) {
      setError(signUpError)
      return { error: signUpError }
    }
    setSession(newSession)
    setUser(newSession?.user ?? null)
    return { error: null }
  }

  const signInWithOAuth = async (
    provider: 'linkedin_oidc' | 'google' | 'github',
    customRedirectTo?: string
  ) => {
    setError(null)
    const { error: oAuthError } = await authService.signInWithOAuth(provider, customRedirectTo)
    if (oAuthError) setError(oAuthError)
    return { error: oAuthError }
  }

  const signInWithGoogle = async (returnUrl?: string) => {
    return authService.signInWithGoogle(returnUrl)
  }

  const signOut = async () => {
    await authService.signOut()
    setSession(null)
    setUser(null)
    setRole('user')
    setIsAdmin(false)
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin,
    role,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
