import { beforeEach, describe, expect, it, vi } from 'vitest'

// listForListing reads the listing_media table through the client that matches
// the caller's trust context: public -> anon client (honours the
// listing_media_public_read anon policy, scoped to live listings), admin ->
// server client (drafts resolve). Never mix clients across contexts.
vi.mock('server-only', () => ({}))

function makeFakeTableClient(label: string) {
  const order = vi.fn(async () => ({ data: [], error: null }))
  const eq = vi.fn(() => ({ order }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  return { client: { from }, from, label }
}

const anon = makeFakeTableClient('anon')
const server = makeFakeTableClient('server')

vi.mock('@/lib/db/anon-client', () => ({ anonClient: anon.client }))
vi.mock('@/lib/db/server-client', () => ({
  createServerClient: () => server.client,
}))
vi.mock('@/lib/db/storage', () => ({ uploadObject: vi.fn() }))

const { DefaultMediaService } = await import('@/lib/media/service')

beforeEach(() => {
  anon.from.mockClear()
  server.from.mockClear()
})

describe('DefaultMediaService.listForListing', () => {
  it('reads via the anon client in the public context', async () => {
    await new DefaultMediaService().listForListing('listing-1', 'public')

    expect(anon.from).toHaveBeenCalledWith('listing_media')
    expect(server.from).not.toHaveBeenCalled()
  })

  it('reads via the server client in the admin context', async () => {
    await new DefaultMediaService().listForListing('listing-1', 'admin')

    expect(server.from).toHaveBeenCalledWith('listing_media')
    expect(anon.from).not.toHaveBeenCalled()
  })
})
