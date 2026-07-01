export interface UploadFile {
  bytes: Uint8Array
  contentType: string
  filename: string
}

export interface StoredImage {
  id: string
  originalKey: string
  position: number
  isCover: boolean
  isFloorplan: boolean
}

export interface MediaService {
  storeImage(listingId: string, file: UploadFile): Promise<StoredImage>
  listForListing(listingId: string): Promise<StoredImage[]>
}
