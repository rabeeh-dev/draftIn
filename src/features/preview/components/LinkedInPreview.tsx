import { useState, useMemo } from 'react'
import { useDraftStore } from '@/stores/draft.store'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PreviewHeader } from './PreviewHeader'
import { ProfileCustomizerDialog } from './ProfileCustomizerDialog'
import { LINKEDIN_COMPOSE_URL } from './PublishDialog'
import { formatLinkedInContent } from '../utils/contentRenderer'
import { convertToLinkedInPublishingText, isContentEmpty } from '../utils/publishingText'
import { copyTextToClipboard } from '../utils/clipboard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Globe,
  MoreHorizontal,
  Plus,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  Heart,
  Smile,
  Edit3,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'

export function LinkedInPreview() {
  const { activeDraft, userProfile, updateUserProfile, previewDevice } = useDraftStore()
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showProfileCustomizer, setShowProfileCustomizer] = useState(false)
  const [copiedPublishText, setCopiedPublishText] = useState(false)
  const [showPasteNotice, setShowPasteNotice] = useState(false)

  const authorName =
    userProfile.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('draftin_last_name') || '' : '') ||
    'Creator'

  const authorAvatar =
    userProfile.avatarUrl ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('draftin_last_avatar_url') || '' : '') ||
    ''

  const authorHeadline =
    userProfile.headline ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('draftin_last_headline') || '' : '') ||
    'LinkedIn Creator & Writer'

  const authorId =
    user?.id ||
    userProfile.id ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('draftin_last_user_id') || '' : '') ||
    ''

  const authorInitials = useMemo(() => {
    if (!authorName) return 'CR'
    const parts = authorName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [authorName])

  const content = activeDraft?.content || ''
  const isEmpty = isContentEmpty(content)

  // Convert HTML or markdown to native LinkedIn Unicode publishing text
  const publishingText = useMemo(() => {
    return convertToLinkedInPublishingText(content)
  }, [content])

  // Determine if post exceeds fold threshold (~220 chars or > 4 lines)
  const shouldTruncate = useMemo(() => {
    return publishingText.length > 220 || publishingText.split('\n').length > 4
  }, [publishingText])

  const handleCopyPublishText = async () => {
    if (isEmpty || !publishingText) return
    const success = await copyTextToClipboard(publishingText)
    if (success) {
      setCopiedPublishText(true)
      setShowPasteNotice(true)
      setTimeout(() => setCopiedPublishText(false), 2000)
    }
  }

  const handleOpenLinkedIn = () => {
    if (typeof window === 'undefined') return
    if (!isEmpty && publishingText) {
      copyTextToClipboard(publishingText).catch(() => {})
      setCopiedPublishText(true)
      setShowPasteNotice(true)
      setTimeout(() => setCopiedPublishText(false), 4000)
    }
    window.open(LINKEDIN_COMPOSE_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <PreviewHeader
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((prev) => !prev)}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-start gap-4">
        {/* Post Card simulating LinkedIn Feed */}
        <div
          className={`w-full rounded-xl border border-border bg-card shadow-sm transition-all overflow-hidden ${
            previewDevice === 'mobile' ? 'max-w-[380px]' : 'max-w-[560px]'
          }`}
        >
          {/* Card Author Header */}
          <div className="flex items-start justify-between p-3.5 pb-2">
            <div className="flex items-start gap-2.5">
              <Avatar size="default" className="size-11 ring-1 ring-border shrink-0">
                <AvatarImage
                  src={authorAvatar}
                  alt={authorName}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  keepMounted
                  loading="eager"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col text-left overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground hover:text-[#0A66C2] hover:underline cursor-pointer leading-tight truncate">
                    {authorName}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">• 1st</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                  {authorHeadline}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  {authorId ? (
                    <>
                      <span
                        className="font-mono text-[9px] text-muted-foreground/80 hover:text-foreground transition-colors"
                        title={`User ID: ${authorId}`}
                      >
                        id: {authorId.length > 10 ? `${authorId.slice(0, 8)}...` : authorId}
                      </span>
                      <span>•</span>
                    </>
                  ) : null}
                  <span>Now</span>
                  <span>•</span>
                  <span>Edited</span>
                  <span>•</span>
                  <Globe className="size-2.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileCustomizer(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-md transition-colors"
                title="Edit author profile"
              >
                <Edit3 className="size-3.5" />
              </button>
              <button
                type="button"
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/10 px-2 py-1 rounded-md transition-colors"
                title="Follow"
              >
                <Plus className="size-3" />
                <span>Follow</span>
              </button>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          {/* Post Content with Line-Break & Fold Truncation */}
          <div className="px-4 py-2 text-left">
            {isEmpty ? (
              <div className="py-7 px-4 text-center border-2 border-dashed border-border/70 rounded-xl my-2 bg-muted/20">
                <p className="text-xs font-semibold text-foreground">Draft is empty</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Type in the editor to see your LinkedIn live preview.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div
                  className={`transition-all duration-200 ${
                    !isExpanded && shouldTruncate
                      ? 'max-h-28 overflow-hidden relative'
                      : ''
                  }`}
                >
                  {formatLinkedInContent(content)}

                  {!isExpanded && shouldTruncate && (
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
                  )}
                </div>

                {shouldTruncate && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="text-[12px] font-semibold text-muted-foreground hover:text-[#0A66C2] hover:underline mt-1.5 block cursor-pointer transition-colors"
                  >
                    {isExpanded ? 'see less' : '...see more'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Engagement Counters */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1 items-center">
                <span className="flex size-4 items-center justify-center rounded-full bg-[#0A66C2] text-white">
                  <ThumbsUp className="size-2.5 fill-white" />
                </span>
                <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-white">
                  <Heart className="size-2.5 fill-white" />
                </span>
                <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-white">
                  <Smile className="size-2.5 fill-white" />
                </span>
              </div>
              <span className="hover:underline cursor-pointer hover:text-[#0A66C2]">42</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="hover:underline cursor-pointer">8 comments</span>
              <span>•</span>
              <span className="hover:underline cursor-pointer">3 reposts</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-4 border-t border-border px-1 py-1 bg-card">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground text-xs font-semibold transition-colors"
            >
              <ThumbsUp className="size-3.5" />
              <span className="hidden sm:inline text-[11px]">Like</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground text-xs font-semibold transition-colors"
            >
              <MessageSquare className="size-3.5" />
              <span className="hidden sm:inline text-[11px]">Comment</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground text-xs font-semibold transition-colors"
            >
              <Repeat2 className="size-3.5" />
              <span className="hidden sm:inline text-[11px]">Repost</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground text-xs font-semibold transition-colors"
            >
              <Send className="size-3.5" />
              <span className="hidden sm:inline text-[11px]">Send</span>
            </button>
          </div>
        </div>

        {/* Copy for LinkedIn Quick Bar */}
        <div
          className={`w-full max-w-[560px] flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border gap-2 transition-all text-xs ${
            copiedPublishText
              ? 'border-emerald-500/50 bg-emerald-500/10'
              : 'border-border bg-card/60 backdrop-blur-xs'
          }`}
        >
          <div className="flex flex-col">
            <span
              className={`font-semibold ${
                copiedPublishText
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-foreground'
              }`}
            >
              {copiedPublishText ? 'Copied to Clipboard!' : 'Publishing-Ready Text'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {copiedPublishText
                ? 'Ready to paste into LinkedIn feed (Ctrl+V / Cmd+V)'
                : isEmpty
                ? 'Draft is empty'
                : `${publishingText.length} characters • Formatted with Unicode Bold & Italic`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={handleCopyPublishText}
              disabled={isEmpty}
              className={`gap-1.5 transition-all text-white disabled:opacity-50 ${
                copiedPublishText
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#0A66C2] hover:bg-[#0A66C2]/90'
              }`}
              title={isEmpty ? 'Draft is empty. Add content before copying.' : 'Copy for LinkedIn'}
            >
              {copiedPublishText ? (
                <>
                  <Check className="size-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy for LinkedIn</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenLinkedIn}
              disabled={isEmpty}
              className="gap-1.5 text-xs text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/10"
              title={isEmpty ? 'Draft is empty' : 'Open LinkedIn composer in new tab'}
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Open LinkedIn</span>
            </Button>
          </div>
        </div>
      </div>

      <ProfileCustomizerDialog
        key={showProfileCustomizer ? `${authorName}-${authorHeadline}-${authorAvatar}` : 'closed'}
        open={showProfileCustomizer}
        onOpenChange={setShowProfileCustomizer}
        profile={{
          ...userProfile,
          name: authorName,
          headline: authorHeadline,
          avatarUrl: authorAvatar,
          id: authorId,
        }}
        onSave={(updated) => updateUserProfile(updated)}
      />

      {/* Floating paste helper popup for LinkedIn web handoff */}
      {showPasteNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-emerald-500/40 bg-card/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Check className="size-4" />
            </div>
            <div className="flex-1 space-y-1 text-left">
              <p className="text-xs font-bold text-foreground">Post Copied to Clipboard!</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                LinkedIn's security policy requires users to paste posts manually. Your formatted post is copied — click the post box in LinkedIn and press{' '}
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                  Ctrl+V
                </kbd>{' '}
                (or{' '}
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                  ⌘V
                </kbd>
                ) to paste it!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasteNotice(false)}
              className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-md"
              title="Close notice"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
