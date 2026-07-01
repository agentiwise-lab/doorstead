// Trust context of the caller, NOT the operation. The admin/edit surface reads
// and signs via the cookie-aware server client (RLS sees the authenticated
// admin, so draft listings resolve). The public surface reads and signs via the
// anon client (RLS scopes it to live listings). Keying the client off context
// rather than operation is what lets the admin edit page render a draft's images
// while the public page stays anon-scoped-to-live.
export type MediaContext = 'public' | 'admin'

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
  listForListing(
    listingId: string,
    context: MediaContext,
  ): Promise<StoredImage[]>
}
