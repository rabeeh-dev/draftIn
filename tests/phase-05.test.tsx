import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { DraftStoreProvider, useDraftStore } from '@/stores/draft.store'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { EditorHeader } from '@/features/editor/components/EditorHeader'
import { DraftList } from '@/features/drafts/components/DraftList'
import { DraftCard } from '@/features/drafts/components/DraftCard'
import { draftService, mapRowToDraft, mapDraftToRow } from '@/features/drafts/services/draft.service'
import { TEST_FIXTURE_DRAFTS } from './test-fixtures'
import type { Draft } from '@/types'

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <AuthProvider>
      <DraftStoreProvider>{ui}</DraftStoreProvider>
    </AuthProvider>
  )
}

describe('Phase 5: Draft Management Engine', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('draftin_drafts_v1', JSON.stringify(TEST_FIXTURE_DRAFTS))
  })

  describe('Data Mapping & Local Persistence', () => {
    it('maps Supabase DB row (snake_case) to Draft model (camelCase) correctly', () => {
      const dbRow = {
        id: 'db-1',
        user_id: 'user-123',
        title: 'Mapped Post',
        content: 'Testing mapping',
        status: 'scheduled' as const,
        is_starred: true,
        tags: ['Tech', 'AI'],
        scheduled_for: 'Tomorrow 9AM',
        created_at: '2026-11-17T00:00:00Z',
        updated_at: '2026-11-17T01:00:00Z',
      }

      const draft = mapRowToDraft(dbRow)
      expect(draft.id).toBe('db-1')
      expect(draft.title).toBe('Mapped Post')
      expect(draft.isStarred).toBe(true)
      expect(draft.scheduledFor).toBe('Tomorrow 9AM')
      expect(draft.tags).toEqual(['Tech', 'AI'])
    })

    it('maps Draft model to Supabase DB insert format', () => {
      const draft: Draft = {
        id: 'draft-abc',
        title: 'New Post',
        content: 'Content here',
        status: 'draft',
        isStarred: false,
        tags: ['Marketing'],
        createdAt: '2026-11-17T00:00:00Z',
        updatedAt: '2026-11-17T02:00:00Z',
      }

      const row = mapDraftToRow(draft, 'user-456')
      expect(row.id).toBe('draft-abc')
      expect(row.user_id).toBe('user-456')
      expect(row.is_starred).toBe(false)
      expect(row.tags).toEqual(['Marketing'])
    })

    it('persists drafts to localStorage and retrieves them', () => {
      const mockList: Draft[] = [
        {
          id: 'test-local-1',
          title: 'Offline Post',
          content: 'Persisted locally',
          status: 'draft',
          isStarred: false,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      draftService.saveLocalDrafts(mockList)
      const retrieved = draftService.getLocalDrafts()
      expect(retrieved.length).toBe(1)
      expect(retrieved[0].title).toBe('Offline Post')
    })
  })

  describe('Create, Edit, and Delete Drafts', () => {
    function TestConsumer() {
      const {
        drafts,
        activeDraft,
        createDraft,
        updateDraft,
        deleteDraft,
        toggleStar,
      } = useDraftStore()

      return (
        <div>
          <button onClick={() => createDraft()}>Create New</button>
          <button
            onClick={() =>
              activeDraft &&
              updateDraft(activeDraft.id, { title: 'Updated Title', content: 'Updated Body' })
            }
          >
            Update Active
          </button>
          <button onClick={() => activeDraft && toggleStar(activeDraft.id)}>
            Toggle Star
          </button>
          <button onClick={() => activeDraft && deleteDraft(activeDraft.id)}>
            Delete Active
          </button>
          <div data-testid="draft-count">{drafts.length}</div>
          <div data-testid="active-title">{activeDraft?.title}</div>
          <div data-testid="active-starred">{String(activeDraft?.isStarred)}</div>
        </div>
      )
    }

    it('creates a new draft and sets it as the active draft', () => {
      renderWithProviders(<TestConsumer />)

      const initialCount = Number(screen.getByTestId('draft-count').textContent)
      const createBtn = screen.getByText('Create New')

      fireEvent.click(createBtn)

      expect(Number(screen.getByTestId('draft-count').textContent)).toBe(initialCount + 1)
      expect(screen.getByTestId('active-title').textContent).toBe('Untitled Draft')
    })

    it('edits an existing draft title and content optimistically', () => {
      renderWithProviders(<TestConsumer />)

      const updateBtn = screen.getByText('Update Active')
      fireEvent.click(updateBtn)

      expect(screen.getByTestId('active-title').textContent).toBe('Updated Title')
    })

    it('toggles star state for the active draft', () => {
      renderWithProviders(<TestConsumer />)

      const initialStarred = screen.getByTestId('active-starred').textContent
      const toggleStarBtn = screen.getByText('Toggle Star')

      fireEvent.click(toggleStarBtn)
      const nextStarred = screen.getByTestId('active-starred').textContent
      expect(nextStarred).not.toBe(initialStarred)
    })

    it('deletes active draft and safely shifts activeDraft to the remaining draft', () => {
      renderWithProviders(<TestConsumer />)

      const initialCount = Number(screen.getByTestId('draft-count').textContent)
      const initialActiveTitle = screen.getByTestId('active-title').textContent

      const deleteBtn = screen.getByText('Delete Active')
      fireEvent.click(deleteBtn)

      expect(Number(screen.getByTestId('draft-count').textContent)).toBe(initialCount - 1)
      expect(screen.getByTestId('active-title').textContent).not.toBe(initialActiveTitle)
    })
  })

  describe('Search and Filter Engine', () => {
    it('filters drafts in real time by hashtag and title queries', () => {
      renderWithProviders(<DraftList />)

      const searchInput = screen.getByPlaceholderText(/search drafts/i)
      fireEvent.change(searchInput, { target: { value: '#Tech' } })

      expect(screen.getByText('Why we transitioned to React 19 & Tailwind v4')).toBeInTheDocument()
      expect(screen.queryByText('How to write LinkedIn hooks that convert without being cringe')).not.toBeInTheDocument()
    })
  })

  describe('Autosave, Save Indicators, and Error Recovery', () => {
    it('renders saved indicator in editor header', () => {
      renderWithProviders(<EditorHeader />)

      const savedIndicators = screen.getAllByText(/saved/i)
      expect(savedIndicators.length).toBeGreaterThanOrEqual(1)
    })

    it('triggers autosave transition from unsaved to saved after debounce', async () => {
      function StatusTester() {
        const { saveStatus, updateDraft, activeDraft } = useDraftStore()
        return (
          <div>
            <span data-testid="save-status">{saveStatus}</span>
            <button
              onClick={() =>
                activeDraft && updateDraft(activeDraft.id, { content: 'Autosave test' })
              }
            >
              Trigger Edit
            </button>
          </div>
        )
      }

      renderWithProviders(<StatusTester />)

      const triggerBtn = screen.getByText('Trigger Edit')
      fireEvent.click(triggerBtn)

      // State immediately becomes unsaved
      expect(screen.getByTestId('save-status').textContent).toBe('unsaved')

      // Wait for 1000ms debounce to settle
      await waitFor(
        () => {
          expect(screen.getByTestId('save-status').textContent).toBe('saved')
        },
        { timeout: 2500 }
      )
    })

    it('handles error recovery with offline backup and retry sync', async () => {
      function ErrorTester() {
        const { saveStatus, setSaveStatus, setSyncError, retrySync } = useDraftStore()
        return (
          <div>
            <span data-testid="error-status">{saveStatus}</span>
            <button
              onClick={() => {
                setSaveStatus('error')
                setSyncError('Simulated Network Error')
              }}
            >
              Force Error
            </button>
            <button onClick={() => retrySync()}>Retry Now</button>
          </div>
        )
      }

      renderWithProviders(<ErrorTester />)

      const forceBtn = screen.getByText('Force Error')
      fireEvent.click(forceBtn)

      expect(screen.getByTestId('error-status').textContent).toBe('error')

      const retryBtn = screen.getByText('Retry Now')
      await act(async () => {
        fireEvent.click(retryBtn)
      })

      await waitFor(() => {
        expect(screen.getByTestId('error-status').textContent).toBe('saved')
      })
    })

    it('initializes with an empty draft list when localStorage has no drafts (zero dummy contents)', () => {
      localStorage.clear()
      function EmptyTester() {
        const { drafts, activeDraft } = useDraftStore()
        return (
          <div>
            <span data-testid="draft-count">{drafts.length}</span>
            <span data-testid="active-draft">{activeDraft ? 'exists' : 'none'}</span>
          </div>
        )
      }

      renderWithProviders(<EmptyTester />)
      expect(screen.getByTestId('draft-count').textContent).toBe('0')
      expect(screen.getByTestId('active-draft').textContent).toBe('none')
    })
  })

  describe('DraftCard Content Rendering & Compact Column', () => {
    it('does not render content preview in draft card and renders compact header and stats', () => {
      const htmlDraft: Draft = {
        id: 'draft-html-preview',
        title: 'HTML Post Preview',
        content: '<p>This is a <strong>clean snippet</strong> without <em>any</em> HTML tags.</p>',
        status: 'draft',
        isStarred: false,
        tags: ['Clean'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      renderWithProviders(
        <DraftCard
          draft={htmlDraft}
          isSelected={false}
          onSelect={() => {}}
        />
      )

      expect(screen.getByText('HTML Post Preview')).toBeInTheDocument()
      expect(screen.getByText('#Clean')).toBeInTheDocument()
      // Content preview is removed from the draft sidebar card
      expect(screen.queryByText(/clean snippet/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/<p>/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/<strong>/i)).not.toBeInTheDocument()
    })
  })
})
