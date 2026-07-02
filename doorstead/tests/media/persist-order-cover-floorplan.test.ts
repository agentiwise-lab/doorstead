import { beforeEach, describe, expect, it, vi } from 'vitest'

// The mutating writes go through the server client (authenticated-admin RLS).
// Fake the client at the DB boundary and assert the writes the contract
// promises: reorder updates each row's position, setCover/setFloorplan clear
// the previous flag then set the target, remove deletes the row.
vi.mock('server-only', () => ({}))

type UpdatePayload = Record<string, unknown>
type Filter = { column: string; value: unknown }
type UpdateOp = { payload: UpdatePayload; filters: Filter[] }
type DeleteOp = { filters: Filter[] }

let updateOps: UpdateOp[] = []
let deleteOps: DeleteOp[] = []

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
      // Awaiting the chain resolves the write (Supabase builders are thenable).
      return Object.assign(
        chain,
        Promise.resolve({ data: null, error: null }),
      )
    }
    const del = () => {
      const op: DeleteOp = { filters: [] }
      deleteOps.push(op)
      const chain = {
        eq: (column: string, value: unknown) => {
          op.filters.push({ column, value })
          return chain
        },
      }
      return Object.assign(
        chain,
        Promise.resolve({ data: null, error: null }),
      )
    }
    return { update, delete: del }
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
  deleteOps = []
  serverClient = makeServerClient()
})

describe('DefaultMediaService.reorder', () => {
  it('writes each image its new position, scoped to the listing', async () => {
    await new DefaultMediaService().reorder(LISTING, ['c', 'a', 'b'])

    expect(updateOps).toEqual([
      { payload: { position: 0 }, filters: [{ column: 'listing_id', value: LISTING }, { column: 'id', value: 'c' }] },
      { payload: { position: 1 }, filters: [{ column: 'listing_id', value: LISTING }, { column: 'id', value: 'a' }] },
      { payload: { position: 2 }, filters: [{ column: 'listing_id', value: LISTING }, { column: 'id', value: 'b' }] },
    ])
  })
})

describe('DefaultMediaService.setCover', () => {
  it('clears every cover on the listing, then sets the target', async () => {
    await new DefaultMediaService().setCover(LISTING, 'b')

    expect(updateOps).toEqual([
      { payload: { is_cover: false }, filters: [{ column: 'listing_id', value: LISTING }] },
      { payload: { is_cover: true }, filters: [{ column: 'listing_id', value: LISTING }, { column: 'id', value: 'b' }] },
    ])
  })
})

describe('DefaultMediaService.setFloorplan', () => {
  it('clears every floorplan on the listing, then sets the target', async () => {
    await new DefaultMediaService().setFloorplan(LISTING, 'b')

    expect(updateOps).toEqual([
      { payload: { is_floorplan: false }, filters: [{ column: 'listing_id', value: LISTING }] },
      { payload: { is_floorplan: true }, filters: [{ column: 'listing_id', value: LISTING }, { column: 'id', value: 'b' }] },
    ])
  })
})

describe('DefaultMediaService.removeImage', () => {
  it('deletes the row scoped to listing and image id', async () => {
    await new DefaultMediaService().removeImage(LISTING, 'b')

    expect(deleteOps).toEqual([
      { filters: [{ column: 'listing_id', value: LISTING }, { column: 'id', value: 'b' }] },
    ])
  })
})
