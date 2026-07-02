import { beforeEach, describe, expect, it, vi } from 'vitest'

// createSignedUrl picks its storage client off the caller's trust context, not
// the operation. Inject a distinct fake for each client so we can assert which
// one signed for a given context: admin -> server client (drafts resolve),
// public -> anon client (RLS scopes to live listings).
vi.mock('server-only', () => ({}))

function makeFakeClient(label: string) {
  const createSignedUrl = vi.fn(async (key: string) => ({
    data: { signedUrl: `https://${label}.example/${key}` },
    error: null,
  }))
  return {
    client: { storage: { from: () => ({ createSignedUrl }) } },
    createSignedUrl,
  }
}

const anon = makeFakeClient('anon')
const server = makeFakeClient('server')

vi.mock('@/lib/db/anon-client', () => ({ anonClient: anon.client }))
vi.mock('@/lib/db/server-client', () => ({
  createServerClient: () => server.client,
}))

const { createSignedUrl } = await import('@/lib/db/storage')

beforeEach(() => {
  anon.createSignedUrl.mockClear()
  server.createSignedUrl.mockClear()
})

describe('createSignedUrl', () => {
  it('signs via the anon client in the public context', async () => {
    const url = await createSignedUrl('listing/x/a.jpg', 60, 'public')

    expect(url).toBe('https://anon.example/listing/x/a.jpg')
    expect(anon.createSignedUrl).toHaveBeenCalledWith('listing/x/a.jpg', 60)
    expect(server.createSignedUrl).not.toHaveBeenCalled()
  })

  it('signs via the server client in the admin context so drafts resolve', async () => {
    const url = await createSignedUrl('listing/x/a.jpg', 60, 'admin')

    expect(url).toBe('https://server.example/listing/x/a.jpg')
    expect(server.createSignedUrl).toHaveBeenCalledWith('listing/x/a.jpg', 60)
    expect(anon.createSignedUrl).not.toHaveBeenCalled()
  })
})
