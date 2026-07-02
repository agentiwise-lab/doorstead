import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    const err = new Error(`NEXT_REDIRECT:${path}`)
    ;(err as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${path};307;`
    throw err
  }),
}))

vi.mock('@/lib/auth/service', () => ({
  authService: {
    getGoogleSignInUrl: vi.fn(async (nextPath: string) => {
      lastNextPath = nextPath
      return 'https://accounts.google.com/o/oauth2/auth?state=abc'
    }),
    signOut: vi.fn(async () => {
      signOutCalls += 1
    }),
  },
}))

let lastNextPath = ''
let signOutCalls = 0

const { signInWithGoogle, logout, buyerLogout } = await import('@/lib/auth/actions')
const { redirect } = await import('next/navigation')
const { authService } = await import('@/lib/auth/service')

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.append(k, v)
  return fd
}

beforeEach(() => {
  lastNextPath = ''
  signOutCalls = 0
  vi.mocked(redirect).mockClear()
  vi.mocked(authService.getGoogleSignInUrl).mockClear()
  vi.mocked(authService.signOut).mockClear()
})

describe('signInWithGoogle', () => {
  it('sanitizes the submitted next path before requesting the sign-in URL', async () => {
    const fd = makeFormData({ next: 'http://evil.com' })

    await expect(signInWithGoogle(fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(lastNextPath).toBe('/shortlist')
  })

  it('passes a legitimate relative next path through unchanged', async () => {
    const fd = makeFormData({ next: '/listing/abc' })

    await expect(signInWithGoogle(fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(lastNextPath).toBe('/listing/abc')
  })

  it('redirects to the URL returned by getGoogleSignInUrl', async () => {
    const fd = makeFormData({ next: '/shortlist' })

    await expect(signInWithGoogle(fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/auth?state=abc',
    )
  })
})

describe('logout', () => {
  it('signs the session out before redirecting', async () => {
    await expect(logout()).rejects.toThrow(/NEXT_REDIRECT/)

    expect(signOutCalls).toBe(1)
  })

  it('redirects to the admin login', async () => {
    await expect(logout()).rejects.toThrow(/NEXT_REDIRECT/)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin/login')
  })
})

describe('buyerLogout', () => {
  it('signs the session out before redirecting', async () => {
    await expect(buyerLogout()).rejects.toThrow(/NEXT_REDIRECT/)

    expect(signOutCalls).toBe(1)
  })

  it('redirects to the public home', async () => {
    await expect(buyerLogout()).rejects.toThrow(/NEXT_REDIRECT/)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/')
  })
})
