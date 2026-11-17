/**
 * Converts alphanumeric characters to Unicode Mathematical Sans-Serif Bold characters.
 * Matches modern LinkedIn font aesthetics.
 */
export function toUnicodeBold(text: string): string {
  const chars = Array.from(text)
  return chars
    .map((char) => {
      const code = char.charCodeAt(0)
      // A-Z (0x1D5D4 to 0x1D5ED)
      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(0x1d5d4 + (code - 65))
      }
      // a-z (0x1D5EE to 0x1D607)
      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(0x1d5ee + (code - 97))
      }
      // 0-9 (0x1D7EC to 0x1D7F5)
      if (code >= 48 && code <= 57) {
        return String.fromCodePoint(0x1d7ec + (code - 48))
      }
      return char
    })
    .join('')
}

/**
 * Converts alphanumeric characters to Unicode Mathematical Sans-Serif Italic characters.
 */
export function toUnicodeItalic(text: string): string {
  const chars = Array.from(text)
  return chars
    .map((char) => {
      const code = char.charCodeAt(0)
      // A-Z (0x1D608 to 0x1D621)
      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(0x1d608 + (code - 65))
      }
      // a-z (0x1D622 to 0x1D63B)
      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(0x1d622 + (code - 97))
      }
      return char
    })
    .join('')
}

/**
 * Transforms Tiptap HTML or markdown into LinkedIn publishing-compatible text.
 * - Converts <strong> and <b> to Unicode Sans-Serif Bold.
 * - Converts <em> and <i> to Unicode Sans-Serif Italic.
 * - Converts <li> to bulleted points.
 * - Preserves double line-breaks between paragraphs.
 * - Strips residual HTML tags.
 */
export function convertToLinkedInPublishingText(content: string): string {
  if (!content) return ''

  let text = content

  // Replace block elements with newlines
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/h[1-6]>/gi, '\n\n')
  text = text.replace(/<\/blockquote>/gi, '\n\n')

  // Convert list items to bullet points
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, itemContent) => {
    return `• ${itemContent.trim()}\n`
  })
  text = text.replace(/<\/?(ul|ol)>/gi, '\n')

  // Convert bold to Unicode Bold
  text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    return toUnicodeBold(inner)
  })

  // Convert italic to Unicode Italic
  text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    return toUnicodeItalic(inner)
  })

  // Convert links: Keep label and append URL if different
  text = text.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
    return label.trim() === href.trim() ? href : `${label} (${href})`
  })

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Clean excessive empty lines (more than 2 consecutive newlines to 2)
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}
