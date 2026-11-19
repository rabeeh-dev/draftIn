/**
 * Dedicated Administrator Authentication Service.
 * Isolates the Admin Console authentication from regular Supabase Google OAuth users.
 * Uses secure username and password authentication.
 */

const ADMIN_SESSION_STORAGE_KEY = 'draftin_admin_session_v1'

// Default credentials for administration portal (can be overridden via environment variables)
export const DEFAULT_ADMIN_USERNAME =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_USERNAME) || 'admin'
export const DEFAULT_ADMIN_PASSWORD =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_PASSWORD) || 'draftin@admin2026'

export interface AdminSession {
  username: string
  token: string
  authenticatedAt: string
}

export const adminAuthService = {
  login(username: string, password: string): { success: boolean; error?: string } {
    const trimmedUser = username.trim()
    const trimmedPass = password.trim()

    if (!trimmedUser || !trimmedPass) {
      return { success: false, error: 'Please enter both administrator username and password.' }
    }

    if (trimmedUser === DEFAULT_ADMIN_USERNAME && trimmedPass === DEFAULT_ADMIN_PASSWORD) {
      const session: AdminSession = {
        username: trimmedUser,
        token: `adm-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        authenticatedAt: new Date().toISOString(),
      }
      try {
        sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session))
        // Also mirror to localStorage in test environment
        if (
          (typeof globalThis !== 'undefined' &&
            (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
              ?.NODE_ENV === 'test') ||
          import.meta.env?.MODE === 'test'
        ) {
          localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session))
        }
      } catch {
        // Ignore storage errors
      }
      return { success: true }
    }

    return {
      success: false,
      error: 'Invalid administrator credentials. Please check your username and password.',
    }
  },

  logout(): void {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  },

  isAuthenticated(): boolean {
    try {
      const stored =
        sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
        localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AdminSession
        return Boolean(parsed?.username && parsed?.token)
      }
    } catch {
      return false
    }
    return false
  },

  getAdminSession(): AdminSession | null {
    try {
      const stored =
        sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
        localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as AdminSession
      }
    } catch {
      return null
    }
    return null
  },

  getAdminUsername(): string {
    const session = this.getAdminSession()
    return session?.username || DEFAULT_ADMIN_USERNAME
  },
}
