import { useState } from 'react'
import { useDraftStore } from '@/stores/draft.store'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Menu, Sparkles, Feather, Cloud, LogIn } from 'lucide-react'

export function AppHeader() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { toggleSidebar, userProfile } = useDraftStore()
  const { user, isAuthenticated } = useAuth()

  return (
    <>
      <header className="flex h-12 w-full items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="size-4" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Feather className="size-3" />
            </div>
            <span className="font-bold text-xs tracking-tight">draftin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Badge variant="outline" className="text-[10px] gap-1 font-normal border-primary/20 bg-primary/5 text-primary">
              <Cloud className="size-3 text-primary" />
              <span>{user?.email}</span>
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setAuthModalOpen(true)}
              className="text-xs h-7 gap-1.5"
            >
              <LogIn className="size-3" />
              <span>Sign In</span>
            </Button>
          )}

          <Badge variant="outline" className="text-[10px] gap-1 font-normal hidden sm:inline-flex">
            <Sparkles className="size-3 text-amber-500" />
            <span>{userProfile.name || user?.user_metadata?.full_name || 'Creator'}</span>
          </Badge>
        </div>
      </header>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}
