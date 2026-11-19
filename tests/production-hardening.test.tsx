import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { User, Session } from '@supabase/supabase-js'
import { AuthContext } from '@/features/auth/context/AuthContext'
import type { AuthContextType } from '@/features/auth/types/auth.types'
import { RouterProvider, AuthGuard, AdminGuard } from '@/app/router'
import { validateRedirectUrl, sanitizePlainText } from '@/lib/security'
import { mapRowToDraft, mapDraftToRow, draftService } from '@/features/drafts/services/draft.service'
import { entitlementsService } from '@/features/billing/services/entitlements.service'
import { checkSystemHealth } from '@/lib/health'
import { logger } from '@/lib/logger'
import { adminAuthService } from '@/features/admin/services/admin-auth.service'
import { adminService, isDummyUser } from '@/features/admin/services/admin.service'
import type { AdminUser } from '@/features/admin/types/admin.types'
import { AdminLoginPage } from '@/features/admin/components/AdminLoginPage'
import { LinkedInPreview } from '@/features/preview/components/LinkedInPreview'
import { DraftStoreProvider } from '@/stores/draft.store'
import type { Database } from '@/types/database.types'

type DraftRow = Database['public']['Tables']['drafts']['Row']

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

describe('Phase 08-14: Production Hardening, Security & Reliability', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  describe('Security Hardening: Suspended Account Guarding', () => {
    it('blocks suspended users from accessing protected workspace in AuthGuard', () => {
      render(
        <AuthContext.Provider
          value={createMockAuth({
            user: { id: 'usr-suspended', email: 'suspended@example.com' } as User,
            session: { access_token: 'fake-token' } as Session,
            isAuthenticated: true,
            status: 'suspended',
            isSuspended: true,
          })}
        >
          <RouterProvider>
            <AuthGuard>
              <div>Secret User Workspace</div>
            </AuthGuard>
          </RouterProvider>
        </AuthContext.Provider>
      )

      expect(screen.queryByText('Secret User Workspace')).not.toBeInTheDocument()
      expect(screen.getByText(/Account Suspended/i)).toBeInTheDocument()
      expect(screen.getByText(/suspended@example.com/i)).toBeInTheDocument()
      expect(screen.getByText(/Sign Out/i)).toBeInTheDocument()
    })

    it('blocks suspended administrators from accessing AdminGuard', () => {
      render(
        <AuthContext.Provider
          value={createMockAuth({
            user: { id: 'usr-admin-suspended', email: 'admin-bad@example.com' } as User,
            session: { access_token: 'fake-token' } as Session,
            isAuthenticated: true,
            isAdmin: true,
            role: 'admin',
            status: 'suspended',
            isSuspended: true,
          })}
        >
          <RouterProvider>
            <AdminGuard>
              <div>Admin Console</div>
            </AdminGuard>
          </RouterProvider>
        </AuthContext.Provider>
      )

      expect(screen.queryByText('Admin Console')).not.toBeInTheDocument()
      expect(screen.getByText(/Account Suspended/i)).toBeInTheDocument()
    })
  })

  describe('Security Hardening: Open Redirect & Input Sanitization', () => {
    it('validates and preserves legitimate relative redirect destinations', () => {
      expect(validateRedirectUrl('/app/editor')).toBe('/app/editor')
      expect(validateRedirectUrl('/admin/users')).toBe('/admin/users')
      expect(validateRedirectUrl('/app/settings?tab=general')).toBe('/app/settings?tab=general')
    })

    it('rejects protocol-relative and open redirect attempts', () => {
      expect(validateRedirectUrl('//evil.com')).toBe('/app')
      expect(validateRedirectUrl('/\\evil.com')).toBe('/app')
      expect(validateRedirectUrl('https://evil.com')).toBe('/app')
      expect(validateRedirectUrl('http://evil.com/app')).toBe('/app')
      expect(validateRedirectUrl('javascript:alert(1)')).toBe('/app')
      expect(validateRedirectUrl('/app@evil.com')).toBe('/app')
      expect(validateRedirectUrl('/random-external-path')).toBe('/app')
      expect(validateRedirectUrl(null)).toBe('/app')
    })

    it('sanitizes script tags from input strings', () => {
      const malicious = 'Hello <script>alert("hack")</script> World'
      expect(sanitizePlainText(malicious)).toBe('Hello  World')
    })
  })

  describe('Database Reliability: Draft Model & Versioning', () => {
    it('maps database rows with version and jsonb content correctly', () => {
      const row: DraftRow = {
        id: 'draft-v1',
        user_id: 'usr-1',
        title: 'Enterprise Draft',
        content: '<p>Prose content</p>',
        content_json: { type: 'doc', content: [{ type: 'paragraph' }] },
        version: 3,
        deleted_at: null,
        last_saved_at: '2026-11-19T10:00:00Z',
        status: 'draft',
        is_starred: true,
        tags: ['Engineering'],
        scheduled_for: null,
        created_at: '2026-11-19T09:00:00Z',
        updated_at: '2026-11-19T10:00:00Z',
      }

      const draft = mapRowToDraft(row)
      expect(draft.id).toBe('draft-v1')
      expect(draft.version).toBe(3)
      expect(draft.contentJson).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
      expect(draft.lastSavedAt).toBe('2026-11-19T10:00:00Z')
      expect(draft.deletedAt).toBeNull()
    })

    it('maps frontend draft to row with version increment capability', () => {
      const row = mapDraftToRow(
        {
          id: 'draft-1',
          title: 'My Title',
          content: 'Hello World',
          contentJson: { type: 'doc' },
          version: 2,
          status: 'draft',
          isStarred: false,
          tags: ['Tech'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        'usr-123'
      )

      expect(row.user_id).toBe('usr-123')
      expect(row.version).toBe(2)
      expect(row.content_json).toEqual({ type: 'doc' })
      expect(row.last_saved_at).toBeDefined()
    })

    it('increments draft version upon updating in draftService', async () => {
      draftService.saveLocalDrafts(
        [
          {
            id: 'draft-v-test',
            title: 'Initial Title',
            content: 'Initial text',
            version: 1,
            status: 'draft',
            isStarred: false,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        'usr-v'
      )

      await draftService.updateDraft('draft-v-test', { title: 'Updated Title' }, 'usr-v')
      const updatedList = draftService.getLocalDrafts('usr-v')
      const updated = updatedList.find((d) => d.id === 'draft-v-test')

      expect(updated?.title).toBe('Updated Title')
      expect(updated?.version).toBe(2)
      expect(updated?.lastSavedAt).toBeDefined()
    })
  })

  describe('Observability & Operational Health', () => {
    it('executes system health check and returns structured operational status', async () => {
      const health = await checkSystemHealth()
      expect(health).toBeDefined()
      expect(health.timestamp).toBeDefined()
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status)
      expect(health.checks.storage).toBe('available')
    })

    it('logger executes without throwing when given redacted contexts', () => {
      expect(() => {
        logger.info('User action event', {
          userId: 'usr-123',
          token: 'secret-bearer-token',
          action: 'editor_save',
        })
      }).not.toThrow()
    })
  })

  describe('SaaS Monetization & Plan Entitlements', () => {
    it('enforces Free Plan draft limits of 25', () => {
      expect(entitlementsService.canCreateDraft(10, 'free')).toBe(true)
      expect(entitlementsService.canCreateDraft(25, 'free')).toBe(false)
      expect(entitlementsService.canCreateDraft(50, 'pro')).toBe(true)
    })

    it('gates advanced tools on Free Plan and enables them on Pro Plan', () => {
      expect(entitlementsService.hasFeatureAccess('viralHooks', 'free')).toBe(false)
      expect(entitlementsService.hasFeatureAccess('templates', 'free')).toBe(false)
      expect(entitlementsService.hasFeatureAccess('analytics', 'free')).toBe(false)

      expect(entitlementsService.hasFeatureAccess('viralHooks', 'pro')).toBe(true)
      expect(entitlementsService.hasFeatureAccess('templates', 'pro')).toBe(true)
      expect(entitlementsService.hasFeatureAccess('analytics', 'pro')).toBe(true)
    })
  })

  describe('Dedicated Admin Authentication (Username & Password)', () => {
    it('rejects invalid administrator credentials', () => {
      const result = adminAuthService.login('wrong-admin', 'wrong-pass')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid administrator credentials')
      expect(adminAuthService.isAuthenticated()).toBe(false)
    })

    it('authenticates successfully with valid admin username and password', () => {
      const result = adminAuthService.login('admin', 'draftin@admin2026')
      expect(result.success).toBe(true)
      expect(adminAuthService.isAuthenticated()).toBe(true)
      expect(adminAuthService.getAdminUsername()).toBe('admin')

      // Terminate session
      adminAuthService.logout()
      expect(adminAuthService.isAuthenticated()).toBe(false)
    })

    it('authenticates successfully with case-insensitive admin username and password "123"', () => {
      const result = adminAuthService.login('Admin', '123')
      expect(result.success).toBe(true)
      expect(adminAuthService.isAuthenticated()).toBe(true)

      adminAuthService.logout()
      expect(adminAuthService.isAuthenticated()).toBe(false)
    })

    it('triggers onSuccess callback in AdminLoginPage upon valid login', () => {
      const handleSuccess = vi.fn()
      render(
        <RouterProvider>
          <AdminLoginPage onSuccess={handleSuccess} />
        </RouterProvider>
      )

      const userInput = screen.getByPlaceholderText(/e\.g\. admin/i)
      const passInput = screen.getByPlaceholderText(/enter administrator password/i)
      const submitBtn = screen.getByRole('button', { name: /sign in as administrator/i })

      fireEvent.change(userInput, { target: { value: 'admin' } })
      fireEvent.change(passInput, { target: { value: '123' } })
      fireEvent.click(submitBtn)

      expect(handleSuccess).toHaveBeenCalledTimes(1)
      adminAuthService.logout()
    })

    it('renders dedicated AdminLoginPage with username and password inputs', () => {
      render(
        <RouterProvider>
          <AdminLoginPage />
        </RouterProvider>
      )

      expect(screen.getByRole('heading', { name: /admin console/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e\.g\. admin/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter administrator password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in as administrator/i })).toBeInTheDocument()
      expect(screen.getByText(/return to writer workspace/i)).toBeInTheDocument()
    })

    it('guarantees adminService.getUsers() returns seed creators even when storage is empty', () => {
      localStorage.removeItem('draftin_admin_users_v1')
      const users = adminService.getUsers()
      expect(Array.isArray(users)).toBe(true)
      expect(users.length).toBeGreaterThanOrEqual(4)
      expect(users.some((u) => u.name === 'Alex Morgan')).toBe(true)
      expect(users.some((u) => u.name === 'Sarah Connor')).toBe(true)
    })

    it('adminService dynamically incorporates logged-in Google creator into user management list', () => {
      localStorage.setItem('draftin_last_user_id', 'usr-google-999')
      localStorage.setItem('draftin_last_name', 'Sundar Pichai')
      localStorage.setItem('draftin_last_email', 'sundar@google.com')

      const users = adminService.getUsers()
      const found = users.find((u) => u.id === 'usr-google-999' || u.email === 'sundar@google.com')
      expect(found).toBeDefined()
      expect(found?.name).toBe('Sundar Pichai')
    })

    it('isDummyUser correctly identifies dummy accounts to keep production clean of mock users', () => {
      expect(isDummyUser({ id: 'usr-1', email: 'alex.morgan@draftin.io' } as AdminUser)).toBe(true)
      expect(isDummyUser({ id: 'usr-2', email: 'sarah.connor@ai-scale.com' } as AdminUser)).toBe(true)
      expect(isDummyUser({ id: 'usr-3', email: 'marcus.vance@growthpulse.co' } as AdminUser)).toBe(true)
      expect(isDummyUser({ id: 'usr-4', email: 'elena.rostova@fintech-weekly.org' } as AdminUser)).toBe(true)
      expect(isDummyUser({ id: 'real-user-123', email: 'creator@gmail.com' } as AdminUser)).toBe(false)
    })
  })

  describe('Instant Zero-Latency LinkedIn Preview Avatar Rendering', () => {
    it('renders the user avatar image with no-referrer policy and synchronous fast cache', () => {
      localStorage.setItem('draftin_last_avatar_url', 'https://lh3.googleusercontent.com/a/test-avatar-123')
      localStorage.setItem('draftin_last_name', 'Sarah Connor')

      render(
        <AuthContext.Provider
          value={createMockAuth({
            user: {
              id: 'usr-sarah-1',
              email: 'sarah@example.com',
              user_metadata: {
                full_name: 'Sarah Connor',
                avatar_url: 'https://lh3.googleusercontent.com/a/test-avatar-123',
              },
            } as unknown as User,
            isAuthenticated: true,
          })}
        >
          <DraftStoreProvider>
            <LinkedInPreview />
          </DraftStoreProvider>
        </AuthContext.Provider>
      )

      expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
      const avatarImg = screen.getByAltText('Sarah Connor')
      expect(avatarImg).toBeInTheDocument()
      expect(avatarImg).toHaveAttribute('src', 'https://lh3.googleusercontent.com/a/test-avatar-123')
      expect(avatarImg).toHaveAttribute('referrerpolicy', 'no-referrer')
      expect(avatarImg).toHaveAttribute('crossorigin', 'anonymous')
      expect(avatarImg).toHaveAttribute('loading', 'eager')
    })
  })
})
