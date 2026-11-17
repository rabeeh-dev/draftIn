import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDraftStore } from '@/stores/draft.store'
import { convertToLinkedInPublishingText, isContentEmpty } from '../utils/publishingText'
import { copyTextToClipboard } from '../utils/clipboard'
import { Check, Copy, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react'

export const LINKEDIN_COMPOSE_URL = 'https://www.linkedin.com/feed/?shareActive=true'

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const { activeDraft, updateDraft } = useDraftStore()
  const [copied, setCopied] = useState(false)
  const [hasOpenedLinkedIn, setHasOpenedLinkedIn] = useState(false)

  const content = activeDraft?.content || ''
  const isEmpty = isContentEmpty(content)
  const publishingText = convertToLinkedInPublishingText(content)

  // Auto-copy text on dialog open if not empty
  useEffect(() => {
    if (open && !isEmpty && publishingText) {
      copyTextToClipboard(publishingText).then((ok) => {
        if (ok) setCopied(true)
      })
    } else {
      setCopied(false)
      setHasOpenedLinkedIn(false)
    }
  }, [open, isEmpty, publishingText])

  const handleManualCopy = async () => {
    if (isEmpty || !publishingText) return
    const success = await copyTextToClipboard(publishingText)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleOpenLinkedIn = () => {
    if (typeof window !== 'undefined') {
      window.open(LINKEDIN_COMPOSE_URL, '_blank', 'noopener,noreferrer')
      setHasOpenedLinkedIn(true)
    }
  }

  const handleMarkPublished = () => {
    if (activeDraft) {
      updateDraft(activeDraft.id, { status: 'published' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <div className="flex items-center gap-3 pb-1">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#0A66C2] text-white shadow-xs">
            <span className="font-bold text-base">in</span>
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Publish to LinkedIn</DialogTitle>
            <DialogDescription className="text-xs">
              Complete your post handoff in 2 quick steps.
            </DialogDescription>
          </div>
        </div>

        {/* Content Snippet / Summary */}
        <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span className="truncate max-w-[240px] font-semibold text-foreground">
              {activeDraft?.title || 'Untitled Draft'}
            </span>
            <span>{publishingText.length} characters</span>
          </div>
          <p className="line-clamp-2 text-muted-foreground text-[11px] italic">
            {publishingText || 'Draft is empty.'}
          </p>
        </div>

        {/* Step-by-Step Flow */}
        <div className="space-y-2.5 py-1">
          {/* Step 1: Copy Post */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {copied ? <Check className="size-3.5" /> : '1'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground">Copy Post Text</span>
                <span className="text-[11px] text-muted-foreground">
                  {copied ? 'Copied to clipboard with Unicode styles!' : 'Formatted text ready to copy'}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant={copied ? 'outline' : 'secondary'}
              size="xs"
              onClick={handleManualCopy}
              disabled={isEmpty}
              className={`gap-1 text-xs h-7.5 ${
                copied ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10' : ''
              }`}
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          {/* Step 2: Open LinkedIn */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                  hasOpenedLinkedIn
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#0A66C2] text-white'
                }`}
              >
                {hasOpenedLinkedIn ? <Check className="size-3.5" /> : '2'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground">Open LinkedIn Feed</span>
                <span className="text-[11px] text-muted-foreground">
                  Paste into the composer and hit Post!
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="xs"
              onClick={handleOpenLinkedIn}
              disabled={isEmpty}
              className="gap-1 text-xs h-7.5 bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white"
            >
              <span>Open LinkedIn</span>
              <ExternalLink className="size-3" />
            </Button>
          </div>
        </div>

        {/* Tip / Footer Actions */}
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px]">
          <Sparkles className="size-3.5 shrink-0 text-amber-500" />
          <span>Tip: Press Ctrl+V (or Cmd+V) inside LinkedIn to paste your formatted post.</span>
        </div>

        <div className="flex sm:justify-between items-center gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleMarkPublished}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Mark as Published</span>
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
