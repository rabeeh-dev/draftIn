import type { AdminUser, AdminStats, UserRole, UserStatus, AdminAuditLog } from '../types/admin.types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const ADMIN_USERS_STORAGE_KEY = 'draftin_admin_users_v1'
const ADMIN_AUDIT_STORAGE_KEY = 'draftin_admin_audit_logs_v1'

const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-1',
    adminEmail: 'admin@draftin.io',
    targetUserId: 'usr-3',
    targetUserName: 'Marcus Vance',
    action: 'status_change',
    details: 'Account suspended for policy review',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'log-2',
    adminEmail: 'admin@draftin.io',
    targetUserId: 'usr-5',
    targetUserName: 'David Kim',
    action: 'role_change',
    details: 'Granted moderator permissions',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    id: 'log-3',
    adminEmail: 'admin@draftin.io',
    targetUserId: 'usr-1',
    targetUserName: 'Alex Morgan',
    action: 'role_change',
    details: 'Verified administrator account',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

const INITIAL_ADMIN_USERS: AdminUser[] = [
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
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
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
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'usr-3',
    name: 'Marcus Vance',
    email: 'marcus.v@growthventures.co',
    headline: 'Growth Marketer • Content Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    status: 'suspended',
    draftsCount: 3,
    publishedCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    lastActiveAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'usr-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@designops.dev',
    headline: 'Product Designer • UX Advocate',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    status: 'active',
    draftsCount: 22,
    publishedCount: 16,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'usr-5',
    name: 'David Kim',
    email: 'david.kim@cloudinfra.net',
    headline: 'Staff SRE • Tech Creator',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'moderator',
    status: 'active',
    draftsCount: 7,
    publishedCount: 4,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
]

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
    return INITIAL_ADMIN_USERS
  },

  saveUsers(users: AdminUser[]): void {
    try {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users))
    } catch {
      // Ignore quota errors
    }
  },

  updateUserRole(userId: string, newRole: UserRole, adminEmail = 'admin@draftin.io'): AdminUser[] {
    const current = this.getUsers()
    const targetUser = current.find((u) => u.id === userId)
    const updated = current.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    this.saveUsers(updated)

    this.logAction({
      adminEmail,
      targetUserId: userId,
      targetUserName: targetUser?.name || userId,
      action: 'role_change',
      details: `Updated role from ${targetUser?.role || 'unknown'} to ${newRole}`,
    })

    return updated
  },

  updateUserStatus(userId: string, newStatus: UserStatus, adminEmail = 'admin@draftin.io'): AdminUser[] {
    const current = this.getUsers()
    const targetUser = current.find((u) => u.id === userId)
    const updated = current.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    this.saveUsers(updated)

    this.logAction({
      adminEmail,
      targetUserId: userId,
      targetUserName: targetUser?.name || userId,
      action: 'status_change',
      details: `Updated account status from ${targetUser?.status || 'unknown'} to ${newStatus}`,
    })

    return updated
  },

  deleteUser(userId: string, adminEmail = 'admin@draftin.io'): AdminUser[] {
    const current = this.getUsers()
    const targetUser = current.find((u) => u.id === userId)
    const updated = current.filter((u) => u.id !== userId)
    this.saveUsers(updated)

    this.logAction({
      adminEmail,
      targetUserId: userId,
      targetUserName: targetUser?.name || userId,
      action: 'user_delete',
      details: `Permanently removed account ${targetUser?.email || userId}`,
    })

    return updated
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
    return INITIAL_AUDIT_LOGS
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
