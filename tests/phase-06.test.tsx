import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DraftStoreProvider, useDraftStore } from '@/stores/draft.store'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { LinkedInPreview } from '@/features/preview/components/LinkedInPreview'
import { EditorHeader } from '@/features/editor/components/EditorHeader'
import { PublishDialog, LINKEDIN_COMPOSE_URL } from '@/features/preview/components/PublishDialog'
import {
  convertToLinkedInPublishingText,
  isContentEmpty,
  toUnicodeStrike,
} from '@/features/preview/utils/publishingText'
import { copyTextToClipboard } from '@/features/preview/utils/clipboard'
import { TEST_FIXTURE_DRAFTS } from './test-fixtures'

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <AuthProvider>
      <DraftStoreProvider>{ui}</DraftStoreProvider>
    </AuthProvider>
  )
}

describe('Phase 6: Publishing Handoff Engine', () => {
  let clipboardWriteTextMock: ReturnType<typeof vi.fn>
  let windowOpenMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('draftin_drafts_v1', JSON.stringify(TEST_FIXTURE_DRAFTS))
    clipboardWriteTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardWriteTextMock,
      },
    })

    windowOpenMock = vi.fn()
    window.open = windowOpenMock as unknown as typeof window.open
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------
  // Feature 1: Publishing Text Formatting Preservation
  // -------------------------------------------------------------
  describe('Preserve Supported Formatting in Published Text', () => {
    it('converts bold HTML tags and markdown asterisks into Unicode Mathematical Bold', () => {
      const html = '<p>This is <strong>important</strong> and <b>urgent</b>.</p>'
      const markdown = 'This is **critical** announcement.'

      const htmlResult = convertToLinkedInPublishingText(html)
      const mdResult = convertToLinkedInPublishingText(markdown)

      expect(htmlResult).toContain('𝗶𝗺𝗽𝗼𝗿𝘁𝗮𝗻𝘁')
      expect(htmlResult).toContain('𝘂𝗿𝗴𝗲𝗻𝘁')
      expect(mdResult).toContain('𝗰𝗿𝗶𝘁𝗶𝗰𝗮𝗹')
      expect(htmlResult).not.toContain('<strong>')
      expect(htmlResult).not.toContain('<b>')
    })

    it('converts italic HTML tags and markdown into Unicode Mathematical Italic', () => {
      const html = '<p>Ship with <em>confidence</em> and <i>speed</i>.</p>'
      const markdown = 'Ship with *excellence* today.'

      const htmlResult = convertToLinkedInPublishingText(html)
      const mdResult = convertToLinkedInPublishingText(markdown)

      expect(htmlResult).toContain('𝘤𝘰𝘯𝘧𝘪𝘥𝘦𝘯𝘤𝘦')
      expect(htmlResult).toContain('𝘴𝘱𝘦𝘦𝘥')
      expect(mdResult).toContain('𝘦𝘹𝘤𝘦𝘭𝘭𝘦𝘯𝘤𝘦')
      expect(htmlResult).not.toContain('<em>')
      expect(htmlResult).not.toContain('<i>')
    })

    it('converts strikethrough tags into Unicode Combining Long Stroke Overlay', () => {
      const html = '<p>Old plan: <s>abandoned</s> and <del>cancelled</del>.</p>'
      const result = convertToLinkedInPublishingText(html)

      expect(toUnicodeStrike('no')).toBe('n̶o̶')
      expect(result).toContain('a̶b̶a̶n̶d̶o̶n̶e̶d̶')
      expect(result).toContain('c̶a̶n̶c̶e̶l̶l̶e̶d̶')
    })

    it('formats bulleted and numbered lists with clean LinkedIn-compatible bullets and numbering', () => {
      const bulletListHtml = '<ul><li>First takeaway</li><li>Second takeaway</li></ul>'
      const numberedListHtml = '<ol><li>Step one</li><li>Step two</li></ol>'

      const bulletResult = convertToLinkedInPublishingText(bulletListHtml)
      const numberedResult = convertToLinkedInPublishingText(numberedListHtml)

      expect(bulletResult).toContain('• First takeaway')
      expect(bulletResult).toContain('• Second takeaway')
      expect(numberedResult).toContain('1. Step one')
      expect(numberedResult).toContain('2. Step two')
    })

    it('preserves links cleanly without leaving raw anchor tags in published text', () => {
      const html = '<p>Check out our docs at <a href="https://draftin.dev">DraftIn</a>.</p>'
      const result = convertToLinkedInPublishingText(html)

      expect(result).toContain('DraftIn (https://draftin.dev)')
      expect(result).not.toContain('<a href=')
      expect(result).not.toContain('</a>')
    })

    it('preserves line breaks and paragraph spacing for LinkedIn broetry formatting', () => {
      const html = '<p>Hook line</p><p><br></p><p>Key insight</p><p>Call to action #founder</p>'
      const result = convertToLinkedInPublishingText(html)

      expect(result).toContain('Hook line')
      expect(result).toContain('Key insight')
      expect(result).toContain('#founder')
      expect(result.split('\n').length).toBeGreaterThanOrEqual(3)
    })
  })

  // -------------------------------------------------------------
  // Feature 2: Handling Empty Drafts
  // -------------------------------------------------------------
  describe('Handle Empty Drafts', () => {
    it('accurately identifies empty content, blank HTML, and whitespace', () => {
      expect(isContentEmpty('')).toBe(true)
      expect(isContentEmpty('   ')).toBe(true)
      expect(isContentEmpty('<p></p>')).toBe(true)
      expect(isContentEmpty('<p><br></p>')).toBe(true)
      expect(isContentEmpty('<div> </div>')).toBe(true)
      expect(isContentEmpty(null)).toBe(true)
      expect(isContentEmpty(undefined)).toBe(true)

      expect(isContentEmpty('<p>Real post content</p>')).toBe(false)
      expect(isContentEmpty('Just plain text')).toBe(false)
    })

    it('renders empty draft placeholder and disables copy/open buttons when draft is empty', () => {
      function EmptyDraftWrapper() {
        const { activeDraft, updateDraft } = useDraftStore()
        return (
          <div>
            <button
              onClick={() => {
                if (activeDraft) {
                  updateDraft(activeDraft.id, { content: '' })
                }
              }}
            >
              Set Blank
            </button>
            <LinkedInPreview />
          </div>
        )
      }

      renderWithProviders(<EmptyDraftWrapper />)
      fireEvent.click(screen.getByText('Set Blank'))

      expect(screen.getAllByText('Draft is empty').length).toBeGreaterThanOrEqual(1)
      expect(
        screen.getByText('Type in the editor to see your LinkedIn live preview.')
      ).toBeInTheDocument()

      const copyBtn = screen.getByRole('button', { name: /Copy for LinkedIn/i })
      expect(copyBtn).toBeDisabled()

      const openBtn = screen.getByRole('button', { name: /Open LinkedIn/i })
      expect(openBtn).toBeDisabled()
    })

    it('disables Copy, Schedule, and Publish buttons in EditorHeader when content is empty', () => {
      function HeaderEmptyWrapper() {
        const { activeDraft, updateDraft } = useDraftStore()
        return (
          <div>
            <button
              onClick={() => {
                if (activeDraft) {
                  updateDraft(activeDraft.id, { content: '<p></p>' })
                }
              }}
            >
              Clear Content
            </button>
            <EditorHeader />
          </div>
        )
      }

      renderWithProviders(<HeaderEmptyWrapper />)
      fireEvent.click(screen.getByText('Clear Content'))

      const copyPostBtn = screen.getByTitle('Draft is empty. Write your post before copying.')
      expect(copyPostBtn).toBeDisabled()

      const scheduleBtn = screen.getByTitle('Draft is empty. Add content to schedule.')
      expect(scheduleBtn).toBeDisabled()

      const publishBtn = screen.getByTitle('Draft is empty. Add content to publish.')
      expect(publishBtn).toBeDisabled()
    })
  })

  // -------------------------------------------------------------
  // Feature 3: Copy Post Text & Clipboard Utility
  // -------------------------------------------------------------
  describe('Copy Post Text & Clipboard Utility', () => {
    it('copies text using modern navigator.clipboard.writeText', async () => {
      const testContent = 'Post text to copy'
      const success = await copyTextToClipboard(testContent)

      expect(success).toBe(true)
      expect(clipboardWriteTextMock).toHaveBeenCalledWith(testContent)
    })

    it('falls back to document.execCommand when navigator.clipboard throws', async () => {
      clipboardWriteTextMock.mockRejectedValueOnce(new Error('Permission denied'))
      const execCommandMock = vi.fn().mockReturnValue(true)
      document.execCommand = execCommandMock

      const success = await copyTextToClipboard('Fallback text')

      expect(success).toBe(true)
      expect(execCommandMock).toHaveBeenCalledWith('copy')
    })

    it('copies formatted Unicode publishing text to clipboard when clicking Copy in EditorHeader', async () => {
      renderWithProviders(<EditorHeader />)

      const copyButton = screen.getByRole('button', { name: /Copy Post/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(clipboardWriteTextMock).toHaveBeenCalled()
        const copiedText = clipboardWriteTextMock.mock.calls[0][0]
        expect(copiedText.length).toBeGreaterThan(0)
      })
    })
  })

  // -------------------------------------------------------------
  // Feature 4: Copy Feedback
  // -------------------------------------------------------------
  describe('Copy Feedback & Status Indicators', () => {
    it('shows interactive "Copied!" button transition and "Ready for LinkedIn!" toast in EditorHeader', async () => {
      renderWithProviders(<EditorHeader />)

      const copyButton = screen.getByRole('button', { name: /Copy Post/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
        expect(screen.getByText('Ready for LinkedIn!')).toBeInTheDocument()
      })
    })

    it('shows feedback banner and button transition in LinkedInPreview Quick Bar', async () => {
      renderWithProviders(<LinkedInPreview />)

      const copyBtn = screen.getByRole('button', { name: /Copy for LinkedIn/i })
      fireEvent.click(copyBtn)

      await waitFor(() => {
        expect(screen.getByText('Copied to Clipboard!')).toBeInTheDocument()
        expect(
          screen.getByText('Ready to paste into LinkedIn feed (Ctrl+V / Cmd+V)')
        ).toBeInTheDocument()
      })
    })
  })

  // -------------------------------------------------------------
  // Feature 5: Open LinkedIn & Publishing Handoff Dialog
  // -------------------------------------------------------------
  describe('Open LinkedIn & Publish Handoff Dialog', () => {
    it('opens official LinkedIn composer URL in a new tab when clicking Open LinkedIn', () => {
      renderWithProviders(<LinkedInPreview />)

      const openLinkedInBtn = screen.getByRole('button', { name: /Open LinkedIn/i })
      fireEvent.click(openLinkedInBtn)

      expect(windowOpenMock).toHaveBeenCalledWith(
        LINKEDIN_COMPOSE_URL,
        '_blank',
        'noopener,noreferrer'
      )
      expect(clipboardWriteTextMock).toHaveBeenCalled()
    })

    it('opens PublishDialog when clicking Publish button in EditorHeader', async () => {
      renderWithProviders(<EditorHeader />)

      const publishBtn = screen.getByRole('button', { name: /^Publish$/i })
      fireEvent.click(publishBtn)

      await waitFor(() => {
        expect(screen.getByText('Publish to LinkedIn')).toBeInTheDocument()
        expect(
          screen.getByText('Complete your post handoff in 2 quick steps.')
        ).toBeInTheDocument()
      })
    })

    it('provides 2-step flow inside PublishDialog: Copy Text and Open LinkedIn', async () => {
      function PublishDialogWrapper() {
        return <PublishDialog open={true} onOpenChange={() => {}} />
      }

      renderWithProviders(<PublishDialogWrapper />)

      expect(screen.getByText('Copy Post Text')).toBeInTheDocument()
      expect(screen.getByText('Open LinkedIn Feed')).toBeInTheDocument()

      const openFeedBtn = screen.getByRole('button', { name: /Open LinkedIn/i })
      fireEvent.click(openFeedBtn)

      expect(windowOpenMock).toHaveBeenCalledWith(
        LINKEDIN_COMPOSE_URL,
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('marks draft as published and closes dialog when clicking "Mark as Published"', async () => {
      let openState = true
      function StatefulPublishDialog() {
        const { activeDraft } = useDraftStore()
        return (
          <div>
            <div data-testid="status">{activeDraft?.status}</div>
            <PublishDialog
              open={openState}
              onOpenChange={(val) => {
                openState = val
              }}
            />
          </div>
        )
      }

      renderWithProviders(<StatefulPublishDialog />)

      const markPublishedBtn = screen.getByRole('button', { name: /Mark as Published/i })
      fireEvent.click(markPublishedBtn)

      expect(openState).toBe(false)
      expect(screen.getByTestId('status')).toHaveTextContent('published')
    })
  })
})
