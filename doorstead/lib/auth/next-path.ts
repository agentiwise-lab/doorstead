const FALLBACK = '/shortlist'
const TRUSTED_ORIGIN = 'https://doorstead.internal'

function containsControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) <= 0x1f) return true
  }
  return false
}

export function sanitizeNextPath(
  raw: string | string[] | null | undefined
): string {
  // The App Router delivers a repeated query key (e.g. `?next=/a&next=/b`) as
  // string[] instead of string. Collapse to the first value up front so every
  // check below can keep assuming a plain string.
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return FALLBACK
  // The WHATWG URL parser silently strips ASCII tab/CR/LF before parsing, so a
  // value like "/\t/evil.com" passes every string-prefix check below (it
  // "starts with /", not "//") yet resolves to a different origin once
  // next/server's `new URL()` parses it. Reject control characters outright,
  // then re-verify by actually resolving the URL rather than trusting prefix
  // checks alone.
  if (containsControlCharacter(value)) return FALLBACK
  if (!value.startsWith('/')) return FALLBACK
  if (value.startsWith('//')) return FALLBACK
  if (value.includes('\\')) return FALLBACK

  let resolved: URL
  try {
    resolved = new URL(value, TRUSTED_ORIGIN)
  } catch {
    return FALLBACK
  }
  if (resolved.origin !== TRUSTED_ORIGIN) return FALLBACK

  return value
}
