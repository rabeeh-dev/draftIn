import { useDraftStore } from '@/stores/draft.store'
import { Input } from '@/components/ui/input'
import { Search, X, ArrowUpDown } from 'lucide-react'
import type { SortOption } from '@/types'

export function DraftSearch() {
  const { searchQuery, setSearchQuery, sortBy, setSortBy } = useDraftStore()

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'updated_desc', label: 'Recently Edited' },
    { value: 'updated_asc', label: 'Oldest Edited' },
    { value: 'title_asc', label: 'Alphabetical (A-Z)' },
  ]

  return (
    <div className="space-y-2 px-3 pt-3 pb-2 border-b border-border bg-card/40">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search drafts, hooks, tags..."
          className="h-8 pl-8 pr-7 text-xs bg-background/80 shadow-2xs border-border/80 focus-visible:ring-1"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
        <span className="flex items-center gap-1 font-medium">
          <ArrowUpDown className="size-3" />
          Sort by:
        </span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-transparent text-[11px] font-medium text-foreground outline-none cursor-pointer hover:underline"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
