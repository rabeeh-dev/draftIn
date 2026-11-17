import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { LinkDialog } from './LinkDialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Undo2,
  Redo2,
  Sparkles,
  Smile,
  Hash,
  Lightbulb,
  RemoveFormatting,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  if (!editor) return null

  const isBold = editor.isActive('bold')
  const isItalic = editor.isActive('italic')
  const isStrike = editor.isActive('strike')
  const isBulletList = editor.isActive('bulletList')
  const isOrderedList = editor.isActive('orderedList')
  const isBlockquote = editor.isActive('blockquote')
  const isCode = editor.isActive('code')
  const isLink = editor.isActive('link')

  const currentLinkHref = editor.getAttributes('link').href || ''

  const handleLinkSave = (url: string) => {
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleLinkRemove = () => {
    editor.chain().focus().unsetLink().run()
  }

  const hookTemplates = [
    {
      label: 'The Painful Truth',
      text: 'Most people think [common belief] is the key to success.\n\nThey’re wrong.\n\nHere’s what 5 years in [field] taught me:',
    },
    {
      label: 'The 1% Rule',
      text: 'Here is what separates top 1% engineers from the rest:\n\n1. \n2. \n3. ',
    },
    {
      label: 'Stop Doing X',
      text: 'Stop doing [common mistake] in 2026.\n\nDo this instead:',
    },
    {
      label: 'Step-by-Step Breakdown',
      text: 'How I achieved [result] in 6 months:\n\n(A step-by-step breakdown you can copy):',
    },
    {
      label: 'Curated Resource List',
      text: '5 tools that save me 10+ hours every week:\n\n1. \n2. \n3. \n4. \n5. ',
    },
  ]

  const emojiPicks = ['🔥', '💡', '🚀', '👇', '🎯', '✨', '📈', '✅']
  const popularHashtags = [
    '#SoftwareEngineering',
    '#React',
    '#WebDevelopment',
    '#Career',
    '#AI',
    '#TechLeadership',
  ]

  return (
    <>
      <div className="flex items-center justify-between px-3 md:px-5 py-1.5 border-b border-border bg-card/40 overflow-x-auto no-scrollbar gap-2">
        {/* Core Formatting Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="size-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md transition-colors ${
              isBold
                ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="size-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md transition-colors ${
              isItalic
                ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="size-3.5" />
          </button>

          {/* Strike-through */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-md transition-colors ${
              isStrike
                ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Strikethrough (Ctrl+Shift+X)"
          >
            <Strikethrough className="size-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-md transition-colors ${
              isBulletList
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Bullet List"
          >
            <List className="size-3.5" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-md transition-colors ${
              isOrderedList
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="size-3.5" />
          </button>

          {/* Blockquote */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md transition-colors ${
              isBlockquote
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Blockquote"
          >
            <Quote className="size-3.5" />
          </button>

          {/* Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-md transition-colors ${
              isCode
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Inline Code"
          >
            <Code className="size-3.5" />
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={() => setShowLinkDialog(true)}
            className={`p-1.5 rounded-md transition-colors ${
              isLink
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Insert Link (Ctrl+K)"
          >
            <Link2 className="size-3.5" />
          </button>

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Clear Formatting"
          >
            <RemoveFormatting className="size-3.5" />
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Emoji dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors outline-none"
              title="Insert Emoji"
            >
              <Smile className="size-3.5" />
              <span className="hidden sm:inline text-[11px]">Emoji</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="p-2 w-48">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Popular Emojis
              </DropdownMenuLabel>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {emojiPicks.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => editor.chain().focus().insertContent(emoji).run()}
                    className="flex size-8 items-center justify-center rounded-md hover:bg-muted text-base transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hashtags dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors outline-none"
              title="Insert Hashtags"
            >
              <Hash className="size-3.5" />
              <span className="hidden sm:inline text-[11px]">Tags</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Trending Topics
              </DropdownMenuLabel>
              {popularHashtags.map((tag) => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => editor.chain().focus().insertContent(` ${tag} `).run()}
                  className="text-xs cursor-pointer"
                >
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Area: Viral Hook Templates */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors shadow-2xs outline-none"
              title="Viral Hook Templates"
            >
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-[11px]">Hooks</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                <Lightbulb className="size-3.5 text-amber-500" />
                <span>Proven LinkedIn Hooks</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {hookTemplates.map((template) => (
                <DropdownMenuItem
                  key={template.label}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertContent(`\n${template.text}\n`)
                      .run()
                  }
                  className="flex flex-col items-start gap-1 p-2 cursor-pointer"
                >
                  <span className="font-semibold text-xs text-foreground">
                    {template.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1">
                    {template.text.replace(/\n/g, ' ')}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Link Dialog Modal */}
      <LinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        initialUrl={currentLinkHref}
        onSave={handleLinkSave}
        onRemove={isLink ? handleLinkRemove : undefined}
      />
    </>
  )
}
