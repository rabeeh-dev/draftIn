import type {
  AdminUser,
  AdminStats,
  UserRole,
  UserStatus,
  AdminAuditLog,
  AdminAuditAction,
} from '../types/admin.types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const ADMIN_USERS_STORAGE_KEY = 'draftin_admin_users_v1'
const ADMIN_AUDIT_STORAGE_KEY = 'draftin_admin_audit_logs_v1'

export const DEFAULT_PLATFORM_USERS: AdminUser[] = [
  {
    id: 'usr-1',
    name: 'Alex Morgan',
    email: 'alex.morgan@draftin.io',
    headline: 'Lead Product Architect • Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    status: 'active',
    draftsCount: 14,
    publishedCount: 8,
    createdAt: '2026-01-15T10:00:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    name: 'Sarah Connor',
    email: 'sarah.connor@ai-scale.com',
    headline: 'VP of Engineering • Technical Writer',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    status: 'active',
    draftsCount: 9,
    publishedCount: 5,
    createdAt: '2026-02-01T14:30:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'usr-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@growthpulse.co',
    headline: 'B2B Growth Strategist • LinkedIn Top Voice',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    status: 'active',
    draftsCount: 22,
    publishedCount: 17,
    createdAt: '2026-02-18T09:15:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'usr-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@fintech-weekly.org',
    headline: 'Fintech Columnist & Content Strategist',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    status: 'suspended',
    draftsCount: 6,
    publishedCount: 1,
    createdAt: '2026-03-02T11:45:00.000Z',
    lastActiveAt: new Date().toISOString(),
  },
]

export const adminService = {
  getRegisteredGoogleUser(): AdminUser | null {
    if (typeof localStorage === 'undefined') return null
    try {
      const id = localStorage.getItem('draftin_last_user_id')
      const name = localStorage.getItem('draftin_last_name')
      const email = localStorage.getItem('draftin_last_email')
      const avatarUrl = localStorage.getItem('draftin_last_avatar_url') || ''
      const headline = localStorage.getItem('draftin_last_headline') || 'LinkedIn Creator & Writer'

      if (id && (name || email)) {
        return {
          id,
          name: name || email?.split('@')[0] || 'Current Creator',
          email: email || '',
          headline,
          avatarUrl,
          role: 'user',
          status: 'active',
          draftsCount: 1,
          publishedCount: 0,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        }
      }
    } catch {
      // Storage unavailable
    }
    return null
  },

  getUsers(): AdminUser[] {
    try {
      const stored = localStorage.getItem(ADMIN_USERS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const googleUser = this.getRegisteredGoogleUser()
          if (
            googleUser &&
            !parsed.some(
              (u: AdminUser) =>
                u.id === googleUser.id || (googleUser.email && u.email === googleUser.email)
            )
          ) {
            const merged = [googleUser, ...parsed]
            this.saveUsers(merged)
            return merged
          }
          return parsed
        }
      }
    } catch {
      // Storage unavailable or corrupted
    }

    const initial = [...DEFAULT_PLATFORM_USERS]
    const googleUser = this.getRegisteredGoogleUser()
    if (
      googleUser &&
      !initial.some(
        (u) => u.id === googleUser.id || (googleUser.email && u.email === googleUser.email)
      )
    ) {
      initial.unshift(googleUser)
    }
    this.saveUsers(initial)
    return initial
  },

  saveUsers(users: AdminUser[]): void {
    try {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('draftin:admin-users-changed'))
      }
    } catch {
      // Ignore quota errors
    }
  },

  updateUserRole(userId: string, newRole: UserRole, adminEmail = 'admin@draftin.io', adminId?: string): AdminUser[] {
    const current = this.getUsers()
    const targetUser = current.find((u) => u.id === userId)
    const updated = current.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    this.saveUsers(updated)

    this.logAction({
      adminId,
      adminEmail,
      targetUserId: userId,
      targetUserName: targetUser?.name || userId,
      action: 'role_change',
      details: `Updated role from ${targetUser?.role || 'unknown'} to ${newRole}`,
    })

    if (isSupabaseConfigured) {
      supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .then(
          () => {},
          () => {}
        )
    }

    return updated
  },

  updateUserStatus(userId: string, newStatus: UserStatus, adminEmail = 'admin@draftin.io', adminId?: string): AdminUser[] {
    const current = this.getUsers()
    const targetUser = current.find((u) => u.id === userId)
    const updated = current.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    this.saveUsers(updated)

    this.logAction({
      adminId,
      adminEmail,
      targetUserId: userId,
      targetUserName: targetUser?.name || userId,
      action: 'status_change',
      details: `Updated account status from ${targetUser?.status || 'unknown'} to ${newStatus}`,
    })

    if (isSupabaseConfigured) {
      supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .then(
          () => {},
          () => {}
        )
    }

    return updated
  },

  deleteUser(userId: string, adminEmail = 'admin@draftin.io', adminId?: string): AdminUser[] {
    const current = this.getUsers()
    const targetUser = current.find((u) => u.id === userId)
    const updated = current.filter((u) => u.id !== userId)
    this.saveUsers(updated)

    this.logAction({
      adminId,
      adminEmail,
      targetUserId: userId,
      targetUserName: targetUser?.name || userId,
      action: 'user_delete',
      details: `Permanently removed account ${targetUser?.email || userId}`,
    })

    if (isSupabaseConfigured) {
      supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .then(
          () => {},
          () => {}
        )
    }

    return updated
  },

  async fetchUsersFromSupabase(): Promise<AdminUser[]> {
    if (!isSupabaseConfigured) {
      return this.getUsers()
    }

    try {
      // 1. Fetch real profiles from Supabase
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // Never wipe local users if query errors or returns empty list (e.g. Supabase RLS restriction)
      if (profilesError || !profiles || profiles.length === 0) {
        return this.getUsers()
      }

      // 2. Fetch drafts to calculate draft metrics per creator
      const draftsByUser: Record<string, { total: number; published: number }> = {}
      try {
        const { data: drafts } = await supabase
          .from('drafts')
          .select('id, user_id, status')

        if (drafts) {
          for (const d of drafts) {
            if (!draftsByUser[d.user_id]) {
              draftsByUser[d.user_id] = { total: 0, published: 0 }
            }
            draftsByUser[d.user_id].total += 1
            if (d.status === 'published') {
              draftsByUser[d.user_id].published += 1
            }
          }
        }
      } catch {
        // Fallback to local counts
      }

      // 3. Map database profiles to AdminUser records
      const dbUsers: AdminUser[] = profiles.map((p) => {
        const stats = draftsByUser[p.id] || { total: 0, published: 0 }
        return {
          id: p.id,
          name: p.name || 'Creator',
          email: p.email || '',
          headline: p.headline || 'LinkedIn Creator & Writer',
          avatarUrl: p.avatar_url || '',
          role: (p.role as UserRole) || 'user',
          status: (p.status as UserStatus) || 'active',
          draftsCount: stats.total,
          publishedCount: stats.published,
          createdAt: p.created_at || new Date().toISOString(),
          lastActiveAt: p.updated_at || p.created_at || new Date().toISOString(),
        }
      })

      // Merge database profiles with existing users
      const existing = this.getUsers()
      const mergedMap = new Map<string, AdminUser>()
      existing.forEach((u) => mergedMap.set(u.id, u))
      dbUsers.forEach((u) => {
        const prev = mergedMap.get(u.id)
        mergedMap.set(u.id, {
          ...u,
          role: u.role || prev?.role || 'user',
          status: u.status || prev?.status || 'active',
        })
      })

      const combined = Array.from(mergedMap.values())
      this.saveUsers(combined)
      return combined
    } catch (err) {
      console.warn('Error fetching admin users from Supabase (using local):', err)
      return this.getUsers()
    }
  },

  async fetchAuditLogsFromSupabase(): Promise<AdminAuditLog[]> {
    if (!isSupabaseConfigured) {
      return this.getAuditLogs()
    }

    try {
      const { data: logs, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error || !logs || logs.length === 0) {
        return this.getAuditLogs()
      }

      const auditLogs: AdminAuditLog[] = logs.map((l) => ({
        id: l.id,
        adminEmail: l.admin_email || 'admin@draftin.io',
        targetUserId: l.target_user_id || undefined,
        targetUserName: l.target_user_name || undefined,
        action: (l.action as AdminAuditAction) || 'system_setting',
        details: l.details || '',
        createdAt: l.created_at,
      }))

      this.saveAuditLogs(auditLogs)
      return auditLogs
    } catch (err) {
      console.warn('Error fetching audit logs from Supabase (using local):', err)
      return this.getAuditLogs()
    }
  },

  getAuditLogs(): AdminAuditLog[] {
    try {
      const stored = localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // Storage unavailable or corrupted
    }
    return []
  },

  saveAuditLogs(logs: AdminAuditLog[]): void {
    try {
      localStorage.setItem(ADMIN_AUDIT_STORAGE_KEY, JSON.stringify(logs))
    } catch {
      // Ignore storage errors
    }
  },

  logAction(entry: Omit<AdminAuditLog, 'id' | 'createdAt'>): AdminAuditLog {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    }

    const current = this.getAuditLogs()
    const updated = [newLog, ...current].slice(0, 100)
    this.saveAuditLogs(updated)

    if (isSupabaseConfigured) {
      supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: newLog.adminId || null,
          admin_email: newLog.adminEmail || null,
          target_user_id: newLog.targetUserId || null,
          target_user_name: newLog.targetUserName || null,
          action: newLog.action,
          details: newLog.details,
        })
        .then(
          () => {},
          () => {}
        )
    }

    return newLog
  },

  computeStats(users: AdminUser[]): AdminStats {
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      suspendedUsers: users.filter((u) => u.status === 'suspended').length,
      totalDrafts: users.reduce((acc, u) => acc + u.draftsCount, 0),
      totalAdmins: users.filter((u) => u.role === 'admin').length,
    }
  },
}
