import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/auth/service', () => ({
  authService: {
    exchangeCodeForSession: vi.fn(),
  },
}))

const { GET } = await import('@/app/auth/callback/route')
const { authService } = await import('@/lib/auth/service')

beforeEach(() => {
  vi.mocked(authService.exchangeCodeForSession).mockReset()
})

describe('GET /auth/callback', () => {
  it('redirects to /sign-in and never calls exchangeCodeForSession when code is missing', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback')
    const response = await GET(request)

    const location = response.headers.get('location')
    expect(location).toBeTruthy()
    expect(new URL(location!).pathname).toBe('/sign-in')
    expect(authService.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('redirects to /sign-in when exchangeCodeForSession resolves false', async () => {
    vi.mocked(authService.exchangeCodeForSession).mockResolvedValue(false)
    const request = new NextRequest('http://localhost:3000/auth/callback?code=abc')
    const response = await GET(request)

    expect(new URL(response.headers.get('location')!).pathname).toBe('/sign-in')
  })

  it('redirects to /shortlist when exchange succeeds and no next param is given', async () => {
    vi.mocked(authService.exchangeCodeForSession).mockResolvedValue(true)
    const request = new NextRequest('http://localhost:3000/auth/callback?code=abc')
    const response = await GET(request)

    expect(new URL(response.headers.get('location')!).pathname).toBe('/shortlist')
  })

  it('redirects to /shortlist when next is a different-origin absolute URL', async () => {
    vi.mocked(authService.exchangeCodeForSession).mockResolvedValue(true)
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=abc&next=' +
        encodeURIComponent('http://evil.com'),
    )
    const response = await GET(request)

    expect(new URL(response.headers.get('location')!).pathname).toBe('/shortlist')
  })

  it('redirects to the sanitized next path when exchange succeeds', async () => {
    vi.mocked(authService.exchangeCodeForSession).mockResolvedValue(true)
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=abc&next=' +
        encodeURIComponent('/listing/abc'),
    )
    const response = await GET(request)

    expect(new URL(response.headers.get('location')!).pathname).toBe('/listing/abc')
  })

  it('redirects to /shortlist when next contains a tab character the URL parser would otherwise strip into a protocol-relative bypass', async () => {
    vi.mocked(authService.exchangeCodeForSession).mockResolvedValue(true)
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=abc&next=' +
        encodeURIComponent('/\t/evil.com'),
    )
    const response = await GET(request)

    const location = response.headers.get('location')!
    expect(new URL(location).pathname).toBe('/shortlist')
    expect(new URL(location).hostname).toBe('localhost')
  })
})
