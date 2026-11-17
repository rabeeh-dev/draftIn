/**
 * Converts alphanumeric characters to Unicode Mathematical Sans-Serif Bold characters.
 * Matches modern LinkedIn font aesthetics.
 */
export function toUnicodeBold(text: string): string {
  if (!text) return ''
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
  if (!text) return ''
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
 * Converts text to Unicode Combining Long Stroke Overlay (Strikethrough).
 */
export function toUnicodeStrike(text: string): string {
  if (!text) return ''
  return Array.from(text)
    .map((char) => char + '\u0336')
    .join('')
}

/**
 * Checks whether content is considered empty or whitespace only.
 */
export function isContentEmpty(content?: string | null): boolean {
  if (!content) return true
  // Strip tags and whitespace
  const stripped = content.replace(/<[^>]+>/g, '').trim()
  return stripped.length === 0
}

/**
 * Transforms Tiptap HTML or markdown into LinkedIn publishing-compatible text.
 * - Converts <strong>, <b>, **bold**, and __bold__ to Unicode Sans-Serif Bold.
 * - Converts <em>, <i>, *italic*, and _italic_ to Unicode Sans-Serif Italic.
 * - Converts ordered list items to numbered list format (1. item, 2. item).
 * - Converts unordered list items to bulleted points (• item).
 * - Preserves line breaks and paragraph spacing.
 * - Preserves hyperlinks and hashtags.
 * - Strips residual HTML tags.
 */
export function convertToLinkedInPublishingText(content: string): string {
  if (!content || isContentEmpty(content)) return ''

  let text = content

  // 1. Process HTML Links: keep readable label and URL
  text = text.replace(
    /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, href, label) => {
      const cleanLabel = label.replace(/<[^>]+>/g, '').trim()
      const cleanHref = href.trim()
      return cleanLabel === cleanHref ? cleanHref : `${cleanLabel} (${cleanHref})`
    }
  )

  // 2. Process Markdown Links: [label](url)
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, label, url) => {
      return label.trim() === url.trim() ? url : `${label} (${url})`
    }
  )

  // 3. Process Ordered Lists in HTML: <ol><li>...</li></ol>
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, listContent) => {
    let index = 1
    return listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, item: string) => {
      const cleanItem = item.trim()
      return `${index++}. ${cleanItem}\n`
    }) + '\n'
  })

  // 4. Process Unordered Lists in HTML: <ul><li>...</li></ul>
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, listContent) => {
    return listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, item: string) => {
      return `• ${item.trim()}\n`
    }) + '\n'
  })

  // 5. Fallback for orphaned <li> tags
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, itemContent) => {
    return `• ${itemContent.trim()}\n`
  })

  // 6. Block-level HTML elements to newlines
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/h[1-6]>/gi, '\n\n')
  text = text.replace(/<\/blockquote>/gi, '\n\n')
  text = text.replace(/<\/?(ul|ol)>/gi, '\n')

  // 7. Markdown Lists:
  // Unordered: - item, * item, + item
  text = text.replace(/^[\t ]*[-*+][\t ]+(.*)$/gm, '• $1')
  // Ordered: 1. item
  text = text.replace(/^[\t ]*(\d+)\.[\t ]+(.*)$/gm, '$1. $2')

  // 8. Convert Bold:
  // HTML: <strong> and <b>
  text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    return toUnicodeBold(inner.replace(/<[^>]+>/g, ''))
  })
  // Markdown: **bold** and __bold__
  text = text.replace(/\*\*(.*?)\*\*/g, (_, inner) => toUnicodeBold(inner))
  text = text.replace(/__(.*?)__/g, (_, inner) => toUnicodeBold(inner))

  // 9. Convert Italic:
  // HTML: <em> and <i>
  text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    return toUnicodeItalic(inner.replace(/<[^>]+>/g, ''))
  })
  // Markdown: *italic* and _italic_ (handling word boundaries)
  text = text.replace(/(^|[^\w*])\*([^*\n]+)\*([^\w*]|$)/g, (_, before, inner, after) => `${before}${toUnicodeItalic(inner)}${after}`)
  text = text.replace(/(^|[^\w_])_([^_\n]+)_([^\w_]|$)/g, (_, before, inner, after) => `${before}${toUnicodeItalic(inner)}${after}`)

  // 10. Convert Strikethrough:
  // HTML: <s>, <del>, <strike>
  text = text.replace(/<(s|del|strike)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    return toUnicodeStrike(inner.replace(/<[^>]+>/g, ''))
  })
  // Markdown: ~~strikethrough~~
  text = text.replace(/~~(.*?)~~/g, (_, inner) => toUnicodeStrike(inner))

  // 11. Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // 12. Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // 13. Normalize consecutive linebreaks (max 2 consecutive newlines to preserve clean paragraph spacing)
  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n')

  return text.trim()
}
