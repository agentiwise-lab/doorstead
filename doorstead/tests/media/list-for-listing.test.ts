import { beforeEach, describe, expect, it, vi } from 'vitest'

// listForListing reads the listing_media table through the client that matches
// the caller's trust context: public -> anon client (honours the
// listing_media_public_read anon policy, scoped to live listings), admin ->
// server client (drafts resolve). Never mix clients across contexts.
vi.mock('server-only', () => ({}))

function makeFakeTableClient(label: string) {
  const orderCalls: { col: string; ascending: boolean | undefined }[] = []
  // `.order()` is both chainable (returns itself) and awaitable (resolves to a
  // Supabase-shaped result), so a two-key sort reads as `.order().order()`.
  const orderable = {
    order: vi.fn((col: string, opts?: { ascending?: boolean }) => {
      orderCalls.push({ col, ascending: opts?.ascending })
      return orderable
    }),
    then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
      resolve({ data: [], error: null }),
  }
  const eq = vi.fn(() => orderable)
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  return { client: { from }, from, orderCalls, label }
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
  anon.orderCalls.length = 0
  server.orderCalls.length = 0
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

  it('orders by position, then created_at as a stable tiebreaker', async () => {
    // Newly uploaded images all share position 0 (the column default). Without a
    // second sort key they come back in arbitrary order, so the cover fallback
    // and gallery order flip between reloads. created_at makes it upload order.
    await new DefaultMediaService().listForListing('listing-1', 'admin')

    expect(server.orderCalls).toEqual([
      { col: 'position', ascending: true },
      { col: 'created_at', ascending: true },
    ])
  })
})
