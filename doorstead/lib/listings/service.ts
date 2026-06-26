import type { SupabaseClient } from '@supabase/supabase-js'
import { anonClient } from '@/lib/db/anon-client'
import type {
  Listing,
  ListingInput,
  ListingService,
  ListingStatus,
  ListingType,
} from './contract'

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
  deleted_at: string | null
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const LISTING_TYPES: readonly ListingType[] = [
  'House',
  'Flat',
  'Bungalow',
  'Maisonette',
  'Land',
  'Other',
]

const toListingType = (raw: string | null): ListingType | null => {
  if (raw === null) return null
  return (LISTING_TYPES as readonly string[]).includes(raw)
    ? (raw as ListingType)
    : null
}

const toListing = (row: ListingRow): Listing => ({
  id: row.id,
  address: row.address,
  type: toListingType(row.type),
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

const notImplemented = (method: string): never => {
  throw new Error(`ListingService.${method} is not implemented in this unit`)
}

export class DefaultListingService implements ListingService {
  constructor(private readonly client: SupabaseClient) {}

  async listLive(): Promise<Listing[]> {
    const { data, error } = await this.client
      .from('listings')
      .select(
        'id, address, type, price_gbp, beds, baths, area_sqft, status, description, photo_urls, created_at, updated_at, deleted_at',
      )
      .eq('status', 'live')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map((row) => toListing(row as ListingRow))
  }

  listAll(): Promise<Listing[]> {
    return notImplemented('listAll')
  }

  async getById(id: string): Promise<Listing | null> {
    if (!UUID_REGEX.test(id)) return null

    const { data, error } = await this.client
      .from('listings')
      .select(
        'id, address, type, price_gbp, beds, baths, area_sqft, status, description, photo_urls, created_at, updated_at, deleted_at',
      )
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return toListing(data as ListingRow)
  }

  create(input: ListingInput, status: ListingStatus): Promise<Listing> {
    void input
    void status
    return notImplemented('create')
  }

  update(
    id: string,
    input: ListingInput,
    status: ListingStatus,
  ): Promise<Listing | null> {
    void id
    void input
    void status
    return notImplemented('update')
  }

  setStatus(id: string, status: ListingStatus): Promise<Listing | null> {
    void id
    void status
    return notImplemented('setStatus')
  }

  delete(id: string): Promise<void> {
    void id
    return notImplemented('delete')
  }
}

export const listingService: ListingService = new DefaultListingService(
  anonClient,
)
