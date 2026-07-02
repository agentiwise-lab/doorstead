const FALLBACK = '/shortlist'
const TRUSTED_ORIGIN = 'https://doorstead.internal'

function containsControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) <= 0x1f) return true
  }
  return false
}

export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return FALLBACK
  // The WHATWG URL parser silently strips ASCII tab/CR/LF before parsing, so a
  // value like "/\t/evil.com" passes every string-prefix check below (it
  // "starts with /", not "//") yet resolves to a different origin once
  // next/server's `new URL()` parses it. Reject control characters outright,
  // then re-verify by actually resolving the URL rather than trusting prefix
  // checks alone.
  if (containsControlCharacter(raw)) return FALLBACK
  if (!raw.startsWith('/')) return FALLBACK
  if (raw.startsWith('//')) return FALLBACK
  if (raw.includes('\\')) return FALLBACK

  let resolved: URL
  try {
    resolved = new URL(raw, TRUSTED_ORIGIN)
  } catch {
    return FALLBACK
  }
  if (resolved.origin !== TRUSTED_ORIGIN) return FALLBACK

  return raw
}
