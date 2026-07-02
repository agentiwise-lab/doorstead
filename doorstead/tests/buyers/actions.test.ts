import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeBuyerService } from './fakes'

const fakeBuyerService = new FakeBuyerService()

type BuyerSessionMode = 'buyer' | 'no-session' | 'admin'
let sessionMode: BuyerSessionMode = 'buyer'

vi.mock('server-only', () => ({}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    const err = new Error(`NEXT_REDIRECT:${path}`)
    ;(err as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${path};307;`
    throw err
  }),
}))

vi.mock('@/lib/auth/service', () => ({
  authService: {
    requireBuyer: vi.fn(async () => {
      if (sessionMode !== 'buyer') throw new Error('Unauthorized')
      return { userId: 'buyer-1', email: 'buyer@example.com' }
    }),
  },
}))

vi.mock('@/lib/buyers/service', () => ({
  buyerService: fakeBuyerService,
}))

const { saveListing } = await import('@/lib/buyers/actions')
const { revalidatePath } = await import('next/cache')
const { redirect } = await import('next/navigation')

const LISTING_ID = '11111111-1111-1111-1111-111111111111'

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.append(k, v)
  return fd
}

beforeEach(() => {
  fakeBuyerService.saveListingCalls = []
  fakeBuyerService.saveListingImpl = async () => {}
  sessionMode = 'buyer'
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(redirect).mockClear()
})

describe('saveListing', () => {
  it('records the save and redirects to the listing page for a signed-in buyer', async () => {
    const fd = makeFormData({ listingId: LISTING_ID })

    await expect(saveListing(fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(fakeBuyerService.saveListingCalls).toEqual([
      { buyerId: 'buyer-1', listingId: LISTING_ID },
    ])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/shortlist')
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(`/listing/${LISTING_ID}`)
  })

  it('redirects to /sign-in with a next param back to the listing when there is no session', async () => {
    sessionMode = 'no-session'
    const fd = makeFormData({ listingId: LISTING_ID })

    await expect(saveListing(fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      `/sign-in?next=${encodeURIComponent(`/listing/${LISTING_ID}`)}`,
    )
    expect(fakeBuyerService.saveListingCalls.length).toBe(0)
  })

  it('redirects to /sign-in the same way when the session belongs to an admin', async () => {
    sessionMode = 'admin'
    const fd = makeFormData({ listingId: LISTING_ID })

    await expect(saveListing(fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      `/sign-in?next=${encodeURIComponent(`/listing/${LISTING_ID}`)}`,
    )
    expect(fakeBuyerService.saveListingCalls.length).toBe(0)
  })

  it('redirects to / and does not call the service for a blank listingId', async () => {
    const fd = makeFormData({ listingId: '' })

    await expect(saveListing(fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(fakeBuyerService.saveListingCalls.length).toBe(0)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/')
  })
})
