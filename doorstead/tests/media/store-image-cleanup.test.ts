import { beforeEach, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import type { UploadFile } from '@/lib/media/contract'

// AGE-126: storeImage uploads three objects (original, web, thumb) then inserts
// the listing_media row. If a later upload or the insert throws, the objects
// already written to the bucket must not be left orphaned. Fake the storage
// adapter to record every object written and removed, and prove that on a
// partial failure every previously-written key is best-effort removed before the
// original error propagates.
vi.mock('server-only', () => ({}))

const written: string[] = []
const removed: string[] = []
// When set, uploadObject throws on the call whose key contains this marker
// (e.g. '.thumb.' fails the third upload). null disables the injected failure.
let failUploadOn: string | null = null

const uploadObject = vi.fn(
  async (key: string, _bytes: Uint8Array, _contentType: string) => {
    if (failUploadOn && key.includes(failUploadOn)) {
      throw new Error(`upload failed for ${key}`)
    }
    written.push(key)
  },
)
const removeObject = vi.fn(async (key: string) => {
  removed.push(key)
})
vi.mock('@/lib/db/storage', () => ({ uploadObject, removeObject }))

// When true, the insert resolves with an error (simulating a failed row write).
let insertFails = false
function makeInsertClient() {
  const single = vi.fn(async () =>
    insertFails
      ? { data: null, error: new Error('insert failed') }
      : {
          data: {
            id: 'row-1',
            listing_id: 'listing-1',
            original_key: 'k',
            web_key: 'k.web',
            thumb_key: 'k.thumb',
            position: 0,
            is_cover: false,
            is_floorplan: false,
          },
          error: null,
        },
  )
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  return { from: vi.fn(() => ({ insert })) }
}

let serverClient = makeInsertClient()
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
  written.length = 0
  removed.length = 0
  failUploadOn = null
  insertFails = false
  uploadObject.mockClear()
  removeObject.mockClear()
  serverClient = makeInsertClient()
})

describe('DefaultMediaService.storeImage cleanup on partial failure', () => {
  it('removes objects already written when a later variant upload throws', async () => {
    // Original + web succeed, thumb throws. The two written objects must be gone.
    failUploadOn = '.thumb.'

    await expect(
      new DefaultMediaService().storeImage('listing-1', await jpegFile()),
    ).rejects.toThrow(/upload failed/)

    // Everything written to the bucket for this image is removed; no orphans.
    expect(removed.sort()).toEqual([...written].sort())
    expect(written.length).toBe(2)
  })

  it('removes all three objects when the insert throws', async () => {
    insertFails = true

    await expect(
      new DefaultMediaService().storeImage('listing-1', await jpegFile()),
    ).rejects.toThrow(/insert failed/)

    expect(written.length).toBe(3)
    expect(removed.sort()).toEqual([...written].sort())
  })
})
