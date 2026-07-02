import { beforeEach, describe, expect, it, vi } from 'vitest'

// AGE-125: reorder must yield distinct, contiguous positions across the FULL
// stored set, not just the visible tiles passed in orderedImageIds. A row that
// was hidden from the admin grid (e.g. its thumbnail failed to sign) is still in
// listing_media; if reorder only rewrites the passed subset, that hidden row
// keeps its stale position and two rows collide.
//
// Driven at the DB boundary: the server client is faked to expose the full
// stored order via select, and we assert the writes cover every id 0..n-1.
vi.mock('server-only', () => ({}))

type UpdatePayload = Record<string, unknown>
type Filter = { column: string; value: unknown }
type UpdateOp = { payload: UpdatePayload; filters: Filter[] }

let updateOps: UpdateOp[] = []
// The full stored set, in current position order. Includes a hidden row 'x'
// that the caller does not pass to reorder.
let storedRows: Array<{ id: string }> = []

function makeServerClient() {
  const from = vi.fn((_table: string) => {
    const update = (payload: UpdatePayload) => {
      const op: UpdateOp = { payload, filters: [] }
      updateOps.push(op)
      const chain = {
        eq: (column: string, value: unknown) => {
          op.filters.push({ column, value })
          return chain
        },
      }
      return Object.assign(chain, Promise.resolve({ data: null, error: null }))
    }
    // reorder reads the full set first: from().select().eq().order().order()
    const select = (_columns: string) => {
      const result = Promise.resolve({ data: storedRows, error: null })
      const chain = {
        eq: () => chain,
        order: () => chain,
        then: result.then.bind(result),
        catch: result.catch.bind(result),
        finally: result.finally.bind(result),
      }
      return chain
    }
    return { update, select }
  })
  return { from }
}

let serverClient = makeServerClient()
vi.mock('@/lib/db/anon-client', () => ({ anonClient: {} }))
vi.mock('@/lib/db/server-client', () => ({
  createServerClient: () => serverClient,
}))
vi.mock('@/lib/db/storage', () => ({ uploadObject: vi.fn() }))

const { DefaultMediaService } = await import('@/lib/media/service')

const LISTING = 'listing-1'

beforeEach(() => {
  updateOps = []
  // Full stored order: a, b, c, then a hidden row x the admin grid never shows.
  storedRows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'x' }]
  serverClient = makeServerClient()
})

describe('DefaultMediaService.reorder (full stored set)', () => {
  it('assigns distinct, contiguous positions across every stored row, appending hidden rows', async () => {
    // Caller reorders only the visible tiles, in a new order, unaware of x.
    await new DefaultMediaService().reorder(LISTING, ['c', 'a', 'b'])

    // Every write is scoped to the listing and one id.
    const byId = updateOps.map((op) => ({
      id: op.filters.find((f) => f.column === 'id')?.value,
      position: (op.payload as { position: number }).position,
    }))

    // The hidden row must be included and every row gets a distinct, contiguous
    // position 0..n-1 with no collisions.
    expect(byId).toEqual([
      { id: 'c', position: 0 },
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
      { id: 'x', position: 3 },
    ])

    const positions = byId.map((r) => r.position)
    expect(new Set(positions).size).toBe(positions.length)
    expect(positions).toEqual([0, 1, 2, 3])
  })
})
