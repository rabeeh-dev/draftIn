import { useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { authService } from '../services/auth.service'
import { AuthContext } from './auth-context-def'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { AuthContextType } from '../types/auth.types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<AuthError | null>(null)

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

  const signInWithOAuth = async (provider: 'linkedin_oidc' | 'google' | 'github') => {
    setError(null)
    const { error: oAuthError } = await authService.signInWithOAuth(provider)
    if (oAuthError) setError(oAuthError)
    return { error: oAuthError }
  }

  const signInWithGoogle = async () => {
    return signInWithOAuth('google')
  }

  const signOut = async () => {
    await authService.signOut()
    setSession(null)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: Boolean(user),
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
