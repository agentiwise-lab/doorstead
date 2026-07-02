import type { Listing } from '@/lib/listings/contract'

// A saved-listing row. `listing` is null when the saved property is no longer
// available to the buyer (unpublished or soft-deleted, so buyer RLS hides it).
// The entry is kept regardless so the shortlist can show a "no longer listed"
// placeholder the buyer can still unsave, rather than silently dropping it.
export interface ShortlistEntry {
  listingId: string
  savedAt: string
  listing: Listing | null
}

export interface BuyerService {
  saveListing(buyerId: string, listingId: string): Promise<void>
  unsaveListing(buyerId: string, listingId: string): Promise<void>
  listShortlist(buyerId: string): Promise<ShortlistEntry[]>
  savedListingIds(buyerId: string, listingIds: string[]): Promise<Set<string>>
}
