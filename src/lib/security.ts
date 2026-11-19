/**
 * Security utilities for DraftIn SaaS.
 * Enforces strict redirect validation, protocol injection prevention, and input sanitization.
 */

const ALLOWED_REDIRECT_PREFIXES = ['/app', '/admin']

/**
 * Validates and sanitizes redirect destinations (prevents Open Redirect vulnerabilities).
 * Only relative URLs starting with allowed prefixes are permitted.
 * Rejects protocol-relative URLs, schemes, backslashes, and domain traversals.
 */
export function validateRedirectUrl(
  url: string | null | undefined,
  fallback = '/app'
): string {
  if (!url || typeof url !== 'string') {
    return fallback
  }

  const trimmed = url.trim()

  // 1. Must start with a single slash, never double slash or backslash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback
  }

  // 2. Reject absolute schemes (e.g. javascript:, http:, https:, data:)
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
    return fallback
  }

  // 3. Reject backslashes anywhere in path
  if (trimmed.includes('\\')) {
    return fallback
  }

  // 4. Must match allowed prefixes (/app or /admin)
  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`) || trimmed.startsWith(`${prefix}?`)
  )

  if (!isAllowed) {
    return fallback
  }

  return trimmed
}

/**
 * Strips dangerous HTML script or iframe tags from untrusted strings.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
}
