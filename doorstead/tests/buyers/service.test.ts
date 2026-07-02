import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the DB seam so this suite tests DefaultBuyerService through its contract
// with no Supabase env: the shared builder records every query call and resolves
// to a preset result. This proves the mapping and guard logic, not RLS (that is
// proven against a real stack in supabase/verify-local-rls.mjs).
type Result = { data?: unknown; error: unknown }

const state: { result: Result; calls: unknown[][] } = {
  result: { data: [], error: null },
  calls: [],
}

const builder: unknown = new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
          Promise.resolve(state.result).then(resolve, reject)
      }
      return (...args: unknown[]) => {
        state.calls.push([prop, ...args])
        return builder
      }
    },
  },
)

vi.mock('@/lib/db/server-client', () => ({
  createServerClient: () => builder,
}))

const { DefaultBuyerService } = await import('@/lib/buyers/service')

const listingRow = {
  id: 'l1',
  address: '1 Main St',
  type: 'flat',
  price_gbp: 500000,
  beds: 2,
  baths: 1,
  area_sqft: 800,
  status: 'live',
  description: 'nice',
  photo_urls: ['a.jpg'],
  created_at: 't1',
  updated_at: 't2',
}

beforeEach(() => {
  state.result = { data: [], error: null }
  state.calls = []
})

describe('DefaultBuyerService.saveListing', () => {
  it('upserts the pair, ignoring duplicates on the unique constraint', async () => {
    await new DefaultBuyerService().saveListing('b1', 'l1')
    const upsert = state.calls.find((c) => c[0] === 'upsert')
    expect(upsert).toEqual([
      'upsert',
      { buyer_id: 'b1', listing_id: 'l1' },
      { onConflict: 'buyer_id,listing_id', ignoreDuplicates: true },
    ])
  })

  it('throws when the write errors', async () => {
    state.result = { error: new Error('boom') }
    await expect(new DefaultBuyerService().saveListing('b1', 'l1')).rejects.toThrow(
      'boom',
    )
  })
})

describe('DefaultBuyerService.unsaveListing', () => {
  it('deletes the pair scoped to the buyer and listing', async () => {
    state.result = { error: null }
    await new DefaultBuyerService().unsaveListing('b1', 'l1')
    expect(state.calls).toContainEqual(['delete'])
    expect(state.calls).toContainEqual(['eq', 'buyer_id', 'b1'])
    expect(state.calls).toContainEqual(['eq', 'listing_id', 'l1'])
  })

  it('throws when the delete errors', async () => {
    state.result = { error: new Error('boom') }
    await expect(
      new DefaultBuyerService().unsaveListing('b1', 'l1'),
    ).rejects.toThrow('boom')
  })
})

describe('DefaultBuyerService.savedListingIds', () => {
  it('short-circuits to an empty set without querying when given no ids', async () => {
    const result = await new DefaultBuyerService().savedListingIds('b1', [])
    expect(result).toEqual(new Set())
    expect(state.calls).toHaveLength(0)
  })

  it('returns the set of saved ids for the queried listings', async () => {
    state.result = {
      data: [{ listing_id: 'l1' }, { listing_id: 'l3' }],
      error: null,
    }
    const result = await new DefaultBuyerService().savedListingIds('b1', [
      'l1',
      'l2',
      'l3',
    ])
    expect(result).toEqual(new Set(['l1', 'l3']))
  })

  it('throws when the query errors', async () => {
    state.result = { data: null, error: new Error('boom') }
    await expect(
      new DefaultBuyerService().savedListingIds('b1', ['l1']),
    ).rejects.toThrow('boom')
  })
})

describe('DefaultBuyerService.listShortlist', () => {
  it('maps an available saved row to an entry carrying the listing', async () => {
    state.result = {
      data: [{ listing_id: 'l1', created_at: 's1', listings: listingRow }],
      error: null,
    }
    const [entry] = await new DefaultBuyerService().listShortlist('b1')
    expect(entry.listingId).toBe('l1')
    expect(entry.savedAt).toBe('s1')
    expect(entry.listing?.id).toBe('l1')
    expect(entry.listing?.photoUrls).toEqual(['a.jpg'])
  })

  it('keeps an unavailable saved row as an entry with a null listing (not dropped)', async () => {
    state.result = {
      data: [
        { listing_id: 'l1', created_at: 's1', listings: listingRow },
        { listing_id: 'l9', created_at: 's2', listings: null },
      ],
      error: null,
    }
    const entries = await new DefaultBuyerService().listShortlist('b1')
    expect(entries).toHaveLength(2)
    expect(entries[1]).toEqual({
      listingId: 'l9',
      savedAt: 's2',
      listing: null,
    })
  })

  it('throws when the query errors', async () => {
    state.result = { data: null, error: new Error('boom') }
    await expect(new DefaultBuyerService().listShortlist('b1')).rejects.toThrow(
      'boom',
    )
  })
})
