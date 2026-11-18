import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { authService } from '@/features/auth/services/auth.service'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { DraftStoreProvider } from '@/stores/draft.store'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { supabase } from '@/lib/supabase'

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <AuthProvider>
      <DraftStoreProvider>{ui}</DraftStoreProvider>
    </AuthProvider>
  )
}

describe('Phase 7: User Authentication with Google Only', () => {
  describe('Authentication Service - Google OAuth', () => {
    it('defines signInWithGoogle method on authService', () => {
      expect(typeof authService.signInWithGoogle).toBe('function')
    })

    it('delegates signInWithGoogle to signInWithOAuth with google provider', async () => {
      const spy = vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
        data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/v2/auth' },
        error: null,
      })

      const res = await authService.signInWithGoogle()
      expect(res.error).toBeNull()
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      )
      spy.mockRestore()
    })
  })

  describe('Google-Only Login Page Component', () => {
    it('renders the dedicated Google login page with proper branding', () => {
      renderWithProviders(<LoginPage onBack={() => {}} />)

      expect(screen.getByText('Sign in to draftin')).toBeInTheDocument()
      expect(screen.getByText('Continue with Google')).toBeInTheDocument()
      expect(screen.getByText('Auth Studio')).toBeInTheDocument()
    })

    it('does NOT render email or password inputs (Google authentication only)', () => {
      renderWithProviders(<LoginPage onBack={() => {}} />)

      // Ensure no password or email inputs exist on this dedicated Google auth page
      expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText('name@example.com')).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    })

    it('invokes signInWithGoogle when "Continue with Google" button is clicked', async () => {
      const oAuthSpy = vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
        data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/v2/auth' },
        error: null,
      })

      renderWithProviders(<LoginPage onBack={() => {}} />)

      const googleBtn = screen.getByRole('button', { name: /continue with google/i })
      fireEvent.click(googleBtn)

      await waitFor(() => {
        expect(oAuthSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: 'google',
          })
        )
      })

      oAuthSpy.mockRestore()
    })

    it('calls onBack when clicking "Back to Workspace" or guest mode', () => {
      const handleBack = vi.fn()
      renderWithProviders(<LoginPage onBack={handleBack} />)

      const backBtn = screen.getByRole('button', { name: /back to workspace/i })
      fireEvent.click(backBtn)
      expect(handleBack).toHaveBeenCalledTimes(1)

      const guestBtn = screen.getByText(/continue in guest mode without signing in/i)
      fireEvent.click(guestBtn)
      expect(handleBack).toHaveBeenCalledTimes(2)
    })
  })

  describe('Sidebar Google Login Integration', () => {
    it('renders Google Sign In button in sidebar when unauthenticated', () => {
      renderWithProviders(<AppSidebar />)
      expect(screen.getByText('Google Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sync cloud drafts')).toBeInTheDocument()
    })
  })
})
