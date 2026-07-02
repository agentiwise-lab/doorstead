import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { escapeForIlike } = await import('@/lib/inquiries/service')

describe('escapeForIlike', () => {
  it('escapes a percent sign so it is matched literally, not as a wildcard', () => {
    expect(escapeForIlike('50%off@example.com')).toBe('50\\%off@example.com')
  })

  it('escapes an underscore so it is matched literally, not as a single-char wildcard', () => {
    expect(escapeForIlike('a_b@example.com')).toBe('a\\_b@example.com')
  })

  it('escapes a backslash so it does not alter the meaning of an adjacent escape', () => {
    expect(escapeForIlike('a\\b@example.com')).toBe('a\\\\b@example.com')
  })

  it('escapes multiple special characters in the same value', () => {
    expect(escapeForIlike('a_b%c\\d@example.com')).toBe(
      'a\\_b\\%c\\\\d@example.com',
    )
  })

  it('leaves a value with no special characters unchanged', () => {
    expect(escapeForIlike('jane@example.com')).toBe('jane@example.com')
  })
})
