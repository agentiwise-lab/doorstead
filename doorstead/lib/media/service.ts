import { anonClient } from '@/lib/db/anon-client'
import { createServerClient } from '@/lib/db/server-client'
import { uploadObject } from '@/lib/db/storage'
import type {
  MediaContext,
  MediaService,
  StoredImage,
  UploadFile,
} from './contract'

type MediaRow = {
  id: string
  listing_id: string
  original_key: string
  position: number
  is_cover: boolean
  is_floorplan: boolean
}

const toStoredImage = (row: MediaRow): StoredImage => ({
  id: row.id,
  originalKey: row.original_key,
  position: row.position,
  isCover: row.is_cover,
  isFloorplan: row.is_floorplan,
})

const extensionFor = (contentType: string): string => {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'bin'
  }
}

// The object key MUST equal storage.objects.name for the anon read policy's
// join (migration 0003) to find it. Namespacing by listing keeps keys unique
// and makes the listing owner obvious from the key alone.
export function buildObjectKey(
  listingId: string,
  file: UploadFile,
  uniqueId: string,
): string {
  return `listing/${listingId}/${uniqueId}.${extensionFor(file.contentType)}`
}

export class DefaultMediaService implements MediaService {
  async storeImage(listingId: string, file: UploadFile): Promise<StoredImage> {
    const key = buildObjectKey(listingId, file, crypto.randomUUID())

    await uploadObject(key, file.bytes, file.contentType)

    const client = createServerClient()
    const { data, error } = await client
      .from('listing_media')
      .insert({ listing_id: listingId, original_key: key })
      .select('id, listing_id, original_key, position, is_cover, is_floorplan')
      .single()

    if (error) throw error
    return toStoredImage(data as MediaRow)
  }

  async listForListing(
    listingId: string,
    context: MediaContext,
  ): Promise<StoredImage[]> {
    // Public reads go through the anon client so RLS scopes them to live
    // listings via listing_media_public_read (migration 0003); admin reads use
    // the server client so drafts resolve. Never mix clients across contexts.
    const client = context === 'admin' ? createServerClient() : anonClient
    const { data, error } = await client
      .from('listing_media')
      .select('id, listing_id, original_key, position, is_cover, is_floorplan')
      .eq('listing_id', listingId)
      .order('position', { ascending: true })

    if (error) throw error
    return (data ?? []).map((row) => toStoredImage(row as MediaRow))
  }
}

export const mediaService: MediaService = new DefaultMediaService()
