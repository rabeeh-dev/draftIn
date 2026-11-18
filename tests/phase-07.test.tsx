import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { authService } from '@/features/auth/services/auth.service'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { adminService } from '@/features/admin/services/admin.service'
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

describe('Phase 7: User Authentication & Admin Panel', () => {
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

  describe('Sidebar Integration', () => {
    it('renders Google Sign In button in sidebar when unauthenticated', () => {
      renderWithProviders(<AppSidebar />)
      expect(screen.getByText('Google Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sync cloud drafts')).toBeInTheDocument()
    })

    it('renders Admin Panel entry in sidebar navigation', () => {
      renderWithProviders(<AppSidebar />)
      expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    })
  })

  describe('Admin Service', () => {
    it('returns seed or stored users and computes stats accurately', () => {
      const users = adminService.getUsers()
      expect(Array.isArray(users)).toBe(true)
      expect(users.length).toBeGreaterThan(0)

      const stats = adminService.computeStats(users)
      expect(stats.totalUsers).toBe(users.length)
      expect(stats).toHaveProperty('activeUsers')
      expect(stats).toHaveProperty('suspendedUsers')
      expect(stats).toHaveProperty('totalDrafts')
      expect(stats).toHaveProperty('totalAdmins')
    })

    it('updates user role and status', () => {
      const users = adminService.getUsers()
      const firstUser = users[0]

      const updatedRole = adminService.updateUserRole(firstUser.id, 'moderator')
      const targetUserRole = updatedRole.find((u) => u.id === firstUser.id)
      expect(targetUserRole?.role).toBe('moderator')

      const updatedStatus = adminService.updateUserStatus(firstUser.id, 'suspended')
      const targetUserStatus = updatedStatus.find((u) => u.id === firstUser.id)
      expect(targetUserStatus?.status).toBe('suspended')
    })
  })

  describe('Admin Panel Component', () => {
    it('renders the Admin Console with metrics and user table', () => {
      renderWithProviders(<AdminPanel onBack={() => {}} />)

      expect(screen.getByText('draftin Admin Console')).toBeInTheDocument()
      expect(screen.getByText('Superadmin Mode')).toBeInTheDocument()
      expect(screen.getByText('Total Creators')).toBeInTheDocument()
      expect(screen.getByText('Active Accounts')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/search users by name/i)).toBeInTheDocument()
    })

    it('filters users using search query', () => {
      renderWithProviders(<AdminPanel onBack={() => {}} />)

      const searchInput = screen.getByPlaceholderText(/search users by name/i)
      fireEvent.change(searchInput, { target: { value: 'Alex Morgan' } })

      expect(screen.getByText('Alex Morgan')).toBeInTheDocument()
      expect(screen.queryByText('Sarah Connor')).not.toBeInTheDocument()
    })

    it('invokes onBack when clicking "Back to Workspace"', () => {
      const handleBack = vi.fn()
      renderWithProviders(<AdminPanel onBack={handleBack} />)

      const backBtn = screen.getByRole('button', { name: /back to workspace/i })
      fireEvent.click(backBtn)
      expect(handleBack).toHaveBeenCalledTimes(1)
    })

    it('opens and cancels user deletion confirm dialog', async () => {
      renderWithProviders(<AdminPanel onBack={() => {}} />)

      const deleteBtns = screen.getAllByTitle(/delete user account/i)
      fireEvent.click(deleteBtns[0])

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to permanently delete/i)).toBeInTheDocument()
      })

      const cancelBtn = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelBtn)

      await waitFor(() => {
        expect(screen.queryByText(/Are you sure you want to permanently delete/i)).not.toBeInTheDocument()
      })
    })
  })
})
