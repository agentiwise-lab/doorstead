import { describe, expect, it } from 'vitest'
import { isSafeRelativePath, sanitizeNextPath } from '@/lib/auth/next-path'

describe('sanitizeNextPath', () => {
  it('passes through a plain relative path unchanged', () => {
    expect(sanitizeNextPath('/admin')).toBe('/admin')
  })

  it('falls back to /shortlist for an empty string', () => {
    expect(sanitizeNextPath('')).toBe('/shortlist')
  })

  it('falls back to /shortlist for null', () => {
    expect(sanitizeNextPath(null)).toBe('/shortlist')
  })

  it('falls back to /shortlist for undefined', () => {
    expect(sanitizeNextPath(undefined)).toBe('/shortlist')
  })

  it('falls back to /shortlist for an absolute URL', () => {
    expect(sanitizeNextPath('http://evil.com')).toBe('/shortlist')
  })

  it('falls back to /shortlist for a protocol-relative URL', () => {
    expect(sanitizeNextPath('//evil.com')).toBe('/shortlist')
  })

  it('falls back to /shortlist for a leading-backslash variant', () => {
    expect(sanitizeNextPath('/\\evil.com')).toBe('/shortlist')
  })

  it('falls back to /shortlist for a double-backslash variant', () => {
    expect(sanitizeNextPath('\\\\evil.com')).toBe('/shortlist')
  })

  it('passes through a path with a query string and hash unchanged', () => {
    expect(sanitizeNextPath('/listing/abc?x=1')).toBe('/listing/abc?x=1')
  })

  it('falls back to /shortlist for a tab-character bypass that the URL parser would strip into a protocol-relative URL', () => {
    expect(sanitizeNextPath('/\t/evil.com')).toBe('/shortlist')
  })

  it('falls back to /shortlist for a newline-character bypass', () => {
    expect(sanitizeNextPath('/\n/evil.com')).toBe('/shortlist')
  })

  it('falls back to /shortlist for a carriage-return bypass', () => {
    expect(sanitizeNextPath('/\r/evil.com')).toBe('/shortlist')
  })

  it('uses the first value when the App Router delivers a repeated query key as string[]', () => {
    expect(sanitizeNextPath(['/admin', '/other'])).toBe('/admin')
  })

  it('falls back to /shortlist for an empty array', () => {
    expect(sanitizeNextPath([])).toBe('/shortlist')
  })

  it('falls back to /shortlist when the first array value is unsafe', () => {
    expect(sanitizeNextPath(['http://evil.com', '/admin'])).toBe('/shortlist')
  })
})

describe('isSafeRelativePath', () => {
  it('accepts a valid same-origin relative path', () => {
    expect(isSafeRelativePath('/listing/abc')).toBe(true)
  })

  it('rejects a protocol-relative path', () => {
    expect(isSafeRelativePath('//evil.com')).toBe(false)
  })

  it('rejects a backslash-prefixed bypass attempt', () => {
    expect(isSafeRelativePath('/\\evil.com')).toBe(false)
  })

  it('rejects a path containing a control character', () => {
    expect(isSafeRelativePath('/\t/evil.com')).toBe(false)
  })
})
