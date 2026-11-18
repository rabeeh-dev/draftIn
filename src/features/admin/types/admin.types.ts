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
