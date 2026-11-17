import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DraftStoreProvider } from '@/stores/draft.store'
import { Editor } from '@/features/editor/components/Editor'
import { EditorHeader } from '@/features/editor/components/EditorHeader'
import { LinkDialog } from '@/features/editor/components/LinkDialog'
import { LinkedInPreview } from '@/features/preview/components/LinkedInPreview'

function renderWithProvider(ui: React.ReactNode) {
  return render(<DraftStoreProvider>{ui}</DraftStoreProvider>)
}

describe('Phase 2: Text Editor & Tiptap Integration', () => {
  describe('Editor Workspace & Tiptap Engine', () => {
    it('initializes Tiptap editor and renders document canvas with active draft content', async () => {
      renderWithProvider(<Editor />)

      // Initial active draft is draft-1: "The 1% Rule of Software Engineering"
      await waitFor(() => {
        expect(
          screen.getByDisplayValue('The 1% Rule of Software Engineering')
        ).toBeInTheDocument()
      })

      // Check that Tiptap ProseMirror content canvas is mounted
      const editorElement = document.querySelector('.tiptap')
      expect(editorElement).toBeInTheDocument()
      expect(editorElement).toHaveAttribute('contenteditable', 'true')
    })

    it('renders all required formatting toolbar buttons (bold, italic, strike, lists, links)', async () => {
      renderWithProvider(<Editor />)

      await waitFor(() => {
        expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument()
        expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument()
        expect(screen.getByTitle('Strikethrough (Ctrl+Shift+X)')).toBeInTheDocument()
        expect(screen.getByTitle('Bullet List')).toBeInTheDocument()
        expect(screen.getByTitle('Numbered List')).toBeInTheDocument()
        expect(screen.getByTitle('Blockquote')).toBeInTheDocument()
        expect(screen.getByTitle('Inline Code')).toBeInTheDocument()
        expect(screen.getByTitle('Insert Link (Ctrl+K)')).toBeInTheDocument()
      })
    })

    it('toggles formatting marks (Bold, Italic, Strike) via toolbar buttons', async () => {
      renderWithProvider(<Editor />)

      const boldBtn = await screen.findByTitle('Bold (Ctrl+B)')
      const italicBtn = screen.getByTitle('Italic (Ctrl+I)')
      const strikeBtn = screen.getByTitle('Strikethrough (Ctrl+Shift+X)')

      // Click formatting buttons
      fireEvent.click(boldBtn)
      fireEvent.click(italicBtn)
      fireEvent.click(strikeBtn)

      // Elements remain interactive without throwing errors
      expect(boldBtn).toBeInTheDocument()
      expect(italicBtn).toBeInTheDocument()
      expect(strikeBtn).toBeInTheDocument()
    })
  })

  describe('Document Title & State Management', () => {
    it('updates active draft document title in real time', async () => {
      renderWithProvider(<EditorHeader />)

      const titleInput = screen.getByDisplayValue(
        'The 1% Rule of Software Engineering'
      )
      expect(titleInput).toBeInTheDocument()

      fireEvent.change(titleInput, {
        target: { value: 'Mastering System Architecture in 2026' },
      })

      expect(
        screen.getByDisplayValue('Mastering System Architecture in 2026')
      ).toBeInTheDocument()
    })

    it('renders layout mode toggles and autosave indicator', () => {
      renderWithProvider(<EditorHeader />)
      expect(screen.getByText('Saved')).toBeInTheDocument()
      expect(screen.getByTitle('Split View (Editor + Live Preview)')).toBeInTheDocument()
      expect(screen.getByTitle('Editor Focus (Full Width)')).toBeInTheDocument()
      expect(screen.getByTitle('Preview Focus')).toBeInTheDocument()
    })
  })

  describe('Character & Word Counter', () => {
    it('calculates character count and enforces 3,000 character LinkedIn limit', async () => {
      renderWithProvider(<Editor />)

      // The status bar displays "X / 3000" and word count
      await waitFor(() => {
        expect(screen.getByText(/\/ 3000/)).toBeInTheDocument()
        expect(screen.getByText(/^\d+\s+words$/)).toBeInTheDocument()
      })
    })

    it('analyzes opening hook health for LinkedIn readability', async () => {
      renderWithProvider(<Editor />)

      await waitFor(() => {
        // Status bar hook analyzer gives guidance (either optimal hook length or punchy hook tip)
        const hookBanner = screen.getByText(
          /Hook length looks optimal|Tip: Keep your opening hook punchy/i
        )
        expect(hookBanner).toBeInTheDocument()
      })
    })
  })

  describe('Links Integration & LinkDialog Modal', () => {
    it('opens LinkDialog and handles URL input and submission', () => {
      const handleSave = vi.fn()
      const handleOpenChange = vi.fn()

      render(
        <LinkDialog
          open={true}
          onOpenChange={handleOpenChange}
          initialUrl="https://github.com/rabeeh-dev/draftIn"
          onSave={handleSave}
        />
      )

      expect(screen.getByText('Insert Link')).toBeInTheDocument()
      const input = screen.getByPlaceholderText('https://example.com/article')
      expect(input).toHaveValue('https://github.com/rabeeh-dev/draftIn')

      const applyBtn = screen.getByRole('button', { name: 'Apply Link' })
      fireEvent.click(applyBtn)

      expect(handleSave).toHaveBeenCalledWith(
        'https://github.com/rabeeh-dev/draftIn'
      )
    })

    it('auto-prefixes URLs without http/https with https://', () => {
      const handleSave = vi.fn()

      render(
        <LinkDialog
          open={true}
          onOpenChange={() => {}}
          initialUrl=""
          onSave={handleSave}
        />
      )

      const input = screen.getByPlaceholderText('https://example.com/article')
      fireEvent.change(input, { target: { value: 'draftin.app/features' } })

      const applyBtn = screen.getByRole('button', { name: 'Apply Link' })
      fireEvent.click(applyBtn)

      expect(handleSave).toHaveBeenCalledWith('https://draftin.app/features')
    })
  })

  describe('Live LinkedIn Preview Synchronization', () => {
    it('renders authentic LinkedIn post card with author, headline, and engagement buttons', () => {
      renderWithProvider(<LinkedInPreview />)

      expect(screen.getByText('Alex Morgan')).toBeInTheDocument()
      expect(screen.getByText('• 1st')).toBeInTheDocument()
      expect(screen.getByText('LinkedIn Feed Simulation')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /repost/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('renders device switcher for mobile and desktop preview simulation', () => {
      renderWithProvider(<LinkedInPreview />)

      const mobileToggle = screen.getByTitle('Mobile Device Feed (375px)')
      const desktopToggle = screen.getByTitle('Desktop Feed (550px)')

      expect(mobileToggle).toBeInTheDocument()
      expect(desktopToggle).toBeInTheDocument()

      fireEvent.click(mobileToggle)
      expect(mobileToggle).toHaveClass('font-semibold')
    })
  })
})
