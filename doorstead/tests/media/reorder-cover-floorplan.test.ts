import { beforeEach, describe, expect, it } from 'vitest'
import type { StoredImage } from '@/lib/media/contract'
import { FakeMediaService } from './fakes'

// The MediaService contract promises: reorder persists the new order, at most
// one cover and one floorplan exist per listing, and remove drops the row.
// These are driven through a Fake that honours the contract, so the assertions
// survive any rewrite of the Supabase-backed implementation.

const LISTING = 'listing-1'

function storedImage(over: Partial<StoredImage>): StoredImage {
  return {
    id: 'img',
    originalKey: 'listing/x/a.jpg',
    webKey: 'listing/x/a.web.jpg',
    thumbKey: 'listing/x/a.thumb.jpg',
    position: 0,
    isCover: false,
    isFloorplan: false,
    ...over,
  }
}

let media: FakeMediaService

beforeEach(() => {
  media = new FakeMediaService()
  media.rows[LISTING] = [
    storedImage({ id: 'a', position: 0 }),
    storedImage({ id: 'b', position: 1 }),
    storedImage({ id: 'c', position: 2 }),
  ]
  media.listForListingImpl = async (listingId) => media.rows[listingId] ?? []
})

describe('MediaService.reorder', () => {
  it('persists the new order as positions', async () => {
    await media.reorder(LISTING, ['c', 'a', 'b'])

    const rows = await media.listForListing(LISTING, 'admin')
    expect(rows.map((r) => [r.id, r.position])).toEqual([
      ['c', 0],
      ['a', 1],
      ['b', 2],
    ])
  })
})

describe('MediaService.setCover', () => {
  it('setting a second cover clears the first', async () => {
    await media.setCover(LISTING, 'a')
    await media.setCover(LISTING, 'b')

    const rows = await media.listForListing(LISTING, 'admin')
    expect(rows.filter((r) => r.isCover).map((r) => r.id)).toEqual(['b'])
  })
})

describe('MediaService.setFloorplan', () => {
  it('setting a second floorplan clears the first', async () => {
    await media.setFloorplan(LISTING, 'a')
    await media.setFloorplan(LISTING, 'b')

    const rows = await media.listForListing(LISTING, 'admin')
    expect(rows.filter((r) => r.isFloorplan).map((r) => r.id)).toEqual(['b'])
  })
})

describe('MediaService.removeImage', () => {
  it('drops the row', async () => {
    await media.removeImage(LISTING, 'b')

    const rows = await media.listForListing(LISTING, 'admin')
    expect(rows.map((r) => r.id)).toEqual(['a', 'c'])
  })
})
