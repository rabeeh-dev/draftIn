import { useState } from 'react'
import { useDraftStore } from '@/stores/draft.store'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { convertToLinkedInPublishingText, isContentEmpty } from '@/features/preview/utils/publishingText'
import { copyTextToClipboard } from '@/features/preview/utils/clipboard'
import { Button } from '@/components/ui/button'
import {
  Menu,
  PanelLeft,
  Copy,
  Check,
  Calendar,
  Columns,
  Square,
  Eye,
  Share2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react'

export function EditorHeader() {
  const { isAuthenticated } = useAuth()
  const {
    activeDraft,
    updateDraft,
    saveStatus,
    syncError,
    retrySync,
    toggleSidebar,
    toggleDraftList,
    isDraftListOpen,
    editorLayout,
    setEditorLayout,
  } = useDraftStore()

  const [copied, setCopied] = useState(false)

  if (!activeDraft) return null

  const isEmpty = isContentEmpty(activeDraft.content)

  const handleCopy = async () => {
    if (isEmpty) return
    const publishingText = convertToLinkedInPublishingText(activeDraft.content)
    if (!publishingText) return
    const success = await copyTextToClipboard(publishingText)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleScheduleToggle = () => {
    const nextStatus = activeDraft.status === 'scheduled' ? 'draft' : 'scheduled'
    updateDraft(activeDraft.id, {
      status: nextStatus,
      scheduledFor: nextStatus === 'scheduled' ? 'Tomorrow at 9:00 AM' : undefined,
    })
  }

  const handlePublishToggle = () => {
    const nextStatus = activeDraft.status === 'published' ? 'draft' : 'published'
    updateDraft(activeDraft.id, { status: nextStatus })
  }

  return (
    <header className="flex h-14 items-center justify-between px-3 md:px-5 border-b border-border bg-card/60 backdrop-blur-xs gap-3">
      {/* Left Area: Mobile toggles + Title input */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleSidebar}
          className="md:hidden text-muted-foreground hover:text-foreground"
          title="Toggle Navigation"
        >
          <Menu className="size-4" />
        </Button>

        {/* Toggle draft list button (especially on smaller/tablet screens) */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleDraftList}
          className="text-muted-foreground hover:text-foreground"
          title={isDraftListOpen ? 'Hide drafts list' : 'Show drafts list'}
        >
          <PanelLeft className="size-4" />
        </Button>

        {/* Editable Title Input */}
        <input
          type="text"
          value={activeDraft.title}
          onChange={(e) => updateDraft(activeDraft.id, { title: e.target.value })}
          placeholder="Untitled Post"
          className="bg-transparent text-sm md:text-base font-bold tracking-tight text-foreground outline-none border-b border-transparent hover:border-border/60 focus:border-primary px-1 py-0.5 rounded transition-all truncate max-w-xs md:max-w-md"
        />

        {/* Dynamic Save Status Indicator */}
        <div className="flex items-center ml-1 shrink-0">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              <Loader2 className="size-3 animate-spin text-blue-500" />
              <span className="hidden sm:inline">Saving changes...</span>
              <span className="sm:hidden">Saving...</span>
            </div>
          )}
          {saveStatus === 'unsaved' && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden sm:inline">Unsaved changes</span>
              <span className="sm:hidden">Unsaved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-[11px] text-destructive font-medium">
              <AlertCircle className="size-3 text-destructive shrink-0" />
              <span className="hidden sm:inline">Save failed</span>
              <button
                type="button"
                onClick={() => retrySync()}
                className="underline hover:text-destructive/80 font-semibold cursor-pointer text-[11px]"
                title={syncError || 'Click to retry syncing'}
              >
                Retry
              </button>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span className="hidden sm:inline">
                {isAuthenticated ? 'Saved to cloud' : 'Saved locally'}
              </span>
              <span className="sm:hidden">Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Layout View Switcher & Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Layout Switcher (Desktop only) */}
        <div className="hidden lg:flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/80">
          <button
            onClick={() => setEditorLayout('editor-only')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              editorLayout === 'editor-only'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Editor Focus (Full Width)"
          >
            <Square className="size-3.5" />
          </button>
          <button
            onClick={() => setEditorLayout('split')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              editorLayout === 'split'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Split View (Editor + Live Preview)"
          >
            <Columns className="size-3.5" />
          </button>
          <button
            onClick={() => setEditorLayout('preview-only')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              editorLayout === 'preview-only'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Preview Focus"
          >
            <Eye className="size-3.5" />
          </button>
        </div>

        {/* Copy Post Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={isEmpty}
          className="gap-1.5 text-xs h-8 disabled:opacity-50"
          title={isEmpty ? 'Draft is empty. Write your post before copying.' : 'Copy formatted post to clipboard'}
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="hidden sm:inline text-emerald-500 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </Button>

        {/* Schedule / Status Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleScheduleToggle}
          disabled={isEmpty}
          className={`gap-1.5 text-xs h-8 disabled:opacity-50 ${
            activeDraft.status === 'scheduled'
              ? 'border-amber-500/40 text-amber-600 bg-amber-500/10'
              : ''
          }`}
          title={isEmpty ? 'Draft is empty. Add content to schedule.' : 'Schedule post'}
        >
          <Calendar className="size-3.5" />
          <span className="hidden sm:inline">
            {activeDraft.status === 'scheduled' ? 'Scheduled' : 'Schedule'}
          </span>
        </Button>

        {/* Primary Action: Publish / Share */}
        <Button
          size="sm"
          onClick={handlePublishToggle}
          disabled={isEmpty}
          className="gap-1.5 text-xs h-8 shadow-xs disabled:opacity-50"
          title={isEmpty ? 'Draft is empty. Add content to publish.' : 'Publish post'}
        >
          <Share2 className="size-3.5" />
          <span>{activeDraft.status === 'published' ? 'Published' : 'Publish'}</span>
        </Button>
      </div>
    </header>
  )
}
