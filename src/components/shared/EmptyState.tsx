import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { FileEdit, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: ReactNode
}

export function EmptyState({
  icon: Icon = FileEdit,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center p-8 text-center animate-in fade-in-50">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/80 shadow-xs mb-4">
        <Icon className="size-7" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm" className="gap-1.5 shadow-sm">
            {actionIcon}
            <span>{actionLabel}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
