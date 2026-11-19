import { useState, useMemo, useEffect } from 'react'
import { adminService } from '../services/admin.service'
import type { AdminUser, UserRole, UserStatus, AdminAuditLog } from '../types/admin.types'
import { useRouter } from '@/app/router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ShieldCheck,
  Users,
  Search,
  ArrowLeft,
  Trash2,
  Ban,
  CheckCircle2,
  FileText,
  UserCheck,
  UserX,
  SlidersHorizontal,
  History,
  Key,
  Database,
} from 'lucide-react'

interface AdminPanelProps {
  onBack?: () => void
  path?: string
}

export function AdminPanel({ onBack, path: propPath }: AdminPanelProps) {
  const { path: routerPath, navigate } = useRouter()
  const currentPath = propPath || routerPath || '/admin'

  const activeTab: 'users' | 'activity' | 'settings' = useMemo(() => {
    if (currentPath.startsWith('/admin/activity')) return 'activity'
    if (currentPath.startsWith('/admin/settings')) return 'settings'
    return 'users'
  }, [currentPath])

  const [users, setUsers] = useState<AdminUser[]>(() => adminService.getUsers())
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => adminService.getAuditLogs())
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')

  // Modals state
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // Resolve deep-linked user if URL contains /admin/users/:id
  const inspectedUser = useMemo(() => {
    if (selectedUser) return selectedUser
    if (currentPath.startsWith('/admin/users/')) {
      const targetId = currentPath.split('/admin/users/')[1]
      if (targetId) {
        return users.find((u) => u.id === targetId) || null
      }
    }
    return null
  }, [selectedUser, currentPath, users])

  const stats = useMemo(() => adminService.computeStats(users), [users])

  const filteredUsers = useMemo(() => {
    let list = [...users]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.headline.toLowerCase().includes(q)
      )
    }

    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      list = list.filter((u) => u.status === statusFilter)
    }

    return list
  }, [users, searchQuery, roleFilter, statusFilter])

  const { user: currentAdmin } = useAuth()
  const adminEmail = currentAdmin?.email || 'admin@draftin.io'

  useEffect(() => {
    let isMounted = true
    if (isSupabaseConfigured) {
      adminService.fetchUsersFromSupabase().then((loaded) => {
        if (isMounted) setUsers(loaded)
      })
      adminService.fetchAuditLogsFromSupabase().then((loadedLogs) => {
        if (isMounted) setAuditLogs(loadedLogs)
      })
    }
    return () => {
      isMounted = false
    }
  }, [])

  const handleToggleStatus = (user: AdminUser) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active'
    const updated = adminService.updateUserStatus(user.id, nextStatus, adminEmail)
    setUsers(updated)
    setAuditLogs(adminService.getAuditLogs())
    if (selectedUser?.id === user.id) {
      setSelectedUser({ ...selectedUser, status: nextStatus })
    }
  }

  const handleToggleRole = (user: AdminUser) => {
    const nextRole: UserRole = user.role === 'admin' ? 'user' : 'admin'
    const updated = adminService.updateUserRole(user.id, nextRole, adminEmail)
    setUsers(updated)
    setAuditLogs(adminService.getAuditLogs())
    if (selectedUser?.id === user.id) {
      setSelectedUser({ ...selectedUser, role: nextRole })
    }
  }

  const handleConfirmDelete = () => {
    if (!userToDelete) return
    const updated = adminService.deleteUser(userToDelete.id, adminEmail)
    setUsers(updated)
    setAuditLogs(adminService.getAuditLogs())
    if (selectedUser?.id === userToDelete.id) {
      setSelectedUser(null)
    }
    setUserToDelete(null)
  }

  const handleTabChange = (tab: 'users' | 'activity' | 'settings') => {
    if (tab === 'users') navigate('/admin/users')
    else if (tab === 'activity') navigate('/admin/activity')
    else if (tab === 'settings') navigate('/admin/settings')
  }

  const handleBackToWorkspace = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/app')
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
      {/* Top Admin Header */}
      <header className="h-16 w-full border-b border-border/80 px-4 md:px-8 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-20 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base tracking-tight">draftin Admin Console</h1>
            <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary bg-primary/5">
              Superadmin Mode
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80 text-xs">
          <button
            type="button"
            onClick={() => handleTabChange('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="size-3.5" />
            <span>Users</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="size-3.5" />
            <span>Activity Log</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>System Settings</span>
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToWorkspace}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Workspace</span>
        </Button>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {activeTab === 'activity' ? (
          /* Admin Activity / Audit Log View */
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold tracking-tight">Administrative Activity & Audit Log</h2>
              <p className="text-xs text-muted-foreground">
                Immutable event stream of administrative moderation actions, role modifications, and status changes.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold text-[11px]">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Admin</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target User</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <History className="size-8 text-muted-foreground/50" />
                            <p className="font-semibold text-xs text-foreground">No administrative activity recorded yet</p>
                            <p className="text-[11px]">Audit events will appear when creator roles or account statuses are modified.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                          {log.adminEmail || 'admin@draftin.io'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant={
                              log.action === 'user_delete'
                                ? 'destructive'
                                : log.action === 'role_change'
                                  ? 'outline'
                                  : 'secondary'
                            }
                            className="text-[10px] capitalize"
                          >
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold">
                          {log.targetUserName || log.targetUserId || 'System'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          /* Admin System Settings View */
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold tracking-tight">System & Security Configuration</h2>
              <p className="text-xs text-muted-foreground">
                Manage backend database policies, OAuth authentication providers, and application security parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supabase Connection */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Database className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Supabase Database & RLS</h3>
                    <p className="text-[11px] text-muted-foreground">Row Level Security policy enforcement</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/80">
                    <span className="text-muted-foreground">Connection Status</span>
                    <Badge variant={isSupabaseConfigured ? 'outline' : 'secondary'} className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      {isSupabaseConfigured ? 'Connected' : 'Local Fallback'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/80">
                    <span className="text-muted-foreground">Drafts RLS Policy</span>
                    <span className="font-mono text-[11px] text-foreground">auth.uid() = user_id</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/80">
                    <span className="text-muted-foreground">Admin RLS Policy</span>
                    <span className="font-mono text-[11px] text-foreground">profiles.role = 'admin'</span>
                  </div>
                </div>
              </div>

              {/* OAuth Provider */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Key className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Google OAuth Single Sign-On</h3>
                    <p className="text-[11px] text-muted-foreground">Authentication provider configuration</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/80">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-semibold text-foreground">Google (Supabase Auth)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/80">
                    <span className="text-muted-foreground">Callback URL</span>
                    <span className="font-mono text-[11px] text-foreground">/auth/callback</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/80">
                    <span className="text-muted-foreground">Session Lifecycle</span>
                    <span className="font-semibold text-foreground">Reactive onAuthStateChange</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-4">
          {/* Total Users */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Total Creators</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stats.totalUsers}</p>
            <p className="text-[11px] text-muted-foreground">{stats.totalAdmins} with admin privileges</p>
          </div>

          {/* Active Users */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Active Accounts</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stats.activeUsers}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">In good standing</p>
          </div>

          {/* Suspended Accounts */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Suspended</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Ban className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stats.suspendedUsers}</p>
            <p className="text-[11px] text-muted-foreground">Restricted from publishing</p>
          </div>

          {/* Total Drafts */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Total Drafts</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]">
                <FileText className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stats.totalDrafts}</p>
            <p className="text-[11px] text-muted-foreground">Created across all accounts</p>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-2xl shadow-2xs">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or headline..."
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Role Filter */}
            <div className="flex items-center rounded-lg bg-muted/60 p-1 border border-border/80 text-xs">
              {(['all', 'admin', 'user', 'moderator'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center rounded-lg bg-muted/60 p-1 border border-border/80 text-xs">
              {(['all', 'active', 'suspended'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                    statusFilter === s
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Management Table */}
        <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Drafts</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="size-8 text-muted-foreground/50" />
                        <p className="font-semibold text-xs text-foreground">
                          {users.length === 0 ? 'No creators found' : 'No users match your filters'}
                        </p>
                        <p className="text-[11px]">
                          {users.length === 0
                            ? 'Registered users will appear here once they authenticate with Google.'
                            : 'Try adjusting your search query or reset status filters.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuspended = u.status === 'suspended'
                    const isAdmin = u.role === 'admin'

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-muted/20 transition-colors ${
                          isSuspended ? 'bg-destructive/5' : ''
                        }`}
                      >
                        {/* User Identity Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar size="default" className="size-10 ring-1 ring-border shrink-0">
                              <AvatarImage src={u.avatarUrl} alt={u.name} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {(u.name || 'CR').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden max-w-[220px]">
                              <button
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                className="font-bold text-xs text-foreground hover:text-primary hover:underline text-left truncate cursor-pointer"
                              >
                                {u.name}
                              </button>
                              <span className="text-[11px] text-muted-foreground truncate">{u.email}</span>
                              <span className="text-[10px] text-muted-foreground/80 line-clamp-1 italic mt-0.5">
                                {u.headline}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isAdmin ? (
                            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-bold text-[10px] gap-1">
                              <ShieldCheck className="size-3" />
                              <span>Admin</span>
                            </Badge>
                          ) : u.role === 'moderator' ? (
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-[10px] gap-1">
                              <SlidersHorizontal className="size-3" />
                              <span>Mod</span>
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="font-medium text-[10px]">
                              Creator
                            </Badge>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                              <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
                              <span>Suspended</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* Draft Count */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-foreground">{u.draftsCount} total</span>
                            <span className="text-[10px] text-muted-foreground">{u.publishedCount} published</span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-muted-foreground text-[11px] whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Moderation Actions Column */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Role Button */}
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() => handleToggleRole(u)}
                              title={isAdmin ? 'Demote to regular Creator' : 'Promote to Admin'}
                              className={isAdmin ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                            >
                              {isAdmin ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                            </Button>

                            {/* Suspend / Unsuspend Button */}
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() => handleToggleStatus(u)}
                              title={isSuspended ? 'Reactivate account' : 'Suspend account'}
                              className={
                                isSuspended
                                  ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                  : 'text-muted-foreground hover:text-destructive'
                              }
                            >
                              {isSuspended ? <CheckCircle2 className="size-3.5" /> : <Ban className="size-3.5" />}
                            </Button>

                            {/* Delete User Button */}
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() => setUserToDelete(u)}
                              title="Delete user account"
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}
  </main>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null)
        }}
        title={`Delete User: ${userToDelete?.name || ''}`}
        description={`Are you sure you want to permanently delete ${userToDelete?.email}? This action removes their profile, access permissions, and cloud drafts.`}
        confirmLabel="Delete User"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />

      {/* Detailed User Inspection Dialog */}
      {inspectedUser && (
        <Dialog open={Boolean(inspectedUser)} onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null)
            if (currentPath.startsWith('/admin/users/')) {
              navigate('/admin/users')
            }
          }
        }}>
          <DialogPopup className="max-w-lg">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Avatar size="lg" className="size-12 ring-2 ring-primary/20">
                <AvatarImage src={inspectedUser.avatarUrl} alt={inspectedUser.name} />
                <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                  {(inspectedUser.name || 'CR').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <DialogTitle className="text-base font-bold truncate">{inspectedUser.name}</DialogTitle>
                <DialogDescription className="text-xs truncate">{inspectedUser.email}</DialogDescription>
              </div>
              <Badge variant={inspectedUser.status === 'active' ? 'outline' : 'destructive'} className="text-[10px]">
                {inspectedUser.status}
              </Badge>
            </div>

            <div className="space-y-4 py-3 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground text-[11px]">Headline & Bio</span>
                <p className="p-2.5 rounded-lg border border-border bg-muted/30 text-foreground leading-relaxed">
                  {inspectedUser.headline}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-card">
                <div>
                  <span className="text-[10px] text-muted-foreground font-medium">Account Role</span>
                  <p className="font-bold capitalize text-foreground mt-0.5">{inspectedUser.role}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-medium">Total Drafts</span>
                  <p className="font-bold text-foreground mt-0.5">{inspectedUser.draftsCount} posts</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-medium">Joined Date</span>
                  <p className="font-bold text-foreground mt-0.5">
                    {new Date(inspectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-medium">Last Active</span>
                  <p className="font-bold text-foreground mt-0.5">
                    {new Date(inspectedUser.lastActiveAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleRole(inspectedUser)}
                  className="text-xs"
                >
                  {inspectedUser.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                </Button>

                <Button
                  variant={inspectedUser.status === 'active' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => handleToggleStatus(inspectedUser)}
                  className="text-xs"
                >
                  {inspectedUser.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                </Button>
              </div>
            </div>
          </DialogPopup>
        </Dialog>
      )}
    </div>
  )
}
