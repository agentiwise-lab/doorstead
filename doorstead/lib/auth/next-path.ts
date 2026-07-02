const FALLBACK = '/shortlist'
const TRUSTED_ORIGIN = 'https://doorstead.internal'

function containsControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) <= 0x1f) return true
  }
  return false
}

// Same-origin relative-path check, reused by every redirect-after-action spot
// in the app (sign-in's `next`, buyer save/unsave's `redirectTo`). The WHATWG
// URL parser silently strips ASCII tab/CR/LF before parsing and treats `\`
// as `/` for special schemes, so a value like "/\t/evil.com" or "/\evil.com"
// passes a naive "starts with / but not //" check yet resolves to a
// different origin once next/server's `new URL()` parses it. Reject control
// characters and backslashes outright, then re-verify by actually resolving
// the URL rather than trusting prefix checks alone.
export function isSafeRelativePath(value: string): boolean {
  if (containsControlCharacter(value)) return false
  if (!value.startsWith('/')) return false
  if (value.startsWith('//')) return false
  if (value.includes('\\')) return false

  let resolved: URL
  try {
    resolved = new URL(value, TRUSTED_ORIGIN)
  } catch {
    return false
  }
  return resolved.origin === TRUSTED_ORIGIN
}

export function sanitizeNextPath(
  raw: string | string[] | null | undefined
): string {
  // The App Router delivers a repeated query key (e.g. `?next=/a&next=/b`) as
  // string[] instead of string. Collapse to the first value up front so every
  // check below can keep assuming a plain string.
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return FALLBACK
  return isSafeRelativePath(value) ? value : FALLBACK
}
