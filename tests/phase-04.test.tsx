import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { isSupabaseConfigured, checkSupabaseConnection, supabase } from '@/lib/supabase'
import { authService } from '@/features/auth/services/auth.service'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { DraftStoreProvider } from '@/stores/draft.store'

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <AuthProvider>
      <DraftStoreProvider>{ui}</DraftStoreProvider>
    </AuthProvider>
  )
}

describe('Phase 4: Supabase Integration & Authentication', () => {
  describe('Supabase Client & Health Checker', () => {
    it('initializes Supabase client instance', () => {
      expect(supabase).toBeDefined()
      expect(supabase.auth).toBeDefined()
      expect(typeof supabase.from).toBe('function')
    })

    it('identifies configuration state gracefully without crashing', () => {
      expect(typeof isSupabaseConfigured).toBe('boolean')
    })

    it('checkSupabaseConnection returns connection status object', async () => {
      const status = await checkSupabaseConnection()
      expect(status).toHaveProperty('isConnected')
      expect(status).toHaveProperty('message')
      expect(typeof status.isConnected).toBe('boolean')
      expect(typeof status.message).toBe('string')
    })
  })

  describe('Authentication Service', () => {
    it('returns structured result for email sign in', async () => {
      const result = await authService.signInWithEmail('test@example.com', 'password123')
      expect(result).toHaveProperty('session')
      expect(result).toHaveProperty('error')
    })

    it('returns structured result for email sign up with full name', async () => {
      const result = await authService.signUpWithEmail(
        'newuser@example.com',
        'password123',
        'Jane Doe'
      )
      expect(result).toHaveProperty('session')
      expect(result).toHaveProperty('error')
    })

    it('handles sign out cleanly', async () => {
      const result = await authService.signOut()
      expect(result).toHaveProperty('error')
    })

    it('handles OAuth initiation gracefully', async () => {
      const result = await authService.signInWithOAuth('linkedin_oidc')
      expect(result).toHaveProperty('error')
    })
  })

  describe('Auth Modal Component', () => {
    it('renders sign in modal with title, email and password inputs', () => {
      renderWithProviders(<AuthModal open={true} onOpenChange={() => {}} defaultMode="sign-in" />)

      expect(screen.getByText('Welcome Back to draftin')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      const signInBtns = screen.getAllByRole('button', { name: /sign in/i })
      expect(signInBtns.length).toBeGreaterThanOrEqual(1)
    })

    it('switches between Sign In and Create Account tabs', () => {
      renderWithProviders(<AuthModal open={true} onOpenChange={() => {}} defaultMode="sign-in" />)

      // Click Create Account tab
      const createTab = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(createTab)

      expect(screen.getByText('Create Your draftin Account')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Alex Morgan')).toBeInTheDocument()
    })

    it('renders LinkedIn and Google OAuth buttons', () => {
      renderWithProviders(<AuthModal open={true} onOpenChange={() => {}} />)

      expect(screen.getByText('LinkedIn')).toBeInTheDocument()
      expect(screen.getByText('Google')).toBeInTheDocument()
    })
  })

  describe('Layout Auth Integration', () => {
    it('renders sign in trigger in sidebar and opens modal on click', async () => {
      renderWithProviders(<AppSidebar />)

      const signInButton = screen.getByTitle('Sign in with Supabase')
      expect(signInButton).toBeInTheDocument()
      expect(screen.getByText('Sign In / Register')).toBeInTheDocument()

      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText('Welcome Back to draftin')).toBeInTheDocument()
      })
    })

    it('renders sign in button in header and opens modal on click', async () => {
      renderWithProviders(<AppHeader />)

      const signInButtons = screen.getAllByRole('button', { name: /sign in/i })
      expect(signInButtons.length).toBeGreaterThan(0)

      fireEvent.click(signInButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Welcome Back to draftin')).toBeInTheDocument()
      })
    })
  })
})
