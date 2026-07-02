import type { BuyerService } from '@/lib/buyers/contract'
import type { Listing } from '@/lib/listings/contract'

export class FakeBuyerService implements BuyerService {
  saveListingCalls: Array<{ buyerId: string; listingId: string }> = []
  saveListingImpl: (buyerId: string, listingId: string) => Promise<void> =
    async () => {}
  listShortlistImpl: (buyerId: string) => Promise<Listing[]> = async () => []

  async saveListing(buyerId: string, listingId: string): Promise<void> {
    this.saveListingCalls.push({ buyerId, listingId })
    return this.saveListingImpl(buyerId, listingId)
  }

  async listShortlist(buyerId: string): Promise<Listing[]> {
    return this.listShortlistImpl(buyerId)
  }
}
