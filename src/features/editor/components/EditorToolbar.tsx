import type { Editor } from '@tiptap/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Hash,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const isBold = editor.isActive('bold')
  const isItalic = editor.isActive('italic')
  const isStrike = editor.isActive('strike')
  const isBulletList = editor.isActive('bulletList')
  const isOrderedList = editor.isActive('orderedList')

  const popularHashtags = [
    '#LinkedInCreator',
    '#SoftwareEngineering',
    '#React',
    '#WebDevelopment',
    '#Career',
    '#AI',
    '#TechLeadership',
    '#Productivity',
    '#Startups',
  ]

  return (
    <div className="flex items-center justify-between px-3 md:px-5 py-1.5 border-b border-border bg-card/40 overflow-x-auto no-scrollbar gap-2">
      {/* Core Formatting Controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="size-3.5" />
        </button>

        {/* Redo */}
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

        {/* Strikethrough */}
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

        {/* Numbered List (Number Bullets) */}
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

        <div className="h-4 w-px bg-border mx-1" />

        {/* Tags Option */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors outline-none cursor-pointer"
            title="Insert Hashtags"
          >
            <Hash className="size-3.5 text-primary" />
            <span className="text-[11px]">Tags</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-2 py-1 select-none">
              Trending Hashtags
            </div>
            {popularHashtags.map((tag) => (
              <DropdownMenuItem
                key={tag}
                onClick={() => editor.chain().focus().insertContent(` ${tag} `).run()}
                className="text-xs cursor-pointer px-2 py-1.5 rounded hover:bg-muted font-medium"
              >
                {tag}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
