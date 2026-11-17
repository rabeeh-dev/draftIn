import type { User, Session, AuthError } from '@supabase/supabase-js'

export type AuthMode = 'sign-in' | 'sign-up'

export interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  error: AuthError | null
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: AuthError | null }>
  signInWithOAuth: (provider: 'linkedin_oidc' | 'google' | 'github') => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}
