import { describe, expect, it } from 'vitest'

import { config } from '@/middleware'

// The matcher decides which routes get a session-cookie refresh. If it misses
// the buyer routes, an authenticated buyer's rotated refresh token is never
// written back and they are silently signed out at the JWT TTL. These assert
// the matcher covers authenticated routes and skips static assets. A Next
// matcher string compiles to a path regex; testing it as one is a faithful
// proxy for "does this path get the middleware."
const matches = (path: string): boolean =>
  config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path))

describe('middleware matcher', () => {
  it('covers admin routes', () => {
    expect(matches('/admin')).toBe(true)
    expect(matches('/admin/listings/new')).toBe(true)
  })

  it('covers buyer routes so their sessions refresh', () => {
    expect(matches('/shortlist')).toBe(true)
    expect(matches('/my-inquiries')).toBe(true)
    expect(matches('/sign-in')).toBe(true)
  })

  it('covers the public routes that render per-user saved state', () => {
    expect(matches('/')).toBe(true)
    expect(matches('/listing/abc-123')).toBe(true)
  })

  it('skips Next internals and static assets', () => {
    expect(matches('/_next/static/chunk.js')).toBe(false)
    expect(matches('/_next/image')).toBe(false)
    expect(matches('/favicon.ico')).toBe(false)
    expect(matches('/logo.svg')).toBe(false)
    expect(matches('/photo.png')).toBe(false)
  })
})
