import { describe, expect, it } from 'vitest'
import {
  resolveHeaderSession,
  resolveHeaderSessionFor,
} from '@/lib/auth/public-session'

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

describe('resolveHeaderSessionFor', () => {
  it('returns null when there is no session', async () => {
    expect(await resolveHeaderSessionFor(null, async () => false)).toBeNull()
  })

  it('returns null for an admin session', async () => {
    expect(await resolveHeaderSessionFor(session, async () => true)).toBeNull()
  })

  it('returns the session for a non-admin', async () => {
    expect(await resolveHeaderSessionFor(session, async () => false)).toEqual(
      session,
    )
  })

  it('keeps the buyer session when the admin check errors (does not alias error to admin)', async () => {
    expect(
      await resolveHeaderSessionFor(session, async () => {
        throw new Error('boom')
      }),
    ).toEqual(session)
  })
})
