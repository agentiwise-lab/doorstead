import type { Listing } from '@/lib/listings/contract'

export interface BuyerService {
  saveListing(buyerId: string, listingId: string): Promise<void>
  listShortlist(buyerId: string): Promise<Listing[]>
}
