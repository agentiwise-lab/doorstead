import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeListingService } from './fakes'

const fakeListingService = new FakeListingService()
let adminOk = true

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
    requireAdmin: vi.fn(async () => {
      if (!adminOk) throw new Error('Unauthorized')
      return { userId: 'u1', email: 'admin@example.com' }
    }),
  },
}))

vi.mock('@/lib/listings/service', () => ({
  listingService: fakeListingService,
}))

const { createListing, updateListing } = await import('@/lib/listings/actions')
const { revalidatePath } = await import('next/cache')
const { redirect } = await import('next/navigation')

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) {
    fd.append(k, v)
  }
  return fd
}

beforeEach(() => {
  fakeListingService.createCalls = []
  fakeListingService.updateCalls = []
  fakeListingService.updateImpl = async (id, input, status) => ({
    id,
    address: input.address,
    type: input.type,
    priceGbp: input.priceGbp,
    beds: input.beds,
    baths: input.baths,
    areaSqft: input.areaSqft,
    status,
    description: input.description,
    photoUrls: input.photoUrls,
    createdAt: '2026-06-26T00:00:00Z',
    updatedAt: '2026-06-26T00:00:00Z',
  })
  adminOk = true
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(redirect).mockClear()
})

describe('createListing', () => {
  it('returns fieldErrors for missing description on publish; does not call create or revalidatePath', async () => {
    const fd = makeFormData({
      intent: 'live',
      address: '12 Baker Street',
      type: 'House',
      priceGbp: '500000',
      beds: '3',
      baths: '2',
      areaSqft: '1200',
      description: '',
      photoUrls: 'https://example.com/x.jpg',
    })

    const result = await createListing({}, fd)

    expect(result.fieldErrors).toBeDefined()
    expect(result.fieldErrors!.description).toBeTruthy()
    expect(fakeListingService.createCalls.length).toBe(0)
    expect(vi.mocked(revalidatePath)).not.toHaveBeenCalled()
  })

  it('on draft with empty body, calls create with status=draft, revalidatePath, redirect', async () => {
    const fd = makeFormData({ intent: 'draft', photoUrls: '' })

    await expect(createListing({}, fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(fakeListingService.createCalls.length).toBe(1)
    expect(fakeListingService.createCalls[0].status).toBe('draft')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/')
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin')
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    const fd = makeFormData({ intent: 'draft' })
    await expect(createListing({}, fd)).rejects.toThrow('Unauthorized')
    expect(fakeListingService.createCalls.length).toBe(0)
  })
})

describe('updateListing', () => {
  const ID = '11111111-1111-1111-1111-111111111111'
  const validLiveForm = {
    id: ID,
    intent: 'live',
    address: '12 Baker Street',
    type: 'House',
    priceGbp: '500000',
    beds: '3',
    baths: '2',
    areaSqft: '1200',
    description: 'A lovely home.',
    photoUrls: 'https://example.com/x.jpg',
  }

  it('redirects to /admin?msg=listing-missing when service returns null; does not revalidate', async () => {
    fakeListingService.updateImpl = async () => null
    const fd = makeFormData(validLiveForm)

    await expect(updateListing({}, fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(fakeListingService.updateCalls.length).toBe(1)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      '/admin?msg=listing-missing',
    )
    expect(vi.mocked(revalidatePath)).not.toHaveBeenCalled()
  })

  it('on valid data calls update(id, input, live) and revalidates / and /listing/${id}', async () => {
    const fd = makeFormData(validLiveForm)

    await expect(updateListing({}, fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(fakeListingService.updateCalls.length).toBe(1)
    const call = fakeListingService.updateCalls[0]
    expect(call.id).toBe(ID)
    expect(call.status).toBe('live')
    expect(call.input.address).toBe('12 Baker Street')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin')
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    const fd = makeFormData(validLiveForm)
    await expect(updateListing({}, fd)).rejects.toThrow('Unauthorized')
    expect(fakeListingService.updateCalls.length).toBe(0)
  })
})
