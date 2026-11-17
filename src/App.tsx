import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="max-w-xl w-full border border-border rounded-2xl p-8 bg-card shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar size="sm">
                <AvatarFallback>DI</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">draftin</h1>
                <p className="text-xs text-muted-foreground">Vite + React 19 + Tailwind v4 + Base UI</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3 text-primary" />
              v0.1.0
            </Badge>
          </div>

          <Separator />

          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">Project Health: Operational</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your application foundation is configured with modern styling tokens, strict TypeScript
              bundler resolution, and Base UI primitives.
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>TypeScript compiler options aligned with TS 6 bundler standards</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>Tailwind v4 OKLCH design tokens active</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>Fast Refresh enabled for CVA component variants</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" size="sm" onClick={() => setCount((c) => c + 1)} />}>
                Interactions: {count}
              </TooltipTrigger>
              <TooltipContent>Click to increment counter</TooltipContent>
            </Tooltip>

            <Button size="sm" className="gap-1.5">
              <span>Start Drafting</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </main>
    </TooltipProvider>
  )
}
