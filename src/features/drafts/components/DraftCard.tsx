import { useState } from 'react'
import type { Draft } from '@/types'
import { useDraftStore } from '@/stores/draft.store'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Star, MoreVertical, Copy, Trash2, Clock, CheckCircle2 } from 'lucide-react'

interface DraftCardProps {
  draft: Draft
  isSelected: boolean
  onSelect: () => void
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function stripHtmlToPlainText(content?: string | null): string {
  if (!content) return ''
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function DraftCard({ draft, isSelected, onSelect }: DraftCardProps) {
  const { toggleStar, deleteDraft, duplicateDraft } = useDraftStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const plainText = stripHtmlToPlainText(draft.content)
  const charCount = plainText.length
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0

  const statusConfig = {
    draft: {
      label: 'Draft',
      variant: 'secondary' as const,
      icon: null,
      className: 'text-muted-foreground bg-muted',
    },
    scheduled: {
      label: 'Scheduled',
      variant: 'default' as const,
      icon: Clock,
      className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    },
    published: {
      label: 'Published',
      variant: 'outline' as const,
      icon: CheckCircle2,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    },
  }[draft.status]

  const StatusIcon = statusConfig.icon

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect()
        }}
        className={`group relative flex flex-col gap-1.5 rounded-xl p-2.5 transition-all text-left outline-none cursor-pointer border ${
          isSelected
            ? 'bg-card border-primary/40 shadow-xs ring-1 ring-primary/20'
            : 'bg-card/50 border-border/70 hover:bg-card hover:border-border hover:shadow-2xs'
        }`}
      >
        {/* Card Header: Title + Star + Actions */}
        <div className="flex items-start justify-between gap-1.5">
          <h4
            className={`text-xs font-semibold leading-tight truncate flex-1 ${
              isSelected ? 'text-foreground' : 'text-foreground/90'
            }`}
          >
            {draft.title || 'Untitled Draft'}
          </h4>

          <div className="flex items-center gap-0.5 shrink-0 -mr-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => toggleStar(draft.id)}
              className="p-1 rounded-md text-muted-foreground/60 hover:text-amber-500 transition-colors"
              title={draft.isStarred ? 'Unstar draft' : 'Star draft'}
            >
              <Star
                className={`size-3.5 ${
                  draft.isStarred ? 'fill-amber-500 text-amber-500' : ''
                }`}
              />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors outline-none"
                title="Draft actions"
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => duplicateDraft(draft.id)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tags */}
        {draft.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {draft.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: Compact status badge & timestamp / stats */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
          <Badge
            variant={statusConfig.variant}
            className={`text-[9px] h-4 px-1.5 font-medium gap-1 ${statusConfig.className}`}
          >
            {StatusIcon && <StatusIcon className="size-2.5" />}
            {statusConfig.label}
          </Badge>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
            <span>•</span>
            <span>{formatRelativeTime(draft.updatedAt)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Draft"
        description={`Are you sure you want to delete "${draft.title || 'Untitled Draft'}"? This action cannot be undone.`}
        confirmLabel="Delete Draft"
        variant="destructive"
        onConfirm={() => deleteDraft(draft.id)}
      />
    </>
  )
}
