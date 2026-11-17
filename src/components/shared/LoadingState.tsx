export function DraftListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 p-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-3/5 rounded bg-muted/80" />
            <div className="h-4 w-12 rounded-full bg-muted/60" />
          </div>
          <div className="h-3 w-4/5 rounded bg-muted/60" />
          <div className="h-3 w-1/2 rounded bg-muted/40" />
          <div className="flex items-center justify-between pt-1">
            <div className="h-3 w-16 rounded bg-muted/50" />
            <div className="h-3 w-14 rounded bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EditorSkeleton() {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 animate-pulse bg-background">
      <div className="h-8 w-2/5 rounded-lg bg-muted/70" />
      <div className="h-px w-full bg-border" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-muted/60" />
        <div className="h-4 w-11/12 rounded bg-muted/60" />
        <div className="h-4 w-4/5 rounded bg-muted/50" />
        <div className="h-4 w-full rounded bg-muted/60" />
        <div className="h-4 w-3/4 rounded bg-muted/40" />
      </div>
    </div>
  )
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[250px] w-full flex-col items-center justify-center p-8 text-center animate-in fade-in-50">
      <div className="relative flex size-10 items-center justify-center">
        <div className="absolute size-8 rounded-full border-2 border-primary/20" />
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{message}</p>
    </div>
  )
}
