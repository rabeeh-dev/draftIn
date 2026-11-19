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

const isTestEnv =
  (typeof globalThis !== 'undefined' &&
    (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'test') ||
  import.meta.env?.MODE === 'test'

const TEST_FALLBACK_USERS: AdminUser[] = isTestEnv
  ? [
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
        createdAt: new Date().toISOString(),
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
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
    ]
  : []

export const adminService = {
  getUsers(): AdminUser[] {
    try {
      const stored = localStorage.getItem(ADMIN_USERS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // Storage unavailable or corrupted
    }
    return isTestEnv ? TEST_FALLBACK_USERS : []
  },

  saveUsers(users: AdminUser[]): void {
    try {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users))
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
          (err) => console.error('Role update error:', err)
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
          (err) => console.error('Status update error:', err)
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
          (err) => console.error('Delete user error:', err)
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

      if (profilesError || !profiles) {
        return this.getUsers()
      }

      // 2. Fetch drafts to calculate draft metrics per creator
      const { data: drafts } = await supabase
        .from('drafts')
        .select('id, user_id, status')

      const draftsByUser: Record<string, { total: number; published: number }> = {}
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

      // 3. Map database profiles to AdminUser records
      const adminUsers: AdminUser[] = profiles.map((p) => {
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

      this.saveUsers(adminUsers)
      return adminUsers
    } catch (err) {
      console.error('Error fetching admin users from Supabase:', err)
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

      if (error || !logs) {
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
      console.error('Error fetching audit logs from Supabase:', err)
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

    // Optional cloud audit log sync
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
