import { beforeEach, describe, expect, it, vi } from 'vitest'

type ClientState = {
  user: { id: string; email: string } | null
  getUserErrors: boolean
  adminRow: { user_id: string } | null
  adminErrors: boolean
  exchangeErrors: boolean
  signInWithOAuthErrors: boolean
  lastSignInWithOAuthCredentials: unknown
  exchangeCodeForSessionCalls: number
}

const state: ClientState = {
  user: null,
  getUserErrors: false,
  adminRow: null,
  adminErrors: false,
  exchangeErrors: false,
  signInWithOAuthErrors: false,
  lastSignInWithOAuthCredentials: null,
  exchangeCodeForSessionCalls: 0,
}

vi.mock('server-only', () => ({}))

const headerState: { host: string | null; proto: string | null } = {
  host: 'doorstead.example',
  proto: 'https',
}

vi.mock('next/headers', () => ({
  headers: () => ({
    get: (name: string) => {
      if (name === 'host') return headerState.host
      if (name === 'x-forwarded-proto') return headerState.proto
      return null
    },
  }),
}))

vi.mock('@/lib/db/server-client', () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => {
        if (state.getUserErrors) {
          return { data: { user: null }, error: new Error('boom') }
        }
        return { data: { user: state.user }, error: null }
      },
      exchangeCodeForSession: async () => {
        state.exchangeCodeForSessionCalls += 1
        if (state.exchangeErrors) {
          return { error: new Error('boom') }
        }
        return { error: null }
      },
      signInWithOAuth: async (credentials: unknown) => {
        state.lastSignInWithOAuthCredentials = credentials
        if (state.signInWithOAuthErrors) {
          return { data: { url: null }, error: new Error('boom') }
        }
        return { data: { url: 'https://accounts.google.com/o/oauth2/auth' }, error: null }
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (state.adminErrors) {
              return { data: null, error: new Error('boom') }
            }
            return { data: state.adminRow, error: null }
          },
        }),
      }),
    }),
  }),
}))

const { DefaultAuthService } = await import('@/lib/auth/service')

beforeEach(() => {
  state.user = null
  state.getUserErrors = false
  state.adminRow = null
  state.adminErrors = false
  state.exchangeErrors = false
  state.signInWithOAuthErrors = false
  state.lastSignInWithOAuthCredentials = null
  state.exchangeCodeForSessionCalls = 0
  headerState.host = 'doorstead.example'
  headerState.proto = 'https'
})

describe('requireBuyer', () => {
  it('rejects with no session', async () => {
    const service = new DefaultAuthService()
    await expect(service.requireBuyer()).rejects.toThrow('Unauthorized')
  })

  it('rejects when the caller is an admin', async () => {
    state.user = { id: 'u1', email: 'admin@example.com' }
    state.adminRow = { user_id: 'u1' }
    const service = new DefaultAuthService()
    await expect(service.requireBuyer()).rejects.toThrow('Unauthorized')
  })

  it('fails closed when the admin-membership check errors', async () => {
    state.user = { id: 'u1', email: 'buyer@example.com' }
    state.adminErrors = true
    const service = new DefaultAuthService()
    await expect(service.requireBuyer()).rejects.toThrow('Unauthorized')
  })

  it('resolves with the session for a signed-in non-admin', async () => {
    state.user = { id: 'u1', email: 'buyer@example.com' }
    state.adminRow = null
    const service = new DefaultAuthService()
    await expect(service.requireBuyer()).resolves.toEqual({
      userId: 'u1',
      email: 'buyer@example.com',
    })
  })
})

describe('requireAdmin (regression)', () => {
  it('rejects with no session', async () => {
    const service = new DefaultAuthService()
    await expect(service.requireAdmin()).rejects.toThrow('Unauthorized')
  })

  it('rejects a confirmed non-admin', async () => {
    state.user = { id: 'u1', email: 'buyer@example.com' }
    state.adminRow = null
    const service = new DefaultAuthService()
    await expect(service.requireAdmin()).rejects.toThrow('Unauthorized')
  })

  it('fails closed when the admin-membership check errors', async () => {
    state.user = { id: 'u1', email: 'buyer@example.com' }
    state.adminErrors = true
    const service = new DefaultAuthService()
    await expect(service.requireAdmin()).rejects.toThrow('Unauthorized')
  })

  it('resolves for a confirmed admin', async () => {
    state.user = { id: 'u1', email: 'admin@example.com' }
    state.adminRow = { user_id: 'u1' }
    const service = new DefaultAuthService()
    await expect(service.requireAdmin()).resolves.toEqual({
      userId: 'u1',
      email: 'admin@example.com',
    })
  })
})

describe('isAdmin', () => {
  it('returns true when an admin row is present', async () => {
    state.adminRow = { user_id: 'u1' }
    const service = new DefaultAuthService()
    await expect(service.isAdmin('u1')).resolves.toBe(true)
  })

  it('returns false when no admin row is present', async () => {
    state.adminRow = null
    const service = new DefaultAuthService()
    await expect(service.isAdmin('u1')).resolves.toBe(false)
  })

  it('throws when the underlying query errors', async () => {
    state.adminErrors = true
    const service = new DefaultAuthService()
    await expect(service.isAdmin('u1')).rejects.toThrow()
  })
})

describe('exchangeCodeForSession', () => {
  it('returns false for an empty code without calling Supabase', async () => {
    const service = new DefaultAuthService()
    await expect(service.exchangeCodeForSession('')).resolves.toBe(false)
    expect(state.exchangeCodeForSessionCalls).toBe(0)
  })

  it('returns false when Supabase errors', async () => {
    state.exchangeErrors = true
    const service = new DefaultAuthService()
    await expect(service.exchangeCodeForSession('abc')).resolves.toBe(false)
  })

  it('returns true on success', async () => {
    state.exchangeErrors = false
    const service = new DefaultAuthService()
    await expect(service.exchangeCodeForSession('abc')).resolves.toBe(true)
  })
})

describe('getGoogleSignInUrl', () => {
  it('throws when Supabase signInWithOAuth returns an error', async () => {
    state.signInWithOAuthErrors = true
    const service = new DefaultAuthService()
    await expect(service.getGoogleSignInUrl('/shortlist')).rejects.toThrow()
  })

  it('returns the URL Supabase provides', async () => {
    const service = new DefaultAuthService()
    await expect(service.getGoogleSignInUrl('/shortlist')).resolves.toBe(
      'https://accounts.google.com/o/oauth2/auth',
    )
  })

  it('builds the redirectTo from the host and x-forwarded-proto headers, with the sanitized next path encoded', async () => {
    headerState.host = 'doorstead.example'
    headerState.proto = 'https'
    const service = new DefaultAuthService()

    await service.getGoogleSignInUrl('/listing/abc')

    const credentials = state.lastSignInWithOAuthCredentials as {
      provider: string
      options: { redirectTo: string }
    }
    expect(credentials.provider).toBe('google')
    expect(credentials.options.redirectTo).toBe(
      'https://doorstead.example/auth/callback?next=%2Flisting%2Fabc',
    )
  })

  it('falls back to http when the host looks like localhost and no proto header is present', async () => {
    headerState.host = 'localhost:3000'
    headerState.proto = null
    const service = new DefaultAuthService()

    await service.getGoogleSignInUrl('/shortlist')

    const credentials = state.lastSignInWithOAuthCredentials as {
      options: { redirectTo: string }
    }
    expect(credentials.options.redirectTo).toBe(
      'http://localhost:3000/auth/callback?next=%2Fshortlist',
    )
  })

  it('falls back to https when the host is not localhost and no proto header is present', async () => {
    headerState.host = 'doorstead.example'
    headerState.proto = null
    const service = new DefaultAuthService()

    await service.getGoogleSignInUrl('/shortlist')

    const credentials = state.lastSignInWithOAuthCredentials as {
      options: { redirectTo: string }
    }
    expect(credentials.options.redirectTo).toBe(
      'https://doorstead.example/auth/callback?next=%2Fshortlist',
    )
  })

  it('falls back to localhost:3000 when no host header is present', async () => {
    headerState.host = null
    headerState.proto = null
    const service = new DefaultAuthService()

    await service.getGoogleSignInUrl('/shortlist')

    const credentials = state.lastSignInWithOAuthCredentials as {
      options: { redirectTo: string }
    }
    expect(credentials.options.redirectTo).toBe(
      'http://localhost:3000/auth/callback?next=%2Fshortlist',
    )
  })
})
