import { describe, expect, it } from 'vitest'
import { resolveHeaderSession } from '@/lib/auth/public-session'

const session = { userId: 'u1', email: 'buyer@example.com' }

describe('resolveHeaderSession', () => {
  it('returns null when there is no session', () => {
    expect(resolveHeaderSession(null, false)).toBeNull()
  })

  it('returns null when the session belongs to an admin', () => {
    expect(resolveHeaderSession(session, true)).toBeNull()
  })

  it('returns the session for a signed-in non-admin', () => {
    expect(resolveHeaderSession(session, false)).toEqual(session)
  })
})
