import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeMediaService } from '../media/fakes'
import type { MediaContext, StoredImage } from '@/lib/media/contract'
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
    webKey: 'listing/x/a.web.jpg',
    thumbKey: 'listing/x/a.thumb.jpg',
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
let signContexts: MediaContext[]

function makeService(listing: Listing | null) {
  const service = new DefaultListingService(
    {} as never,
    fakeMediaService,
    async (key: string, _ttl: number, context: MediaContext) => {
      signCalls.push(key)
      signContexts.push(context)
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
  signContexts = []
})

describe('getImagesForRender', () => {
  it('signs the web variant as url and the thumb variant as thumbUrl, tagging floorplans', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({
        id: 'a',
        webKey: 'listing/x/a.web.jpg',
        thumbKey: 'listing/x/a.thumb.jpg',
      }),
      storedImage({
        id: 'b',
        webKey: 'listing/x/b.web.png',
        thumbKey: 'listing/x/b.thumb.png',
        isFloorplan: true,
      }),
    ]
    const service = makeService(baseListing({ photoUrls: [] }))

    const result = await service.getImagesForRender(LISTING_ID, 'public')

    expect(result).toEqual([
      {
        url: 'https://signed.example/listing/x/a.web.jpg',
        thumbUrl: 'https://signed.example/listing/x/a.thumb.jpg',
        isFloorplan: false,
      },
      {
        url: 'https://signed.example/listing/x/b.web.png',
        thumbUrl: 'https://signed.example/listing/x/b.thumb.png',
        isFloorplan: true,
      },
    ])
    expect([...signCalls].sort()).toEqual(
      [
        'listing/x/a.web.jpg',
        'listing/x/a.thumb.jpg',
        'listing/x/b.web.png',
        'listing/x/b.thumb.png',
      ].sort(),
    )
  })

  it('leads with the explicit cover, then keeps position order for the rest', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({ id: 'a', webKey: 'a.web', thumbKey: 'a.thumb' }),
      storedImage({
        id: 'b',
        webKey: 'b.web',
        thumbKey: 'b.thumb',
        isCover: true,
      }),
      storedImage({ id: 'c', webKey: 'c.web', thumbKey: 'c.thumb' }),
    ]
    const service = makeService(baseListing({ photoUrls: [] }))

    const result = await service.getImagesForRender(LISTING_ID, 'public')

    expect(result.map((r) => r.url)).toEqual([
      'https://signed.example/b.web',
      'https://signed.example/a.web',
      'https://signed.example/c.web',
    ])
  })

  it('passes legacy photo_urls through unsigned as both url and thumbUrl, not as floorplans', async () => {
    fakeMediaService.listForListingImpl = async () => []
    const service = makeService(
      baseListing({ photoUrls: ['https://legacy.example/1.jpg'] }),
    )

    const result = await service.getImagesForRender(LISTING_ID, 'public')

    expect(result).toEqual([
      {
        url: 'https://legacy.example/1.jpg',
        thumbUrl: 'https://legacy.example/1.jpg',
        isFloorplan: false,
      },
    ])
    expect(signCalls).toEqual([])
  })

  it('renders stored media before legacy urls for a mixed listing', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({
        id: 'a',
        webKey: 'listing/x/a.web.jpg',
        thumbKey: 'listing/x/a.thumb.jpg',
      }),
    ]
    const service = makeService(
      baseListing({ photoUrls: ['https://legacy.example/1.jpg'] }),
    )

    const result = await service.getImagesForRender(LISTING_ID, 'public')

    expect(result).toEqual([
      {
        url: 'https://signed.example/listing/x/a.web.jpg',
        thumbUrl: 'https://signed.example/listing/x/a.thumb.jpg',
        isFloorplan: false,
      },
      {
        url: 'https://legacy.example/1.jpg',
        thumbUrl: 'https://legacy.example/1.jpg',
        isFloorplan: false,
      },
    ])
  })

  it('returns an empty list when the listing does not exist', async () => {
    fakeMediaService.listForListingImpl = async () => []
    const service = makeService(null)

    const result = await service.getImagesForRender(LISTING_ID, 'public')

    expect(result).toEqual([])
  })

  it('threads the admin context to both the media read and the signer', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({ id: 'a', originalKey: 'listing/x/a.jpg' }),
    ]
    const service = makeService(baseListing({ status: 'draft' }))

    await service.getImagesForRender(LISTING_ID, 'admin')

    expect(fakeMediaService.listForListingCalls).toEqual([
      { listingId: LISTING_ID, context: 'admin' },
    ])
    // Both the web and thumb signs run under the caller's context.
    expect(signContexts).toEqual(['admin', 'admin'])
  })

  it('threads the public context to both the media read and the signer', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({ id: 'a', originalKey: 'listing/x/a.jpg' }),
    ]
    const service = makeService(baseListing({ photoUrls: [] }))

    await service.getImagesForRender(LISTING_ID, 'public')

    expect(fakeMediaService.listForListingCalls).toEqual([
      { listingId: LISTING_ID, context: 'public' },
    ])
    expect(signContexts).toEqual(['public', 'public'])
  })
})
