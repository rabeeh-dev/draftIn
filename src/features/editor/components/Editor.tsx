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
import { FileEdit, Plus } from 'lucide-react'

export function Editor() {
  const { activeDraft, updateDraft, createDraft, editorLayout } = useDraftStore()

  const LINKEDIN_MAX_CHARS = 3000

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
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
        class: 'tiptap ProseMirror focus:outline-none w-full min-h-[380px] md:min-h-[480px] text-sm md:text-base leading-relaxed text-foreground font-sans prose dark:prose-invert max-w-none whitespace-pre-wrap',
        'data-gramm': 'false',
        'data-gramm_editor': 'false',
        'data-enable-grammarly': 'false',
        spellcheck: 'false',
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

            {/* Bottom Status Bar: Character Count & Word Count */}
            <div className="h-10 px-4 border-t border-border/70 bg-card/40 flex items-center justify-end text-xs text-muted-foreground shrink-0 gap-3">
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
