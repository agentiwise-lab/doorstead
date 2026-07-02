import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeMediaService } from '../media/fakes'
import { FakeListingService } from './fakes'
import type { Listing } from '@/lib/listings/contract'

const fakeListingService = new FakeListingService()
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

vi.mock('@/lib/listings/service', () => ({
  listingService: fakeListingService,
}))

vi.mock('@/lib/media/service', () => ({
  mediaService: fakeMediaService,
}))

const {
  createListing,
  updateListing,
  publishListing,
  unpublishListing,
  deleteListing,
  reorderListingImages,
  setListingCover,
  setListingFloorplan,
  removeListingImage,
} = await import('@/lib/listings/actions')
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
  fakeListingService.setStatusCalls = []
  fakeListingService.deleteCalls = []
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
  fakeListingService.setStatusImpl = async (id, status) => ({
    id,
    address: '12 Baker Street',
    type: 'House',
    priceGbp: 500000,
    beds: 3,
    baths: 2,
    areaSqft: 1200,
    status,
    description: 'A lovely home.',
    photoUrls: ['https://example.com/x.jpg'],
    createdAt: '2026-06-26T00:00:00Z',
    updatedAt: '2026-06-26T00:00:00Z',
  })
  fakeListingService.getByIdImpl = async () => null
  fakeListingService.deleteImpl = async () => {}
  fakeMediaService.listForListingCalls = []
  fakeMediaService.listForListingImpl = async () => []
  fakeMediaService.rows = {}
  fakeMediaService.reorderCalls = []
  fakeMediaService.setCoverCalls = []
  fakeMediaService.setFloorplanCalls = []
  fakeMediaService.removeImageCalls = []
  adminOk = true
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(redirect).mockClear()
})

describe('createListing', () => {
  it('creates a draft and returns its new id; revalidates the home page', async () => {
    const fd = makeFormData({ address: '12 Baker Street', type: 'House' })

    const result = await createListing(fd)

    expect(result).toEqual({
      ok: true,
      id: '00000000-0000-0000-0000-000000000001',
    })
    expect(fakeListingService.createCalls.length).toBe(1)
    expect(fakeListingService.createCalls[0].status).toBe('draft')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/')
  })

  it('creates a draft even with an empty body (all draft fields optional)', async () => {
    const fd = makeFormData({})

    const result = await createListing(fd)

    expect(result.ok).toBe(true)
    expect(fakeListingService.createCalls.length).toBe(1)
    expect(fakeListingService.createCalls[0].status).toBe('draft')
  })

  it('returns fieldErrors for an invalid field and does not create', async () => {
    const fd = makeFormData({ priceGbp: '-5' })

    const result = await createListing(fd)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.fieldErrors.priceGbp).toBeTruthy()
    expect(fakeListingService.createCalls.length).toBe(0)
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    const fd = makeFormData({})
    await expect(createListing(fd)).rejects.toThrow('Unauthorized')
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
  }

  function currentListing(over: Partial<Listing> = {}): Listing {
    return {
      id: ID,
      address: '12 Baker Street',
      type: 'House' as const,
      priceGbp: 500000,
      beds: 3,
      baths: 2,
      areaSqft: 1200,
      status: 'draft' as const,
      description: 'A lovely home.',
      photoUrls: ['https://legacy.example/1.jpg'],
      createdAt: '2026-06-26T00:00:00Z',
      updatedAt: '2026-06-26T00:00:00Z',
      ...over,
    }
  }

  it('redirects to /admin?msg=listing-missing when the listing does not exist; no update', async () => {
    fakeListingService.getByIdImpl = async () => null
    const fd = makeFormData(validLiveForm)

    await expect(updateListing({}, fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(fakeListingService.updateCalls.length).toBe(0)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      '/admin?msg=listing-missing',
    )
  })

  it('publishes when an uploaded image exists, preserving legacy photoUrls', async () => {
    fakeListingService.getByIdImpl = async () =>
      currentListing({ photoUrls: [] })
    fakeMediaService.listForListingImpl = async () => [
      {
        id: 'm1',
        originalKey: 'k',
        webKey: 'k.web',
        thumbKey: 'k.thumb',
        position: 0,
        isCover: false,
        isFloorplan: false,
      },
    ]
    const fd = makeFormData(validLiveForm)

    await expect(updateListing({}, fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(fakeListingService.updateCalls.length).toBe(1)
    const call = fakeListingService.updateCalls[0]
    expect(call.status).toBe('live')
    expect(call.input.address).toBe('12 Baker Street')
    // legacy urls are preserved from the stored row, never wiped by the save.
    expect(call.input.photoUrls).toEqual([])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin')
  })

  it('preserves legacy photoUrls through a publish when there are no uploads', async () => {
    fakeListingService.getByIdImpl = async () => currentListing()
    fakeMediaService.listForListingImpl = async () => []
    const fd = makeFormData(validLiveForm)

    await expect(updateListing({}, fd)).rejects.toThrow(/NEXT_REDIRECT/)

    const call = fakeListingService.updateCalls[0]
    expect(call.status).toBe('live')
    expect(call.input.photoUrls).toEqual(['https://legacy.example/1.jpg'])
  })

  it('refuses to publish with no uploads and no legacy urls; returns photoUrls error, no update', async () => {
    fakeListingService.getByIdImpl = async () =>
      currentListing({ photoUrls: [] })
    fakeMediaService.listForListingImpl = async () => []
    const fd = makeFormData(validLiveForm)

    const result = await updateListing({}, fd)

    expect(result.fieldErrors?.photoUrls).toBeTruthy()
    expect(fakeListingService.updateCalls.length).toBe(0)
    expect(vi.mocked(redirect)).not.toHaveBeenCalled()
  })

  it('saves a draft, preserving legacy photoUrls', async () => {
    fakeListingService.getByIdImpl = async () => currentListing()
    const fd = makeFormData({ id: ID, intent: 'draft', address: 'New Road' })

    await expect(updateListing({}, fd)).rejects.toThrow(/NEXT_REDIRECT/)

    const call = fakeListingService.updateCalls[0]
    expect(call.status).toBe('draft')
    expect(call.input.address).toBe('New Road')
    expect(call.input.photoUrls).toEqual(['https://legacy.example/1.jpg'])
  })

  it('redirects to /admin?msg=listing-missing when update returns null', async () => {
    fakeListingService.getByIdImpl = async () => currentListing()
    fakeListingService.updateImpl = async () => null
    const fd = makeFormData(validLiveForm)

    await expect(updateListing({}, fd)).rejects.toThrow(/NEXT_REDIRECT/)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      '/admin?msg=listing-missing',
    )
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    const fd = makeFormData(validLiveForm)
    await expect(updateListing({}, fd)).rejects.toThrow('Unauthorized')
    expect(fakeListingService.updateCalls.length).toBe(0)
  })
})

describe('publishListing', () => {
  const ID = '22222222-2222-2222-2222-222222222222'

  function makeIdFormData(): FormData {
    const fd = new FormData()
    fd.append('id', ID)
    return fd
  }

  function completeListing() {
    return {
      id: ID,
      address: '12 Baker Street',
      type: 'House' as const,
      priceGbp: 500000,
      beds: 3,
      baths: 2,
      areaSqft: 1200,
      status: 'draft' as const,
      description: 'A lovely home.',
      photoUrls: ['https://example.com/x.jpg'],
      createdAt: '2026-06-26T00:00:00Z',
      updatedAt: '2026-06-26T00:00:00Z',
    }
  }

  it('redirects to edit with missing-fields when description is missing; does not call setStatus', async () => {
    fakeListingService.getByIdImpl = async () => ({
      ...completeListing(),
      description: null,
    })

    await expect(publishListing(makeIdFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeListingService.setStatusCalls.length).toBe(0)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      `/admin/${ID}/edit?msg=missing-fields&fields=description`,
    )
  })

  it('refuses with the photo message when there are 0 uploads and 0 legacy urls', async () => {
    fakeListingService.getByIdImpl = async () => ({
      ...completeListing(),
      photoUrls: [],
    })
    fakeMediaService.listForListingImpl = async () => []

    await expect(publishListing(makeIdFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeListingService.setStatusCalls.length).toBe(0)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      `/admin/${ID}/edit?msg=missing-fields&fields=photoUrls`,
    )
  })

  it('publishes with an uploaded image and no legacy urls', async () => {
    fakeListingService.getByIdImpl = async () => ({
      ...completeListing(),
      photoUrls: [],
    })
    fakeMediaService.listForListingImpl = async () => [
      {
        id: 'm1',
        originalKey: 'k',
        webKey: 'k.web',
        thumbKey: 'k.thumb',
        position: 0,
        isCover: false,
        isFloorplan: false,
      },
    ]

    await expect(publishListing(makeIdFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeListingService.setStatusCalls).toEqual([
      { id: ID, status: 'live' },
    ])
  })

  it('on complete listing calls setStatus(id, live) and revalidates both paths', async () => {
    fakeListingService.getByIdImpl = async () => completeListing()

    await expect(publishListing(makeIdFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeListingService.setStatusCalls).toEqual([
      { id: ID, status: 'live' },
    ])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin')
  })

  it('redirects to /admin?msg=listing-missing when getById returns null', async () => {
    fakeListingService.getByIdImpl = async () => null

    await expect(publishListing(makeIdFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeListingService.setStatusCalls.length).toBe(0)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      '/admin?msg=listing-missing',
    )
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    await expect(publishListing(makeIdFormData())).rejects.toThrow(
      'Unauthorized',
    )
    expect(fakeListingService.setStatusCalls.length).toBe(0)
  })
})

describe('unpublishListing', () => {
  const ID = '33333333-3333-3333-3333-333333333333'

  function makeIdFormData(): FormData {
    const fd = new FormData()
    fd.append('id', ID)
    return fd
  }

  it('on a live listing calls setStatus(id, draft) and revalidates both paths', async () => {
    await expect(unpublishListing(makeIdFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeListingService.setStatusCalls).toEqual([
      { id: ID, status: 'draft' },
    ])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin')
  })

  it('redirects to /admin?msg=listing-missing when setStatus returns null', async () => {
    fakeListingService.setStatusImpl = async () => null

    await expect(unpublishListing(makeIdFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(
      '/admin?msg=listing-missing',
    )
    expect(vi.mocked(revalidatePath)).not.toHaveBeenCalled()
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    await expect(unpublishListing(makeIdFormData())).rejects.toThrow(
      'Unauthorized',
    )
    expect(fakeListingService.setStatusCalls.length).toBe(0)
  })
})

describe('deleteListing', () => {
  const ID = '44444444-4444-4444-4444-444444444444'

  function makeIdFormData(): FormData {
    const fd = new FormData()
    fd.append('id', ID)
    return fd
  }

  it('calls service.delete(id) and revalidates both paths', async () => {
    await expect(deleteListing(makeIdFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeListingService.deleteCalls).toEqual([ID])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/')
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/admin')
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    await expect(deleteListing(makeIdFormData())).rejects.toThrow(
      'Unauthorized',
    )
    expect(fakeListingService.deleteCalls.length).toBe(0)
  })
})

describe('reorderListingImages', () => {
  const ID = '55555555-5555-5555-5555-555555555555'

  function makeFd(orderedImageIds: string): FormData {
    const fd = new FormData()
    fd.append('id', ID)
    fd.append('orderedImageIds', orderedImageIds)
    return fd
  }

  it('delegates the parsed order to media.reorder and revalidates', async () => {
    fakeMediaService.rows[ID] = [
      { id: 'a', originalKey: '', webKey: '', thumbKey: '', position: 0, isCover: false, isFloorplan: false },
      { id: 'b', originalKey: '', webKey: '', thumbKey: '', position: 1, isCover: false, isFloorplan: false },
      { id: 'c', originalKey: '', webKey: '', thumbKey: '', position: 2, isCover: false, isFloorplan: false },
    ]

    await expect(reorderListingImages(makeFd('c,a,b'))).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeMediaService.reorderCalls).toEqual([
      { listingId: ID, orderedImageIds: ['c', 'a', 'b'] },
    ])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(`/admin/${ID}/edit`)
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    await expect(reorderListingImages(makeFd('c,a,b'))).rejects.toThrow(
      'Unauthorized',
    )
    expect(fakeMediaService.reorderCalls.length).toBe(0)
  })
})

describe('setListingCover', () => {
  const ID = '66666666-6666-6666-6666-666666666666'

  function makeFd(imageId: string): FormData {
    const fd = new FormData()
    fd.append('id', ID)
    fd.append('imageId', imageId)
    return fd
  }

  it('delegates to media.setCover and revalidates', async () => {
    await expect(setListingCover(makeFd('img-9'))).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeMediaService.setCoverCalls).toEqual([
      { listingId: ID, imageId: 'img-9' },
    ])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(`/admin/${ID}/edit`)
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    await expect(setListingCover(makeFd('img-9'))).rejects.toThrow(
      'Unauthorized',
    )
    expect(fakeMediaService.setCoverCalls.length).toBe(0)
  })
})

describe('setListingFloorplan', () => {
  const ID = '77777777-7777-7777-7777-777777777777'

  function makeFd(imageId: string): FormData {
    const fd = new FormData()
    fd.append('id', ID)
    fd.append('imageId', imageId)
    return fd
  }

  it('delegates to media.setFloorplan and revalidates', async () => {
    await expect(setListingFloorplan(makeFd('img-3'))).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeMediaService.setFloorplanCalls).toEqual([
      { listingId: ID, imageId: 'img-3' },
    ])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(`/admin/${ID}/edit`)
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    await expect(setListingFloorplan(makeFd('img-3'))).rejects.toThrow(
      'Unauthorized',
    )
    expect(fakeMediaService.setFloorplanCalls.length).toBe(0)
  })
})

describe('removeListingImage', () => {
  const ID = '88888888-8888-8888-8888-888888888888'

  function makeFd(imageId: string): FormData {
    const fd = new FormData()
    fd.append('id', ID)
    fd.append('imageId', imageId)
    return fd
  }

  it('delegates to media.removeImage and revalidates', async () => {
    await expect(removeListingImage(makeFd('img-7'))).rejects.toThrow(
      /NEXT_REDIRECT/,
    )

    expect(fakeMediaService.removeImageCalls).toEqual([
      { listingId: ID, imageId: 'img-7' },
    ])
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/listing/${ID}`)
    expect(vi.mocked(redirect)).toHaveBeenCalledWith(`/admin/${ID}/edit`)
  })

  it('throws Unauthorized when not admin', async () => {
    adminOk = false
    await expect(removeListingImage(makeFd('img-7'))).rejects.toThrow(
      'Unauthorized',
    )
    expect(fakeMediaService.removeImageCalls.length).toBe(0)
  })
})
