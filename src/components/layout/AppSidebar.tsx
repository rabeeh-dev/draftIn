import { useState } from 'react'
import { useDraftStore } from '@/stores/draft.store'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Star,
  Clock,
  CheckCircle2,
  Trash2,
  Settings,
  Plus,
  Sparkles,
  BarChart3,
  Bookmark,
  ChevronLeft,
  X,
  Feather,
  LogIn,
  LogOut,
} from 'lucide-react'
import type { DraftFilter } from '@/types'

export function AppSidebar() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user, isAuthenticated, signOut } = useAuth()
  const {
    drafts,
    filter,
    setFilter,
    createDraft,
    isSidebarOpen,
    toggleSidebar,
    setIsSidebarOpen,
    userProfile,
  } = useDraftStore()

  const counts = {
    all: drafts.length,
    starred: drafts.filter((d) => d.isStarred).length,
    scheduled: drafts.filter((d) => d.status === 'scheduled').length,
    published: drafts.filter((d) => d.status === 'published').length,
  }

  const navItems: { label: string; icon: typeof FileText; filter: DraftFilter; count: number }[] = [
    { label: 'All Drafts', icon: FileText, filter: 'all', count: counts.all },
    { label: 'Starred', icon: Star, filter: 'starred', count: counts.starred },
    { label: 'Scheduled', icon: Clock, filter: 'scheduled', count: counts.scheduled },
    { label: 'Published', icon: CheckCircle2, filter: 'published', count: counts.published },
  ]

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-16'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex h-14 items-center justify-between px-3.5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Feather className="size-4" />
            </div>
            {isSidebarOpen && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="font-bold tracking-tight text-sm text-foreground">draftin</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                  v0.1
                </Badge>
              </div>
            )}
          </div>

          {/* Close button on mobile / Collapse button on desktop */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleSidebar}
              className="md:hidden text-muted-foreground hover:text-foreground"
              title="Close sidebar"
            >
              <X className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleSidebar}
              className="hidden md:flex text-muted-foreground hover:text-foreground"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <ChevronLeft
                className={`size-4 transition-transform duration-200 ${
                  !isSidebarOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Action: New Draft Button */}
        <div className="p-3">
          <Button
            onClick={() => createDraft()}
            className={`w-full gap-2 shadow-xs transition-all ${
              !isSidebarOpen ? 'justify-center px-0' : 'justify-start'
            }`}
            size="sm"
          >
            <Plus className="size-4 shrink-0" />
            {isSidebarOpen && <span className="font-medium text-xs">New Draft</span>}
          </Button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-2 space-y-6 py-2">
          {/* Main Filters */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <span className="px-2.5 text-[10px] font-medium tracking-wider uppercase text-muted-foreground/80">
                Library
              </span>
            )}
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = filter === item.filter
              return (
                <button
                  key={item.filter}
                  onClick={() => {
                    setFilter(item.filter)
                    // Auto-close drawer on mobile
                    if (window.innerWidth < 768) setIsSidebarOpen(false)
                  }}
                  title={!isSidebarOpen ? `${item.label} (${item.count})` : undefined}
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                  } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`size-4 shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {isSidebarOpen && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground/70'
                        }`}
                      >
                        {item.count}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tools & Resources */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <span className="px-2.5 text-[10px] font-medium tracking-wider uppercase text-muted-foreground/80">
                Tools
              </span>
            )}
            <button
              onClick={() => {}}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors ${
                !isSidebarOpen ? 'justify-center px-0' : ''
              }`}
              title={!isSidebarOpen ? 'Viral Hooks Library' : undefined}
            >
              <Sparkles className="size-4 shrink-0 text-amber-500" />
              {isSidebarOpen && (
                <>
                  <span className="flex-1 text-left truncate">Viral Hooks</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400">
                    Pro
                  </Badge>
                </>
              )}
            </button>

            <button
              onClick={() => {}}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors ${
                !isSidebarOpen ? 'Templates' : ''
              }`}
              title={!isSidebarOpen ? 'Templates' : undefined}
            >
              <Bookmark className="size-4 shrink-0" />
              {isSidebarOpen && <span className="flex-1 text-left truncate">Templates</span>}
            </button>

            <button
              onClick={() => {}}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors ${
                !isSidebarOpen ? 'Analytics' : ''
              }`}
              title={!isSidebarOpen ? 'Analytics' : undefined}
            >
              <BarChart3 className="size-4 shrink-0" />
              {isSidebarOpen && <span className="flex-1 text-left truncate">Analytics</span>}
            </button>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Bottom User Profile Section */}
        <div className="p-2 space-y-1">
          <button
            onClick={() => {}}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors ${
              !isSidebarOpen ? 'justify-center px-0' : ''
            }`}
            title="Settings"
          >
            <Settings className="size-4 shrink-0" />
            {isSidebarOpen && <span className="flex-1 text-left">Settings</span>}
          </button>

          <button
            onClick={() => {}}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors ${
              !isSidebarOpen ? 'Trash' : ''
            }`}
            title="Trash"
          >
            <Trash2 className="size-4 shrink-0" />
            {isSidebarOpen && <span className="flex-1 text-left">Trash</span>}
          </button>

          {isAuthenticated ? (
            <div
              className={`flex items-center gap-2 p-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border mt-2 ${
                !isSidebarOpen ? 'justify-center p-1.5' : ''
              }`}
            >
              <Avatar size="sm">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url || userProfile.avatarUrl}
                  alt={user?.user_metadata?.full_name || userProfile.name}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {(user?.email?.[0] || userProfile.name.slice(0, 1) || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isSidebarOpen && (
                <div className="flex-1 overflow-hidden text-left">
                  <p className="truncate text-xs font-semibold text-foreground leading-none">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                    {user?.email}
                  </p>
                </div>
              )}
              {isSidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  title="Sign out"
                >
                  <LogOut className="size-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`flex w-full items-center gap-2 p-2 rounded-xl bg-sidebar-accent/40 hover:bg-sidebar-accent border border-sidebar-border mt-2 transition-colors text-left ${
                !isSidebarOpen ? 'justify-center p-1.5' : ''
              }`}
              title="Sign in with Supabase"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <LogIn className="size-3.5" />
              </div>
              {isSidebarOpen && (
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-foreground">Sign In / Register</p>
                  <p className="truncate text-[10px] text-muted-foreground">Sync cloud drafts</p>
                </div>
              )}
            </button>
          )}
        </div>
      </aside>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}
