import { useMemo } from 'react'
import { useDraftStore } from '@/stores/draft.store'
import { DraftSearch } from './DraftSearch'
import { DraftCard } from './DraftCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { DraftListSkeleton } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Plus, FileText, SearchX } from 'lucide-react'
import type { DraftFilter } from '@/types'

export function DraftList() {
  const {
    drafts,
    activeDraftId,
    setActiveDraftId,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    sortBy,
    isLoading,
    createDraft,
    setIsDraftListOpen,
  } = useDraftStore()

  const filteredDrafts = useMemo(() => {
    let result = [...drafts]

    // 1. Filter by category
    if (filter === 'starred') {
      result = result.filter((d) => d.isStarred)
    } else if (filter !== 'all') {
      result = result.filter((d) => d.status === filter)
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortBy === 'updated_desc') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
      if (sortBy === 'updated_asc') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

    return result
  }, [drafts, filter, searchQuery, sortBy])

  const filterTabs: { label: string; value: DraftFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Drafts', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Published', value: 'published' },
  ]

  return (
    <div className="flex h-full w-full flex-col bg-sidebar/30">
      {/* Panel Top Header */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-border bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-tight text-foreground">Drafts</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {filteredDrafts.length}
          </span>
        </div>

        <Button
          size="icon-xs"
          onClick={() => createDraft()}
          className="rounded-lg shadow-2xs"
          title="Create new draft"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-muted/20 overflow-x-auto no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 ${
                isActive
                  ? 'bg-card text-foreground font-semibold shadow-2xs border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search & Sort Panel */}
      <DraftSearch />

      {/* Scrollable Drafts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <DraftListSkeleton count={4} />
        ) : filteredDrafts.length > 0 ? (
          filteredDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              isSelected={draft.id === activeDraftId}
              onSelect={() => {
                setActiveDraftId(draft.id)
                // On mobile screens, automatically show editor
                if (window.innerWidth < 768) {
                  setIsDraftListOpen(false)
                }
              }}
            />
          ))
        ) : searchQuery.trim() ? (
          <EmptyState
            icon={SearchX}
            title="No results found"
            description={`No drafts matched "${searchQuery}". Try searching for another keyword or tag.`}
            actionLabel="Clear search"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title={filter === 'all' ? 'No drafts yet' : `No ${filter} drafts`}
            description="Create your first LinkedIn post draft to start crafting viral content."
            actionLabel="Create Draft"
            onAction={() => createDraft()}
          />
        )}
      </div>
    </div>
  )
}
