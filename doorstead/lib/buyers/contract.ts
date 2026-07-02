import type { Listing } from '@/lib/listings/contract'

export interface BuyerService {
  saveListing(buyerId: string, listingId: string): Promise<void>
  unsaveListing(buyerId: string, listingId: string): Promise<void>
  listShortlist(buyerId: string): Promise<Listing[]>
  savedListingIds(buyerId: string, listingIds: string[]): Promise<Set<string>>
}
