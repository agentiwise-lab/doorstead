import type {
  MediaContext,
  MediaService,
  StoredImage,
  UploadFile,
} from '@/lib/media/contract'

export type StoreImageCall = { listingId: string; file: UploadFile }
export type ListForListingCall = { listingId: string; context: MediaContext }

export class FakeMediaService implements MediaService {
  storeImageCalls: StoreImageCall[] = []
  listForListingCalls: ListForListingCall[] = []
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
}
