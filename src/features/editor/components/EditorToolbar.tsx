import { useDraftStore } from '@/stores/draft.store'
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
  List,
  ListOrdered,
  Quote,
  Sparkles,
  Smile,
  Hash,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'

export function EditorToolbar() {
  const { activeDraft, updateDraft } = useDraftStore()

  if (!activeDraft) return null

  const insertTextAtEnd = (snippet: string) => {
    const updated = activeDraft.content ? `${activeDraft.content}\n${snippet}` : snippet
    updateDraft(activeDraft.id, { content: updated })
  }

  const hookTemplates = [
    { label: 'The Painful Truth', text: 'Most people think [common belief] is the key to success.\n\nThey’re wrong.\n\nHere’s what 5 years in [field] taught me:' },
    { label: 'The 1% Rule', text: 'Here is what separates top 1% [role] from the rest:\n\n1. \n2. \n3. ' },
    { label: 'Stop Doing X', text: 'Stop doing [bad habit] in 2026.\n\nDo this instead:' },
    { label: 'Step-by-Step Breakdown', text: 'How I went from [point A] to [point B] in 6 months:\n\n(A step-by-step breakdown you can copy):' },
    { label: 'Curated Resource List', text: '5 tools that save me 10+ hours every week:\n\n1. \n2. \n3. \n4. \n5. ' },
  ]

  const emojiPicks = ['🔥', '💡', '🚀', '👇', '🎯', '✨', '📈', '✅']

  const popularHashtags = ['#SoftwareEngineering', '#React', '#WebDevelopment', '#Career', '#AI', '#TechLeadership']

  return (
    <div className="flex items-center justify-between px-3 md:px-5 py-2 border-b border-border bg-card/40 overflow-x-auto no-scrollbar gap-2">
      {/* Formatting Tools */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => insertTextAtEnd('**Bold text**')}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Bold"
        >
          <Bold className="size-3.5" />
        </button>

        <button
          onClick={() => insertTextAtEnd('*Italic text*')}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Italic"
        >
          <Italic className="size-3.5" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          onClick={() => insertTextAtEnd('• Item 1\n• Item 2\n• Item 3')}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Bullet List"
        >
          <List className="size-3.5" />
        </button>

        <button
          onClick={() => insertTextAtEnd('1. Step one\n2. Step two\n3. Step three')}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="size-3.5" />
        </button>

        <button
          onClick={() => insertTextAtEnd('> "Insert inspiring quote or key takeaway here."')}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Blockquote"
        >
          <Quote className="size-3.5" />
        </button>

        <button
          onClick={() => insertTextAtEnd('→ ')}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors text-xs font-bold"
          title="Arrow bullet"
        >
          <ArrowRight className="size-3.5" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Emoji picker dropdown */}
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
                  onClick={() => insertTextAtEnd(emoji)}
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
                onClick={() => insertTextAtEnd(`\n${tag}`)}
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
                onClick={() => insertTextAtEnd(template.text)}
                className="flex flex-col items-start gap-1 p-2 cursor-pointer"
              >
                <span className="font-semibold text-xs text-foreground">{template.label}</span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">
                  {template.text.replace(/\n/g, ' ')}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
