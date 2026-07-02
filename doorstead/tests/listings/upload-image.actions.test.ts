import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeMediaService } from '../media/fakes'

const fakeMediaService = new FakeMediaService()
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

vi.mock('@/lib/media/service', () => ({
  mediaService: fakeMediaService,
}))

vi.mock('@/lib/listings/service', () => ({
  listingService: {},
}))

const { uploadListingImage } = await import('@/lib/listings/actions')
const { revalidatePath } = await import('next/cache')

const LISTING_ID = '11111111-1111-1111-1111-111111111111'

function makeFormData(listingId: string, file?: File): FormData {
  const fd = new FormData()
  fd.append('id', listingId)
  if (file) fd.append('image', file)
  return fd
}

function imageFile(): File {
  return new File([new Uint8Array([1, 2, 3, 4])], 'photo.jpg', {
    type: 'image/jpeg',
  })
}

function gifFile(): File {
  return new File([new Uint8Array([1, 2, 3, 4])], 'photo.gif', {
    type: 'image/gif',
  })
}

beforeEach(() => {
  fakeMediaService.storeImageCalls = []
  fakeMediaService.listForListingImpl = async () => []
  adminOk = true
  vi.mocked(revalidatePath).mockClear()
})

describe('uploadListingImage', () => {
  it('stores the image, revalidates the public path, and returns ok', async () => {
    const result = await uploadListingImage(
      makeFormData(LISTING_ID, imageFile()),
    )

    expect(result).toEqual({ ok: true })
    expect(fakeMediaService.storeImageCalls.length).toBe(1)
    const call = fakeMediaService.storeImageCalls[0]
    expect(call.listingId).toBe(LISTING_ID)
    expect(call.file.contentType).toBe('image/jpeg')
    expect(call.file.filename).toBe('photo.jpg')
    expect(Array.from(call.file.bytes)).toEqual([1, 2, 3, 4])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
      `/listing/${LISTING_ID}`,
    )
  })

  it('throws Unauthorized when not admin and does not store', async () => {
    adminOk = false
    await expect(
      uploadListingImage(makeFormData(LISTING_ID, imageFile())),
    ).rejects.toThrow('Unauthorized')
    expect(fakeMediaService.storeImageCalls.length).toBe(0)
  })

  it('returns an invalid error and does not store when no file is provided', async () => {
    const result = await uploadListingImage(makeFormData(LISTING_ID))

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.error.reason).toBe('invalid')
    expect(fakeMediaService.storeImageCalls.length).toBe(0)
  })

  it('refuses a disallowed type: leaves the listing unchanged and returns the message', async () => {
    const result = await uploadListingImage(makeFormData(LISTING_ID, gifFile()))

    expect(fakeMediaService.storeImageCalls.length).toBe(0)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.error.reason).toBe('type')
    expect(result.error.message).toContain('JPEG')
  })

  it('refuses the 31st image: leaves the listing unchanged and names the 30 limit', async () => {
    fakeMediaService.listForListingImpl = async () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        originalKey: `k${i}`,
        webKey: `k${i}.web`,
        thumbKey: `k${i}.thumb`,
        position: i,
        isCover: false,
        isFloorplan: false,
      }))

    const result = await uploadListingImage(makeFormData(LISTING_ID, imageFile()))

    expect(fakeMediaService.storeImageCalls.length).toBe(0)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.error.reason).toBe('count')
    expect(result.error.message).toContain('30')
  })
})
