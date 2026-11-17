import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DraftStoreProvider } from '@/stores/draft.store'
import { LinkedInPreview } from '@/features/preview/components/LinkedInPreview'
import {
  toUnicodeBold,
  toUnicodeItalic,
  convertToLinkedInPublishingText,
} from '@/features/preview/utils/publishingText'
import { formatLinkedInContent } from '@/features/preview/utils/contentRenderer'

function renderWithProvider(ui: React.ReactNode) {
  return render(<DraftStoreProvider>{ui}</DraftStoreProvider>)
}

describe('Phase 3: LinkedIn Preview Engine', () => {
  describe('Profile Header & Customization', () => {
    it('renders LinkedIn-style author card with avatar, name, headline, and timestamp', () => {
      renderWithProvider(<LinkedInPreview />)

      expect(screen.getByText('Alex Morgan')).toBeInTheDocument()
      expect(screen.getByText('• 1st')).toBeInTheDocument()
      expect(screen.getByText('Now')).toBeInTheDocument()
      expect(screen.getByText('Edited')).toBeInTheDocument()
      expect(screen.getByTitle('Edit author profile')).toBeInTheDocument()
    })

    it('opens profile customizer dialog and updates author name and headline', async () => {
      renderWithProvider(<LinkedInPreview />)

      const editBtn = screen.getByTitle('Edit author profile')
      fireEvent.click(editBtn)

      expect(screen.getByText('Customize LinkedIn Profile')).toBeInTheDocument()

      const nameInput = screen.getByDisplayValue('Alex Morgan')
      fireEvent.change(nameInput, { target: { value: 'Sarah Connor' } })

      const saveBtn = screen.getByRole('button', { name: 'Save Profile' })
      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
      })
    })
  })

  describe('Post Content Rendering & Line-Break Preservation', () => {
    it('renders plain text content and highlights hashtags in LinkedIn blue', () => {
      render(
        formatLinkedInContent(
          'Excited to launch #draftin for #SoftwareEngineering leaders.'
        )
      )

      const hashtags = screen.getAllByText(/#(draftin|SoftwareEngineering)/i)
      expect(hashtags.length).toBe(2)
      hashtags.forEach((tag) => {
        expect(tag).toHaveClass('text-[#0A66C2]')
      })
    })

    it('preserves empty lines for LinkedIn broetry line-break pacing', () => {
      const { container } = render(
        formatLinkedInContent('Line 1\n\nLine 2\n\nLine 3')
      )

      // Empty lines rendered with explicit aria-hidden spacer
      const spacers = container.querySelectorAll('[aria-hidden="true"]')
      expect(spacers.length).toBe(2)
    })
  })

  describe('See More / See Less Fold Truncation', () => {
    it('shows "...see more" button when content exceeds truncation threshold', () => {
      renderWithProvider(<LinkedInPreview />)

      // Active draft-1 is long enough to trigger the fold cutoff
      const seeMoreBtn = screen.getByText('...see more')
      expect(seeMoreBtn).toBeInTheDocument()

      // Click to expand
      fireEvent.click(seeMoreBtn)
      expect(screen.getByText('see less')).toBeInTheDocument()

      // Click to collapse
      fireEvent.click(screen.getByText('see less'))
      expect(screen.getByText('...see more')).toBeInTheDocument()
    })
  })

  describe('Publishing-Ready Text Converter & Unicode Formatting', () => {
    it('converts Latin characters to Unicode Mathematical Bold', () => {
      const bold = toUnicodeBold('Hello 123')
      expect(bold).toBe('𝗛𝗲𝗹𝗹𝗼 𝟭𝟮𝟯')
    })

    it('converts Latin characters to Unicode Mathematical Italic', () => {
      const italic = toUnicodeItalic('Creator')
      expect(italic).toBe('𝘊𝘳𝘦𝘢𝘵𝘰𝘳')
    })

    it('transforms Tiptap HTML into clean LinkedIn-compatible publishing text with Unicode styling', () => {
      const html = '<p><strong>Crucial Rule:</strong> Never ship on <em>Friday</em>.</p><ul><li>Point 1</li><li>Point 2</li></ul>'
      const output = convertToLinkedInPublishingText(html)

      expect(output).toContain('𝗖𝗿𝘂𝗰𝗶𝗮𝗹 𝗥𝘂𝗹𝗲:')
      expect(output).toContain('𝘍𝘳𝘪𝘥𝘢𝘺')
      expect(output).toContain('• Point 1')
      expect(output).toContain('• Point 2')
      expect(output).not.toContain('<p>')
      expect(output).not.toContain('<strong>')
    })

    it('renders "Copy for LinkedIn" button with formatted character counter', () => {
      renderWithProvider(<LinkedInPreview />)

      expect(screen.getByText('Publishing-Ready Text')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Copy for LinkedIn/i })).toBeInTheDocument()
    })
  })
})
