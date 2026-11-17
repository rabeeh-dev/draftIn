import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useDraftStore } from '@/stores/draft.store'
import { EditorHeader } from './EditorHeader'
import { EditorToolbar } from './EditorToolbar'
import { LinkedInPreview } from '@/features/preview/components/LinkedInPreview'
import { EmptyState } from '@/components/shared/EmptyState'
import { FileEdit, Plus, Sparkles, AlertCircle } from 'lucide-react'

export function Editor() {
  const { activeDraft, updateDraft, createDraft, editorLayout } = useDraftStore()

  const LINKEDIN_MAX_CHARS = 3000

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: 'text-[#0A66C2] dark:text-[#70b5f9] underline cursor-pointer font-medium',
          },
        },
      }),
      Placeholder.configure({
        placeholder: 'What do you want to talk about? Start with a punchy hook...',
      }),
      CharacterCount.configure({
        limit: LINKEDIN_MAX_CHARS,
      }),
    ],
    content: activeDraft?.content || '',
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none w-full min-h-[380px] md:min-h-[480px] text-sm md:text-base leading-relaxed text-foreground font-sans prose dark:prose-invert max-w-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      if (activeDraft) {
        // Save editor HTML content to store
        updateDraft(activeDraft.id, { content: currentEditor.getHTML() })
      }
    },
  })

  // Synchronize editor content when selected draft changes
  useEffect(() => {
    if (editor && activeDraft) {
      const currentHTML = editor.getHTML()
      if (currentHTML !== activeDraft.content) {
        editor.commands.setContent(activeDraft.content || '', { emitUpdate: false })
      }
    }
  }, [activeDraft, editor])

  // Direct metrics calculation
  const chars = editor ? editor.storage.characterCount.characters() : 0
  const words = editor ? editor.storage.characterCount.words() : 0
  const progressPercent = Math.min(100, Math.round((chars / LINKEDIN_MAX_CHARS) * 100))
  const isOverLimit = chars > LINKEDIN_MAX_CHARS

  const text = editor ? editor.getText() : ''
  const firstLine = text.split('\n')[0] || ''
  const hookLength = firstLine.trim().split(/\s+/).filter(Boolean).length
  const isGoodHook = hookLength >= 4 && hookLength <= 15

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
      {/* Top Workspace Header (Document Title & Layout Switchers) */}
      <EditorHeader />

      {/* Formatting & Hooks Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Typing Canvas */}
        {editorLayout !== 'preview-only' && (
          <div
            className={`flex flex-col h-full overflow-hidden border-r border-border/80 transition-all ${
              editorLayout === 'split' ? 'w-full lg:w-1/2' : 'w-full'
            }`}
          >
            {/* Scrollable Document Canvas */}
            <div
              className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center cursor-text"
              onClick={() => editor?.commands.focus()}
            >
              <div className="w-full max-w-2xl flex flex-col gap-3">
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Bottom Status Bar: Character Count, Word Count & Hook Analyzer */}
            <div className="h-10 px-4 border-t border-border/70 bg-card/40 flex items-center justify-between text-xs text-muted-foreground shrink-0 gap-3">
              {/* Hook Health & Advice */}
              <div className="flex items-center gap-2 overflow-hidden truncate">
                {chars > 0 ? (
                  isGoodHook ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium truncate">
                      <Sparkles className="size-3 shrink-0" />
                      <span>Hook length looks optimal ({firstLine.slice(0, 30)}...)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-medium truncate">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>Tip: Keep your opening hook punchy (under 15 words)</span>
                    </div>
                  )
                ) : (
                  <span className="text-[11px]">Ready to write</span>
                )}
              </div>

              {/* Character & Word Metrics */}
              <div className="flex items-center gap-3 shrink-0 font-medium text-[11px]">
                <span>{words} words</span>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <span className={isOverLimit ? 'text-destructive font-bold' : ''}>
                    {chars} / {LINKEDIN_MAX_CHARS}
                  </span>
                  <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isOverLimit
                          ? 'bg-destructive'
                          : progressPercent > 80
                          ? 'bg-amber-500'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${progressPercent}%` }}
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
