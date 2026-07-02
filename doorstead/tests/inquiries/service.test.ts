import { beforeEach, describe, expect, it, vi } from 'vitest'
import { escapeForIlike } from '@/lib/inquiries/ilike'

// Mock both DB seams so this suite tests DefaultInquiryService through its
// contract with no Supabase env. The shared builder records every query call
// and resolves to a preset result. RLS (inquiries_buyer_read) is proven against
// a real stack in supabase/verify-local-rls-inquiries-buyer-read.mjs.
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

vi.mock('@/lib/db/anon-client', () => ({ anonClient: builder }))
vi.mock('@/lib/db/server-client', () => ({ createServerClient: () => builder }))

const { DefaultInquiryService } = await import('@/lib/inquiries/service')

const row = {
  id: 'i1',
  listing_id: 'l1',
  name: 'Jane',
  email: 'jane@example.com',
  phone: '123',
  created_at: 't1',
  listings: { address: '1 Main St' },
}

beforeEach(() => {
  state.result = { data: [], error: null }
  state.calls = []
})

describe('DefaultInquiryService.create', () => {
  it('inserts through the anon client without selecting the row back', async () => {
    state.result = { error: null }
    await new DefaultInquiryService().create({
      listingId: 'l1',
      name: 'Jane',
      email: 'jane@example.com',
      phone: '123',
    })
    expect(state.calls).toContainEqual([
      'insert',
      { listing_id: 'l1', name: 'Jane', email: 'jane@example.com', phone: '123' },
    ])
    expect(state.calls.find((c) => c[0] === 'select')).toBeUndefined()
  })

  it('throws when the insert errors', async () => {
    state.result = { error: new Error('boom') }
    await expect(
      new DefaultInquiryService().create({
        listingId: 'l1',
        name: 'Jane',
        email: 'jane@example.com',
        phone: '123',
      }),
    ).rejects.toThrow('boom')
  })
})

describe('DefaultInquiryService.listAll', () => {
  it('maps rows to InquiryWithListing, flattening the joined address', async () => {
    state.result = { data: [row], error: null }
    const [inquiry] = await new DefaultInquiryService().listAll()
    expect(inquiry).toEqual({
      id: 'i1',
      listingId: 'l1',
      name: 'Jane',
      email: 'jane@example.com',
      phone: '123',
      createdAt: 't1',
      listingAddress: '1 Main St',
    })
  })

  it('throws when the query errors', async () => {
    state.result = { data: null, error: new Error('boom') }
    await expect(new DefaultInquiryService().listAll()).rejects.toThrow('boom')
  })
})

describe('DefaultInquiryService.listForBuyer', () => {
  it('filters by the ilike-escaped email so wildcards match literally', async () => {
    state.result = { data: [], error: null }
    await new DefaultInquiryService().listForBuyer('a_b@example.com')
    expect(state.calls).toContainEqual([
      'ilike',
      'email',
      escapeForIlike('a_b@example.com'),
    ])
  })

  it('maps a matched row and surfaces null for an unavailable listing', async () => {
    state.result = {
      data: [{ ...row, listings: null }],
      error: null,
    }
    const [inquiry] = await new DefaultInquiryService().listForBuyer(
      'jane@example.com',
    )
    expect(inquiry.listingAddress).toBeNull()
  })

  it('throws when the query errors', async () => {
    state.result = { data: null, error: new Error('boom') }
    await expect(
      new DefaultInquiryService().listForBuyer('jane@example.com'),
    ).rejects.toThrow('boom')
  })
})
