import type { ReactNode } from 'react'

/**
 * Normalizes and formats text and HTML content for LinkedIn feed display.
 * Preserves exact line-breaks, spacing, hashtags, and mentions.
 */
export function formatLinkedInContent(content: string): ReactNode {
  if (!content || !content.trim()) {
    return (
      <p className="italic text-muted-foreground/60 py-4 text-center">
        Your LinkedIn post preview will render live here as you write...
      </p>
    )
  }

  // Check if content contains HTML tags from Tiptap
  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  if (isHtml) {
    return (
      <div
        className="linkedin-post-prose text-xs md:text-[13px] leading-relaxed text-foreground select-text break-words [&_p]:my-2 [&_p:empty]:h-4 [&_p:empty]:block [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#0A66C2] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-2 [&_a]:text-[#0A66C2] dark:[&_a]:text-[#70b5f9] [&_a]:underline [&_strong]:font-bold [&_em]:italic [&_s]:line-through"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  // Plain text fallback with line-break preservation and token highlighting
  const lines = content.split('\n')

  return (
    <div className="space-y-1 text-xs md:text-[13px] leading-relaxed text-foreground select-text break-words">
      {lines.map((line, lineIdx) => {
        // Empty lines rendered as a distinct blank space to match LinkedIn's spacing
        if (!line.trim()) {
          return <div key={lineIdx} className="h-4" aria-hidden="true" />
        }

        const words = line.split(' ')

        return (
          <p key={lineIdx} className="min-h-[1.25rem]">
            {words.map((word, wordIdx) => {
              // Hashtags
              if (word.startsWith('#') && word.length > 1) {
                return (
                  <span
                    key={wordIdx}
                    className="text-[#0A66C2] dark:text-[#70b5f9] font-medium hover:underline cursor-pointer"
                  >
                    {word}{' '}
                  </span>
                )
              }

              // Mentions (@someone)
              if (word.startsWith('@') && word.length > 1) {
                return (
                  <span
                    key={wordIdx}
                    className="text-[#0A66C2] dark:text-[#70b5f9] font-semibold hover:underline cursor-pointer"
                  >
                    {word}{' '}
                  </span>
                )
              }

              // Links
              if (word.startsWith('http://') || word.startsWith('https://')) {
                return (
                  <a
                    key={wordIdx}
                    href={word}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0A66C2] dark:text-[#70b5f9] underline hover:text-[#004182]"
                  >
                    {word}{' '}
                  </a>
                )
              }

              return word + ' '
            })}
          </p>
        )
      })}
    </div>
  )
}
