import { useMemo } from 'react'
import { useDraftStore } from '@/stores/draft.store'
import { EditorHeader } from './EditorHeader'
import { EditorToolbar } from './EditorToolbar'
import { LinkedInPreview } from '@/features/preview/components/LinkedInPreview'
import { EmptyState } from '@/components/shared/EmptyState'
import { FileEdit, Plus, Sparkles, AlertCircle } from 'lucide-react'

export function Editor() {
  const { activeDraft, updateDraft, createDraft, editorLayout } = useDraftStore()

  const LINKEDIN_MAX_CHARS = 3000

  const content = activeDraft?.content || ''

  const stats = useMemo(() => {
    const chars = content.length
    const trimmed = content.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    const lines = content.split('\n').length
    const readingTimeSeconds = Math.max(5, Math.ceil((words / 200) * 60))
    const progressPercent = Math.min(100, Math.round((chars / LINKEDIN_MAX_CHARS) * 100))
    const isOverLimit = chars > LINKEDIN_MAX_CHARS

    // Hook health check (line 1 before first empty line)
    const firstLine = content.split('\n')[0] || ''
    const hookLength = firstLine.trim().split(/\s+/).filter(Boolean).length
    const isGoodHook = hookLength >= 4 && hookLength <= 15

    return {
      chars,
      words,
      lines,
      readingTimeSeconds,
      progressPercent,
      isOverLimit,
      isGoodHook,
      firstLine,
    }
  }, [content])

  if (!activeDraft) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background p-6">
        <EmptyState
          icon={FileEdit}
          title="No draft selected"
          description="Choose a draft from the sidebar or start fresh with a new post."
          actionLabel="Create New Draft"
          actionIcon={<Plus className="size-4" />}
          onAction={() => createDraft()}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden flex-1">
      {/* Top Workspace Header */}
      <EditorHeader />

      {/* Formatting & Hooks Toolbar */}
      <EditorToolbar />

      {/* Main Workspace Body: Split, Editor-Only, or Preview-Only */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Typing Area */}
        {editorLayout !== 'preview-only' && (
          <div
            className={`flex flex-col h-full overflow-hidden border-r border-border/80 transition-all ${
              editorLayout === 'split' ? 'w-full lg:w-1/2' : 'w-full'
            }`}
          >
            {/* Scrollable Text Input */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
              <div className="w-full max-w-2xl flex flex-col gap-3">
                <textarea
                  value={activeDraft.content}
                  onChange={(e) => updateDraft(activeDraft.id, { content: e.target.value })}
                  placeholder="What do you want to talk about? Start with a punchy hook..."
                  className="w-full min-h-[380px] md:min-h-[480px] bg-transparent resize-none text-sm md:text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none font-sans"
                  autoFocus
                />
              </div>
            </div>

            {/* Bottom Status Bar: Metrics & LinkedIn Progress */}
            <div className="h-10 px-4 border-t border-border/70 bg-card/40 flex items-center justify-between text-xs text-muted-foreground shrink-0 gap-3">
              {/* Hook Health & Advice */}
              <div className="flex items-center gap-2 overflow-hidden truncate">
                {stats.chars > 0 ? (
                  stats.isGoodHook ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium truncate">
                      <Sparkles className="size-3 shrink-0" />
                      <span>Hook length looks optimal ({stats.firstLine.slice(0, 30)}...)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-medium truncate">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>Tip: Keep your opening hook punchy (under 15 words)</span>
                    </div>
                  )
                ) : (
                  <span className="text-[11px]">Draft ready</span>
                )}
              </div>

              {/* Character Count & Progress Indicator */}
              <div className="flex items-center gap-3 shrink-0 font-medium text-[11px]">
                <span>{stats.words} words</span>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span className={stats.isOverLimit ? 'text-destructive font-bold' : ''}>
                    {stats.chars} / {LINKEDIN_MAX_CHARS}
                  </span>
                  <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        stats.isOverLimit
                          ? 'bg-destructive'
                          : stats.progressPercent > 80
                          ? 'bg-amber-500'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${stats.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live LinkedIn Preview Area */}
        {editorLayout !== 'editor-only' && (
          <div
            className={`h-full overflow-hidden transition-all ${
              editorLayout === 'split' ? 'hidden lg:flex lg:w-1/2' : 'flex w-full'
            }`}
          >
            <LinkedInPreview />
          </div>
        )}
      </div>
    </div>
  )
}
