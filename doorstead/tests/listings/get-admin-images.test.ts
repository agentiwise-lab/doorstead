import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeMediaService } from '../media/fakes'
import type { MediaContext, StoredImage } from '@/lib/media/contract'

vi.mock('server-only', () => ({}))
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

let fakeMediaService: FakeMediaService
let signCalls: string[]
let signContexts: MediaContext[]

function makeService(
  signImpl?: (key: string) => Promise<string>,
) {
  return new DefaultListingService(
    {} as never,
    fakeMediaService,
    async (key: string, _ttl: number, context: MediaContext) => {
      signCalls.push(key)
      signContexts.push(context)
      if (signImpl) return signImpl(key)
      return `https://signed.example/${key}`
    },
  )
}

beforeEach(() => {
  fakeMediaService = new FakeMediaService()
  signCalls = []
  signContexts = []
})

describe('getAdminImages', () => {
  it('returns id, signed thumb, and flags in stored (position) order', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({ id: 'a', thumbKey: 'a.thumb', position: 0, isCover: true }),
      storedImage({
        id: 'b',
        thumbKey: 'b.thumb',
        position: 1,
        isFloorplan: true,
      }),
    ]
    const service = makeService()

    const result = await service.getAdminImages(LISTING_ID)

    expect(result).toEqual([
      {
        id: 'a',
        thumbUrl: 'https://signed.example/a.thumb',
        isCover: true,
        isFloorplan: false,
      },
      {
        id: 'b',
        thumbUrl: 'https://signed.example/b.thumb',
        isCover: false,
        isFloorplan: true,
      },
    ])
  })

  it('reads the media and signs the thumb under the admin context', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({ id: 'a', thumbKey: 'a.thumb' }),
    ]
    const service = makeService()

    await service.getAdminImages(LISTING_ID)

    expect(fakeMediaService.listForListingCalls).toEqual([
      { listingId: LISTING_ID, context: 'admin' },
    ])
    expect(signCalls).toEqual(['a.thumb'])
    expect(signContexts).toEqual(['admin'])
  })

  it('drops an image whose thumb signing fails and keeps the rest', async () => {
    fakeMediaService.listForListingImpl = async () => [
      storedImage({ id: 'a', thumbKey: 'a.thumb' }),
      storedImage({ id: 'b', thumbKey: 'b.thumb' }),
    ]
    const service = makeService(async (key: string) => {
      if (key === 'b.thumb') throw new Error('failed to create signed url')
      return `https://signed.example/${key}`
    })

    const result = await service.getAdminImages(LISTING_ID)

    expect(result.map((image) => image.id)).toEqual(['a'])
  })
})
