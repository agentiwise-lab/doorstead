import type { MediaContext } from '@/lib/media/contract'

export type { MediaContext }

export type ListingType =
  | 'House'
  | 'Flat'
  | 'Bungalow'
  | 'Maisonette'
  | 'Land'
  | 'Other'

export type ListingStatus = 'draft' | 'live'

export interface Listing {
  id: string
  address: string | null
  type: ListingType | null
  priceGbp: number | null
  beds: number | null
  baths: number | null
  areaSqft: number | null
  status: ListingStatus
  description: string | null
  photoUrls: string[]
  createdAt: string
  updatedAt: string
}

export interface ListingInput {
  address: string | null
  type: ListingType | null
  priceGbp: number | null
  beds: number | null
  baths: number | null
  areaSqft: number | null
  description: string | null
  photoUrls: string[]
}

export interface RenderImage {
  url: string
  isFloorplan: boolean
}

export interface ListingService {
  listLive(): Promise<Listing[]>
  listAll(): Promise<Listing[]>
  getById(id: string): Promise<Listing | null>
  getImagesForRender(
    listingId: string,
    context: MediaContext,
  ): Promise<RenderImage[]>
  create(input: ListingInput, status: ListingStatus): Promise<Listing>
  update(
    id: string,
    input: ListingInput,
    status: ListingStatus,
  ): Promise<Listing | null>
  setStatus(id: string, status: ListingStatus): Promise<Listing | null>
  delete(id: string): Promise<void>
}
