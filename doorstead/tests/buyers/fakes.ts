import type { BuyerService, ShortlistEntry } from '@/lib/buyers/contract'

export class FakeBuyerService implements BuyerService {
  saveListingCalls: Array<{ buyerId: string; listingId: string }> = []
  saveListingImpl: (buyerId: string, listingId: string) => Promise<void> =
    async () => {}
  unsaveListingCalls: Array<{ buyerId: string; listingId: string }> = []
  unsaveListingImpl: (buyerId: string, listingId: string) => Promise<void> =
    async () => {}
  listShortlistImpl: (buyerId: string) => Promise<ShortlistEntry[]> =
    async () => []
  savedListingIdsImpl: (
    buyerId: string,
    listingIds: string[],
  ) => Promise<Set<string>> = async () => new Set()

  async saveListing(buyerId: string, listingId: string): Promise<void> {
    this.saveListingCalls.push({ buyerId, listingId })
    return this.saveListingImpl(buyerId, listingId)
  }

  async unsaveListing(buyerId: string, listingId: string): Promise<void> {
    this.unsaveListingCalls.push({ buyerId, listingId })
    return this.unsaveListingImpl(buyerId, listingId)
  }

  async listShortlist(buyerId: string): Promise<ShortlistEntry[]> {
    return this.listShortlistImpl(buyerId)
  }

  async savedListingIds(
    buyerId: string,
    listingIds: string[],
  ): Promise<Set<string>> {
    return this.savedListingIdsImpl(buyerId, listingIds)
  }
}
