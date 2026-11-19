export type UserRole = 'admin' | 'user' | 'moderator'
export type UserStatus = 'active' | 'suspended' | 'pending'

export interface AdminUser {
  id: string
  name: string
  email: string
  headline: string
  avatarUrl?: string
  role: UserRole
  status: UserStatus
  draftsCount: number
  publishedCount: number
  createdAt: string
  lastActiveAt: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  totalDrafts: number
  totalAdmins: number
}

export type AdminAuditAction = 'role_change' | 'status_change' | 'user_delete' | 'system_setting'

export interface AdminAuditLog {
  id: string
  adminId?: string
  adminEmail?: string
  targetUserId?: string
  targetUserName?: string
  action: AdminAuditAction
  details: string
  createdAt: string
}
