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

const { createListing } = await import('@/lib/listings/actions')
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
