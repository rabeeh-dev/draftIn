import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthGuard, AdminGuard, RouterProvider } from '@/app/router'
import { AuthContext } from '@/features/auth/context/AuthContext'
import { AuthCallback } from '@/features/auth/components/AuthCallback'
import { draftService } from '@/features/drafts/services/draft.service'
import { adminService } from '@/features/admin/services/admin.service'
import type { Draft } from '@/types'
import type { User, Session } from '@supabase/supabase-js'
import type { AuthContextType } from '@/features/auth/types/auth.types'

function createMockAuth(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: null,
    session: null,
    role: 'user',
    status: 'active',
    isSuspended: false,
    isAdmin: false,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  }
}

describe('Authentication-First Architecture & Route Separation', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  describe('AuthGuard Component', () => {
    it('shows loading indicator when session is loading', () => {
      render(
        <AuthContext.Provider value={createMockAuth({ isLoading: true })}>
          <RouterProvider>
            <AuthGuard>
              <div>Protected Workspace Content</div>
            </AuthGuard>
          </RouterProvider>
        </AuthContext.Provider>
      )

      expect(screen.getByText(/Checking authentication session/i)).toBeInTheDocument()
      expect(screen.queryByText('Protected Workspace Content')).not.toBeInTheDocument()
    })

    it('redirects unauthenticated users to /login and saves returnUrl', async () => {
      window.history.pushState({}, '', '/app/editor')

      render(
        <AuthContext.Provider value={createMockAuth({ isAuthenticated: false })}>
          <RouterProvider>
            <AuthGuard>
              <div>Protected Workspace Content</div>
            </AuthGuard>
          </RouterProvider>
        </AuthContext.Provider>
      )

      expect(screen.queryByText('Protected Workspace Content')).not.toBeInTheDocument()
      await waitFor(() => {
        expect(sessionStorage.getItem('draftin_return_url')).toBe('/app/editor')
      })
    })

    it('renders protected children when authenticated', () => {
      render(
        <AuthContext.Provider
          value={createMockAuth({
            user: { id: 'usr-123', email: 'creator@draftin.io' } as User,
            session: { access_token: 'xyz' } as Session,
            role: 'user',
            isAdmin: false,
            isAuthenticated: true,
          })}
        >
          <RouterProvider>
            <AuthGuard>
              <div>Protected Workspace Content</div>
            </AuthGuard>
          </RouterProvider>
        </AuthContext.Provider>
      )

      expect(screen.getByText('Protected Workspace Content')).toBeInTheDocument()
    })
  })

  describe('AdminGuard Component', () => {
    it('blocks regular users from accessing admin routes and shows restricted state', () => {
      render(
        <AuthContext.Provider
          value={createMockAuth({
            user: { id: 'usr-regular', email: 'regular@example.com' } as User,
            session: { access_token: 'xyz' } as Session,
            role: 'user',
            isAdmin: false,
            isAuthenticated: true,
          })}
        >
          <RouterProvider>
            <AdminGuard>
              <div>Secret Admin Dashboard</div>
            </AdminGuard>
          </RouterProvider>
        </AuthContext.Provider>
      )

      expect(screen.queryByText('Secret Admin Dashboard')).not.toBeInTheDocument()
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument()
      expect(screen.getByText(/regular@example.com/i)).toBeInTheDocument()
      expect(screen.getByText(/Return to User Workspace/i)).toBeInTheDocument()
    })

    it('allows verified administrators to access admin routes', () => {
      render(
        <AuthContext.Provider
          value={createMockAuth({
            user: { id: 'usr-admin', email: 'admin@draftin.io' } as User,
            session: { access_token: 'admin-token' } as Session,
            role: 'admin',
            isAdmin: true,
            isAuthenticated: true,
          })}
        >
          <RouterProvider>
            <AdminGuard>
              <div>Secret Admin Dashboard</div>
            </AdminGuard>
          </RouterProvider>
        </AuthContext.Provider>
      )

      expect(screen.getByText('Secret Admin Dashboard')).toBeInTheDocument()
    })
  })

  describe('User-Specific Local Storage Isolation', () => {
    it('isolates cached drafts strictly by user ID', () => {
      const userADrafts: Draft[] = [
        {
          id: 'draft-a1',
          title: 'User A Secret Strategy',
          content: 'Confidential post content',
          status: 'draft',
          isStarred: true,
          tags: ['strategy'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      const userBDrafts: Draft[] = [
        {
          id: 'draft-b1',
          title: 'User B Marketing Hooks',
          content: 'Public hook ideas',
          status: 'draft',
          isStarred: false,
          tags: ['growth'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      // Save user A drafts
      draftService.saveLocalDrafts(userADrafts, 'user-a-id')
      // Save user B drafts
      draftService.saveLocalDrafts(userBDrafts, 'user-b-id')

      // Verify separate storage keys were created
      expect(localStorage.getItem('draftin_drafts_user-a-id')).not.toBeNull()
      expect(localStorage.getItem('draftin_drafts_user-b-id')).not.toBeNull()

      // Verify retrieval returns strictly isolated data
      const retrievedA = draftService.getLocalDrafts('user-a-id')
      const retrievedB = draftService.getLocalDrafts('user-b-id')

      expect(retrievedA.length).toBe(1)
      expect(retrievedA[0].title).toBe('User A Secret Strategy')

      expect(retrievedB.length).toBe(1)
      expect(retrievedB[0].title).toBe('User B Marketing Hooks')

      // Clear User A's cache without affecting User B
      draftService.clearUserDrafts('user-a-id')
      expect(draftService.getLocalDrafts('user-a-id').length).toBe(0)
      expect(draftService.getLocalDrafts('user-b-id').length).toBe(1)
    })
  })

  describe('Admin Audit Logging', () => {
    it('records audit events on role modifications', () => {
      const users = adminService.getUsers()
      const target = users[0]

      adminService.updateUserRole(target.id, 'admin', 'auditor@draftin.io')

      const logs = adminService.getAuditLogs()
      const roleLog = logs.find((l) => l.action === 'role_change' && l.targetUserId === target.id)

      expect(roleLog).toBeDefined()
      expect(roleLog?.adminEmail).toBe('auditor@draftin.io')
      expect(roleLog?.details).toContain('Updated role')
    })

    it('records audit events on account suspension and deletion', () => {
      const users = adminService.getUsers()
      const target = users[1]

      adminService.updateUserStatus(target.id, 'suspended', 'auditor@draftin.io')
      adminService.deleteUser(target.id, 'auditor@draftin.io')

      const logs = adminService.getAuditLogs()
      const statusLog = logs.find((l) => l.action === 'status_change' && l.targetUserId === target.id)
      const deleteLog = logs.find((l) => l.action === 'user_delete' && l.targetUserId === target.id)

      expect(statusLog).toBeDefined()
      expect(statusLog?.details).toContain('suspended')

      expect(deleteLog).toBeDefined()
      expect(deleteLog?.details).toContain('Permanently removed account')
    })
  })

  describe('OAuth Callback Component', () => {
    it('renders error state and retry button if OAuth provider reports an error', () => {
      window.history.pushState(
        {},
        '',
        '/auth/callback?error=access_denied&error_description=User%20cancelled%20Google%20sign%20in'
      )

      render(
        <AuthContext.Provider value={createMockAuth()}>
          <RouterProvider>
            <AuthCallback />
          </RouterProvider>
        </AuthContext.Provider>
      )

      expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
      expect(screen.getByText(/User cancelled Google sign in/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /return to sign in/i })).toBeInTheDocument()
    })
  })
})
