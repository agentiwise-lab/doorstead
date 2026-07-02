import type {
  MediaContext,
  MediaService,
  StoredImage,
  UploadFile,
} from '@/lib/media/contract'

export type StoreImageCall = { listingId: string; file: UploadFile }
export type ListForListingCall = { listingId: string; context: MediaContext }
export type ReorderCall = { listingId: string; orderedImageIds: string[] }
export type SetCoverCall = { listingId: string; imageId: string }
export type SetFloorplanCall = { listingId: string; imageId: string }
export type RemoveImageCall = { listingId: string; imageId: string }

export class FakeMediaService implements MediaService {
  // In-memory store keyed by listing id. Contract tests seed this, drive the
  // mutating methods, and assert the resulting rows honour the invariants (new
  // order, at most one cover, at most one floorplan, row dropped on remove).
  rows: Record<string, StoredImage[]> = {}

  storeImageCalls: StoreImageCall[] = []
  listForListingCalls: ListForListingCall[] = []
  reorderCalls: ReorderCall[] = []
  setCoverCalls: SetCoverCall[] = []
  setFloorplanCalls: SetFloorplanCall[] = []
  removeImageCalls: RemoveImageCall[] = []
  listForListingImpl: (
    listingId: string,
    context: MediaContext,
  ) => Promise<StoredImage[]> = async () => []
  storeImageImpl: (
    listingId: string,
    file: UploadFile,
  ) => Promise<StoredImage> = async () => ({
    id: '00000000-0000-0000-0000-0000000000aa',
    originalKey: 'listing/x/y.jpg',
    webKey: 'listing/x/y.web.jpg',
    thumbKey: 'listing/x/y.thumb.jpg',
    position: 0,
    isCover: false,
    isFloorplan: false,
  })

  async storeImage(listingId: string, file: UploadFile): Promise<StoredImage> {
    this.storeImageCalls.push({ listingId, file })
    return this.storeImageImpl(listingId, file)
  }

  async listForListing(
    listingId: string,
    context: MediaContext,
  ): Promise<StoredImage[]> {
    this.listForListingCalls.push({ listingId, context })
    return this.listForListingImpl(listingId, context)
  }

  async reorder(listingId: string, orderedImageIds: string[]): Promise<void> {
    this.reorderCalls.push({ listingId, orderedImageIds })
    const current = this.rows[listingId] ?? []
    this.rows[listingId] = orderedImageIds.map((id, index) => {
      const row = current.find((r) => r.id === id)
      if (!row) throw new Error(`unknown image ${id}`)
      return { ...row, position: index }
    })
  }

  async setCover(listingId: string, imageId: string): Promise<void> {
    this.setCoverCalls.push({ listingId, imageId })
    const current = this.rows[listingId] ?? []
    this.rows[listingId] = current.map((row) => ({
      ...row,
      isCover: row.id === imageId,
    }))
  }

  async setFloorplan(listingId: string, imageId: string): Promise<void> {
    this.setFloorplanCalls.push({ listingId, imageId })
    const current = this.rows[listingId] ?? []
    this.rows[listingId] = current.map((row) => ({
      ...row,
      isFloorplan: row.id === imageId,
    }))
  }

  async removeImage(listingId: string, imageId: string): Promise<void> {
    this.removeImageCalls.push({ listingId, imageId })
    const current = this.rows[listingId] ?? []
    this.rows[listingId] = current.filter((row) => row.id !== imageId)
  }
}
