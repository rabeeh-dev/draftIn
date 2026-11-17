import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DraftStoreProvider } from '@/stores/draft.store'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { DraftList } from '@/features/drafts/components/DraftList'
import { EmptyState } from '@/components/shared/EmptyState'
import { DraftListSkeleton, LoadingState } from '@/components/shared/LoadingState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FileEdit } from 'lucide-react'

function renderWithProvider(ui: React.ReactNode) {
  return render(<DraftStoreProvider>{ui}</DraftStoreProvider>)
}

describe('Phase 1: UI Building & Architecture', () => {
  describe('Main Sidebar', () => {
    it('renders the brand title and new draft button', () => {
      renderWithProvider(<AppSidebar />)
      expect(screen.getByText('draftin')).toBeInTheDocument()
      expect(screen.getByText('New Draft')).toBeInTheDocument()
    })

    it('renders library navigation items with correct badges', () => {
      renderWithProvider(<AppSidebar />)
      expect(screen.getByText('All Drafts')).toBeInTheDocument()
      expect(screen.getByText('Starred')).toBeInTheDocument()
      expect(screen.getByText('Scheduled')).toBeInTheDocument()
      expect(screen.getByText('Published')).toBeInTheDocument()
    })

    it('toggles sidebar collapse on toggle button click', () => {
      renderWithProvider(<AppSidebar />)
      const collapseBtn = screen.getByTitle('Collapse sidebar')
      expect(collapseBtn).toBeInTheDocument()

      fireEvent.click(collapseBtn)
      // When collapsed, the button title updates
      expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument()
    })
  })

  describe('Drafts List & Search Panel', () => {
    it('renders the drafts list with initial mock drafts', () => {
      renderWithProvider(<DraftList />)
      expect(screen.getByText('The 1% Rule of Software Engineering')).toBeInTheDocument()
      expect(
        screen.getByText('Why we transitioned to React 19 & Tailwind v4')
      ).toBeInTheDocument()
    })

    it('filters drafts when a category tab is clicked', () => {
      renderWithProvider(<DraftList />)
      const scheduledTab = screen.getByRole('button', { name: 'Scheduled' })
      fireEvent.click(scheduledTab)

      // Scheduled draft should remain visible
      expect(
        screen.getByText('Why we transitioned to React 19 & Tailwind v4')
      ).toBeInTheDocument()

      // Non-scheduled draft should not be in the list
      expect(
        screen.queryByText('The 1% Rule of Software Engineering')
      ).not.toBeInTheDocument()
    })

    it('filters drafts in real-time by search query', () => {
      renderWithProvider(<DraftList />)
      const searchInput = screen.getByPlaceholderText('Search drafts, hooks, tags...')
      fireEvent.change(searchInput, { target: { value: 'non-obvious' } })

      expect(
        screen.getByText('5 non-obvious lessons from building an AI-first editor')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('The 1% Rule of Software Engineering')
      ).not.toBeInTheDocument()
    })

    it('displays EmptyState when search yields no matches', () => {
      renderWithProvider(<DraftList />)
      const searchInput = screen.getByPlaceholderText('Search drafts, hooks, tags...')
      fireEvent.change(searchInput, { target: { value: 'random_non_existent_text_xyz' } })

      expect(screen.getByText('No results found')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()

      // Clicking clear search resets the query
      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
      expect(screen.getByText('The 1% Rule of Software Engineering')).toBeInTheDocument()
    })
  })

  describe('Shared Components: Empty, Loading & Confirmation Dialog', () => {
    it('renders EmptyState with custom title, description, and action button', () => {
      const handleAction = vi.fn()
      render(
        <EmptyState
          icon={FileEdit}
          title="Custom Empty Title"
          description="Custom description text explaining the state."
          actionLabel="Add New Item"
          onAction={handleAction}
        />
      )

      expect(screen.getByText('Custom Empty Title')).toBeInTheDocument()
      expect(
        screen.getByText('Custom description text explaining the state.')
      ).toBeInTheDocument()

      const btn = screen.getByRole('button', { name: 'Add New Item' })
      fireEvent.click(btn)
      expect(handleAction).toHaveBeenCalledTimes(1)
    })

    it('renders skeleton loading states', () => {
      const { container } = render(<DraftListSkeleton count={3} />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders generic LoadingState spinner with custom message', () => {
      render(<LoadingState message="Fetching workspace data..." />)
      expect(screen.getByText('Fetching workspace data...')).toBeInTheDocument()
    })

    it('triggers confirm and cancel actions in ConfirmDialog', () => {
      const handleConfirm = vi.fn()
      const handleOpenChange = vi.fn()

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={handleOpenChange}
          title="Delete Post"
          description="Are you sure you want to permanently delete this post?"
          confirmLabel="Yes, Delete"
          variant="destructive"
          onConfirm={handleConfirm}
        />
      )

      expect(screen.getByText('Delete Post')).toBeInTheDocument()
      expect(
        screen.getByText('Are you sure you want to permanently delete this post?')
      ).toBeInTheDocument()

      const confirmBtn = screen.getByRole('button', { name: 'Yes, Delete' })
      fireEvent.click(confirmBtn)
      expect(handleConfirm).toHaveBeenCalledTimes(1)
    })
  })
})
