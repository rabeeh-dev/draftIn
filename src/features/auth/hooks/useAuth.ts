import { useContext } from 'react'
import { AuthContext } from '../context/auth-context-def'
import type { AuthContextType } from '../types/auth.types'

const fallbackAuthContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  role: 'user',
  status: 'active',
  isSuspended: false,
  error: null,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInWithOAuth: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  return context ?? fallbackAuthContext
}
