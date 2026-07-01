import type {
  MediaService,
  StoredImage,
  UploadFile,
} from '@/lib/media/contract'

export type StoreImageCall = { listingId: string; file: UploadFile }

export class FakeMediaService implements MediaService {
  storeImageCalls: StoreImageCall[] = []
  listForListingImpl: (listingId: string) => Promise<StoredImage[]> =
    async () => []
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

  async listForListing(listingId: string): Promise<StoredImage[]> {
    return this.listForListingImpl(listingId)
  }
}
