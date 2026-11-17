import { useState } from 'react'
import { useDraftStore } from '@/stores/draft.store'
import { PreviewHeader } from './PreviewHeader'
import { ProfileCustomizerDialog } from './ProfileCustomizerDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
} from 'lucide-react'

export function LinkedInPreview() {
  const { activeDraft, userProfile, updateUserProfile, previewDevice } = useDraftStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showProfileCustomizer, setShowProfileCustomizer] = useState(false)

  const content = activeDraft?.content || ''

  // Determine if content is HTML from Tiptap or plain text
  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  // Strip HTML for length calculations
  const plainText = isHtml
    ? content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : content

  const shouldTruncate = plainText.length > 200 || plainText.split('\n').length > 4

  // Render plain text with hashtag/link styling
  const renderFormattedPlainText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i} className="block min-h-[1.25rem]">
        {line.split(' ').map((word, wIdx) => {
          if (word.startsWith('#') && word.length > 1) {
            return (
              <span
                key={wIdx}
                className="text-[#0A66C2] dark:text-[#70b5f9] hover:underline font-medium cursor-pointer"
              >
                {word}{' '}
              </span>
            )
          }
          if (word.startsWith('http://') || word.startsWith('https://')) {
            return (
              <span
                key={wIdx}
                className="text-[#0A66C2] dark:text-[#70b5f9] hover:underline cursor-pointer"
              >
                {word}{' '}
              </span>
            )
          }
          return word + ' '
        })}
      </span>
    ))
  }

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <PreviewHeader
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((prev) => !prev)}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex items-start justify-center">
        {/* Post Card simulating LinkedIn Feed */}
        <div
          className={`w-full rounded-xl border border-border bg-card shadow-sm transition-all overflow-hidden ${
            previewDevice === 'mobile' ? 'max-w-[380px]' : 'max-w-[560px]'
          }`}
        >
          {/* Card Author Header */}
          <div className="flex items-start justify-between p-3.5 pb-2">
            <div className="flex items-start gap-2.5">
              <Avatar size="default" className="size-11 ring-1 ring-border">
                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
                <AvatarFallback>{userProfile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground hover:text-[#0A66C2] hover:underline cursor-pointer leading-tight">
                    {userProfile.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">• 1st</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                  {userProfile.headline}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <span>Now</span>
                  <span>•</span>
                  <Globe className="size-2.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground">
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

          {/* Post Content */}
          <div className="px-4 py-2 text-xs md:text-[13px] leading-relaxed text-foreground text-left break-words">
            {plainText ? (
              <div className="relative">
                <div
                  className={`transition-all ${
                    !isExpanded && shouldTruncate
                      ? 'max-h-28 overflow-hidden relative'
                      : ''
                  }`}
                >
                  {isHtml ? (
                    <div
                      className="prose prose-xs md:prose-sm dark:prose-invert max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_a]:text-[#0A66C2] dark:[&_a]:text-[#70b5f9] [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[#0A66C2] [&_blockquote]:pl-2"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  ) : (
                    <div className="space-y-1">{renderFormattedPlainText(content)}</div>
                  )}

                  {!isExpanded && shouldTruncate && (
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                  )}
                </div>

                {!isExpanded && shouldTruncate && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="text-[12px] font-semibold text-muted-foreground hover:text-[#0A66C2] hover:underline mt-1 block"
                  >
                    ...see more
                  </button>
                )}
              </div>
            ) : (
              <p className="italic text-muted-foreground/60 py-4 text-center">
                Your LinkedIn post preview will render live here as you write...
              </p>
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
      </div>

      <ProfileCustomizerDialog
        open={showProfileCustomizer}
        onOpenChange={setShowProfileCustomizer}
        profile={userProfile}
        onSave={(updated) => updateUserProfile(updated)}
      />
    </div>
  )
}
