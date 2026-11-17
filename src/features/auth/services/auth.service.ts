import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AuthError, Session, User } from '@supabase/supabase-js'

export const authService = {
  async signInWithEmail(email: string, password: string): Promise<{ session: Session | null; error: AuthError | null }> {
    if (!isSupabaseConfigured) {
      return {
        session: null,
        error: { name: 'ConfigError', message: 'Supabase credentials are not configured in .env.local' } as AuthError,
      }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { session: data.session, error }
  },

  async signUpWithEmail(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ session: Session | null; error: AuthError | null }> {
    if (!isSupabaseConfigured) {
      return {
        session: null,
        error: { name: 'ConfigError', message: 'Supabase credentials are not configured in .env.local' } as AuthError,
      }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { session: data.session, error }
  },

  async signInWithOAuth(provider: 'linkedin_oidc' | 'google' | 'github'): Promise<{ error: AuthError | null }> {
    if (!isSupabaseConfigured) {
      return {
        error: { name: 'ConfigError', message: 'Supabase credentials are not configured in .env.local' } as AuthError,
      }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    return { error }
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    if (!isSupabaseConfigured) return { error: null }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    if (!isSupabaseConfigured) return { session: null, error: null }
    const { data, error } = await supabase.auth.getSession()
    return { session: data.session, error }
  },

  async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    if (!isSupabaseConfigured) return { user: null, error: null }
    const { data, error } = await supabase.auth.getUser()
    return { user: data.user, error }
  },
}
