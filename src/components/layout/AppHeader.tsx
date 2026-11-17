import { useDraftStore } from '@/stores/draft.store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Menu, Sparkles, Feather } from 'lucide-react'

export function AppHeader() {
  const { toggleSidebar, userProfile } = useDraftStore()

  return (
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
        <Badge variant="outline" className="text-[10px] gap-1 font-normal">
          <Sparkles className="size-3 text-amber-500" />
          <span>{userProfile.name}</span>
        </Badge>
      </div>
    </header>
  )
}
