import type { AdminUser, AdminStats, UserRole, UserStatus } from '../types/admin.types'

const ADMIN_USERS_STORAGE_KEY = 'draftin_admin_users_v1'

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

  updateUserRole(userId: string, newRole: UserRole): AdminUser[] {
    const current = this.getUsers()
    const updated = current.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    this.saveUsers(updated)
    return updated
  },

  updateUserStatus(userId: string, newStatus: UserStatus): AdminUser[] {
    const current = this.getUsers()
    const updated = current.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    this.saveUsers(updated)
    return updated
  },

  deleteUser(userId: string): AdminUser[] {
    const current = this.getUsers()
    const updated = current.filter((u) => u.id !== userId)
    this.saveUsers(updated)
    return updated
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
