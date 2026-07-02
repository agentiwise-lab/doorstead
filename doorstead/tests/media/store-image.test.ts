import { beforeEach, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import type { UploadFile } from '@/lib/media/contract'

// storeImage's real collaborators are true system boundaries: the storage
// adapter (uploadObject) and the Supabase insert. Fake those; drive the rest
// (variant generation, key derivation) for real through the contract.
vi.mock('server-only', () => ({}))

const uploadObject = vi.fn(
  async (_key: string, _bytes: Uint8Array, _contentType: string) => {},
)
vi.mock('@/lib/db/storage', () => ({ uploadObject }))

let insertedRow: Record<string, unknown> | null = null
function makeInsertClient() {
  const single = vi.fn(async () => ({
    data: {
      id: 'row-1',
      listing_id: 'listing-1',
      original_key: insertedRow?.original_key,
      web_key: insertedRow?.web_key,
      thumb_key: insertedRow?.thumb_key,
      position: 0,
      is_cover: false,
      is_floorplan: false,
    },
    error: null,
  }))
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn((row: Record<string, unknown>) => {
    insertedRow = row
    return { select }
  })
  return { from: vi.fn(() => ({ insert })) }
}

const serverClient = makeInsertClient()
vi.mock('@/lib/db/anon-client', () => ({ anonClient: {} }))
vi.mock('@/lib/db/server-client', () => ({
  createServerClient: () => serverClient,
}))

const { DefaultMediaService } = await import('@/lib/media/service')

async function jpegFile(): Promise<UploadFile> {
  const bytes = await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 10, g: 20, b: 30 },
    },
  })
    .jpeg()
    .toBuffer()
  return {
    bytes: new Uint8Array(bytes),
    contentType: 'image/jpeg',
    filename: 'photo.jpg',
  }
}

beforeEach(() => {
  uploadObject.mockClear()
  insertedRow = null
})

describe('DefaultMediaService.storeImage', () => {
  it('uploads three objects: original, web, and thumb', async () => {
    await new DefaultMediaService().storeImage('listing-1', await jpegFile())

    expect(uploadObject).toHaveBeenCalledTimes(3)
    const keys = uploadObject.mock.calls.map((call) => call[0] as string)
    expect(keys.some((k) => k.includes('.web.'))).toBe(true)
    expect(keys.some((k) => k.includes('.thumb.'))).toBe(true)
    // The original key carries no variant marker.
    expect(
      keys.filter((k) => !k.includes('.web.') && !k.includes('.thumb.')).length,
    ).toBe(1)
  })

  it('records original_key, web_key, and thumb_key on the row', async () => {
    await new DefaultMediaService().storeImage('listing-1', await jpegFile())

    expect(insertedRow).toMatchObject({
      listing_id: 'listing-1',
      original_key: expect.stringMatching(/^listing\/listing-1\/.+\.jpg$/),
      web_key: expect.stringContaining('.web.'),
      thumb_key: expect.stringContaining('.thumb.'),
    })
  })

  it('derives web and thumb keys from the original key, same extension', async () => {
    await new DefaultMediaService().storeImage('listing-1', await jpegFile())

    const original = insertedRow?.original_key as string
    const stem = original.replace(/\.jpg$/, '')
    expect(insertedRow?.web_key).toBe(`${stem}.web.jpg`)
    expect(insertedRow?.thumb_key).toBe(`${stem}.thumb.jpg`)
  })
})
