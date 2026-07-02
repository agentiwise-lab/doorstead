import { createServerClient } from '@/lib/db/server-client'
import type { Listing, ListingStatus, ListingType } from '@/lib/listings/contract'
import type { BuyerService, ShortlistEntry } from './contract'

type ListingRow = {
  id: string
  address: string | null
  type: string | null
  price_gbp: number | null
  beds: number | null
  baths: number | null
  area_sqft: number | null
  status: ListingStatus
  description: string | null
  photo_urls: string[] | null
  created_at: string
  updated_at: string
}

type SavedListingRow = {
  listing_id: string
  created_at: string
  listings: ListingRow | null
}

const toListing = (row: ListingRow): Listing => ({
  id: row.id,
  address: row.address,
  type: row.type as ListingType | null,
  priceGbp: row.price_gbp,
  beds: row.beds,
  baths: row.baths,
  areaSqft: row.area_sqft,
  status: row.status,
  description: row.description,
  photoUrls: row.photo_urls ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export class DefaultBuyerService implements BuyerService {
  async saveListing(buyerId: string, listingId: string): Promise<void> {
    const client = createServerClient()
    const { error } = await client.from('saved_listings').upsert(
      { buyer_id: buyerId, listing_id: listingId },
      { onConflict: 'buyer_id,listing_id', ignoreDuplicates: true },
    )

    if (error) throw error
  }

  async unsaveListing(buyerId: string, listingId: string): Promise<void> {
    const client = createServerClient()
    const { error } = await client
      .from('saved_listings')
      .delete()
      .eq('buyer_id', buyerId)
      .eq('listing_id', listingId)

    if (error) throw error
  }

  async savedListingIds(
    buyerId: string,
    listingIds: string[],
  ): Promise<Set<string>> {
    if (listingIds.length === 0) return new Set()

    const client = createServerClient()
    const { data, error } = await client
      .from('saved_listings')
      .select('listing_id')
      .eq('buyer_id', buyerId)
      .in('listing_id', listingIds)

    if (error) throw error
    return new Set((data ?? []).map((row) => row.listing_id as string))
  }

  async listShortlist(buyerId: string): Promise<ShortlistEntry[]> {
    const client = createServerClient()
    const { data, error } = await client
      .from('saved_listings')
      .select(
        'listing_id, created_at, listings(id, address, type, price_gbp, beds, baths, area_sqft, status, description, photo_urls, created_at, updated_at, deleted_at)',
      )
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    // Keep rows whose joined listing is null (unavailable to this buyer) so the
    // shortlist can surface them as "no longer listed" instead of dropping them.
    return (data as unknown as SavedListingRow[] ?? []).map((row) => ({
      listingId: row.listing_id,
      savedAt: row.created_at,
      listing: row.listings ? toListing(row.listings) : null,
    }))
  }
}

export const buyerService: BuyerService = new DefaultBuyerService()
