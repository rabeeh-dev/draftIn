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
  const [status, setStatus] = useState<'active' | 'suspended'>('active')
  const [isSuspended, setIsSuspended] = useState(false)

  // Resolves user role and account status from secure server claims and profile table
  const resolveUserProfile = async (
    currentUser: User | null
  ): Promise<{ role: 'admin' | 'user'; status: 'active' | 'suspended' }> => {
    if (!currentUser) return { role: 'user', status: 'active' }

    let resolvedRole: 'admin' | 'user' = 'user'
    let resolvedStatus: 'active' | 'suspended' = 'active'

    // 1. Secure app_metadata (set by Supabase Auth server / admin claims)
    if (
      currentUser.app_metadata?.role === 'admin' ||
      currentUser.app_metadata?.is_admin === true
    ) {
      resolvedRole = 'admin'
    }

    // 2. Database profile role and status columns
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', currentUser.id)
        .single()

      if (data) {
        const p = data as { role?: string; status?: string }
        if (p.role === 'admin') {
          resolvedRole = 'admin'
        }
        if (p.status === 'suspended') {
          resolvedStatus = 'suspended'
        }
      }
    } catch {
      // Ignore query errors in offline/unmigrated mode
    }

    return { role: resolvedRole, status: resolvedStatus }
  }

  useEffect(() => {
    let isCancelled = false

    if (user) {
      resolveUserProfile(user).then(({ role: resolvedRole, status: resolvedStatus }) => {
        if (!isCancelled) {
          setRole(resolvedRole)
          setIsAdmin(resolvedRole === 'admin')
          setStatus(resolvedStatus)
          setIsSuspended(resolvedStatus === 'suspended')
        }
      })
    } else {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setRole('user')
          setIsAdmin(false)
          setStatus('active')
          setIsSuspended(false)
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
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
    const { session: newSession, error: signInError } = await authService.signInWithEmail(
      email,
      password
    )
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
    const { session: newSession, error: signUpError } = await authService.signUpWithEmail(
      email,
      password,
      fullName
    )
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
    setStatus('active')
    setIsSuspended(false)
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin,
    role,
    status,
    isSuspended,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
