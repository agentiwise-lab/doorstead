import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeMediaService } from '../media/fakes'
import type { StoredImage } from '@/lib/media/contract'
import type { Listing } from '@/lib/listings/contract'

vi.mock('server-only', () => ({}))

// DefaultListingService imports the DB clients at module load; stub them so the
// test never needs Supabase env vars. getImagesForRender under test uses the
// injected MediaService + signer, not these clients.
vi.mock('@/lib/db/anon-client', () => ({ anonClient: {} }))
vi.mock('@/lib/db/server-client', () => ({
  createServerClient: () => ({}),
}))

const { DefaultListingService } = await import('@/lib/listings/service')

const LISTING_ID = '11111111-1111-1111-1111-111111111111'

function storedImage(over: Partial<StoredImage>): StoredImage {
  return {
    id: 'img-1',
    originalKey: 'listing/x/a.jpg',
    position: 0,
    isCover: false,
    isFloorplan: false,
    ...over,
  }
}

function baseListing(over: Partial<Listing>): Listing {
  return {
    id: LISTING_ID,
    address: null,
    type: null,
    priceGbp: null,
    beds: null,
    baths: null,
    areaSqft: null,
    status: 'live',
    description: null,
    photoUrls: [],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    ...over,
  }
}

let fakeMediaService: FakeMediaService
let signCalls: string[]

function makeService(listing: Listing | null) {
  const service = new DefaultListingService(
    {} as never,
    fakeMediaService,
    async (key: string) => {
      signCalls.push(key)
      return `https://signed.example/${key}`
    },
  )
  // getById reaches Supabase; getImagesForRender only needs its result for the
  // legacy-url passthrough, so stub it at the contract boundary here.
  service.getById = async () => listing
  return service
}

beforeEach(() => {
  fakeMediaService = new FakeMediaService()
  signCalls = []
})

describe('getImagesForRender', () => {
  it('returns a signed url for each stored image, tagging floorplans', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({ id: 'a', originalKey: 'listing/x/a.jpg' }),
      storedImage({ id: 'b', originalKey: 'listing/x/b.png', isFloorplan: true }),
    ]
    const service = makeService(baseListing({ photoUrls: [] }))

    const result = await service.getImagesForRender(LISTING_ID)

    expect(result).toEqual([
      { url: 'https://signed.example/listing/x/a.jpg', isFloorplan: false },
      { url: 'https://signed.example/listing/x/b.png', isFloorplan: true },
    ])
    expect(signCalls).toEqual(['listing/x/a.jpg', 'listing/x/b.png'])
  })

  it('passes legacy photo_urls through unsigned, not as floorplans', async () => {
    fakeMediaService.listForListingImpl = async () => []
    const service = makeService(
      baseListing({ photoUrls: ['https://legacy.example/1.jpg'] }),
    )

    const result = await service.getImagesForRender(LISTING_ID)

    expect(result).toEqual([
      { url: 'https://legacy.example/1.jpg', isFloorplan: false },
    ])
    expect(signCalls).toEqual([])
  })

  it('renders stored media before legacy urls for a mixed listing', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({ id: 'a', originalKey: 'listing/x/a.jpg' }),
    ]
    const service = makeService(
      baseListing({ photoUrls: ['https://legacy.example/1.jpg'] }),
    )

    const result = await service.getImagesForRender(LISTING_ID)

    expect(result).toEqual([
      { url: 'https://signed.example/listing/x/a.jpg', isFloorplan: false },
      { url: 'https://legacy.example/1.jpg', isFloorplan: false },
    ])
  })

  it('returns an empty list when the listing does not exist', async () => {
    fakeMediaService.listForListingImpl = async () => []
    const service = makeService(null)

    const result = await service.getImagesForRender(LISTING_ID)

    expect(result).toEqual([])
  })
})
