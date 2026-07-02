import type { SupabaseClient } from '@supabase/supabase-js'
import { anonClient } from '@/lib/db/anon-client'
import { createServerClient } from '@/lib/db/server-client'
import { createSignedUrl } from '@/lib/db/storage'
import { mediaService as defaultMediaService } from '@/lib/media/service'
import type { MediaContext, MediaService } from '@/lib/media/contract'
import type {
  Listing,
  ListingInput,
  ListingService,
  ListingStatus,
  ListingType,
  RenderImage,
} from './contract'

// Signed links are short-lived: long enough to render a page, short enough that
// a leaked URL expires quickly. One hour matches the public page's freshness.
const SIGNED_URL_TTL_SECONDS = 60 * 60

type SignUrl = (
  key: string,
  expiresInSeconds: number,
  context: MediaContext,
) => Promise<string>

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

export class DefaultListingService implements ListingService {
  constructor(
    private readonly client: SupabaseClient,
    private readonly media: MediaService = defaultMediaService,
    private readonly signUrl: SignUrl = createSignedUrl,
  ) {}

  async getImagesForRender(
    listingId: string,
    context: MediaContext,
  ): Promise<RenderImage[]> {
    const stored = await this.media.listForListing(listingId, context)
    const storedImages: RenderImage[] = await Promise.all(
      stored.map(async (image) => ({
        url: await this.signUrl(image.webKey, SIGNED_URL_TTL_SECONDS, context),
        thumbUrl: await this.signUrl(
          image.thumbKey,
          SIGNED_URL_TTL_SECONDS,
          context,
        ),
        isFloorplan: image.isFloorplan,
      })),
    )

    const listing = await this.getById(listingId)
    const legacyImages: RenderImage[] = (listing?.photoUrls ?? []).map(
      (url) => ({ url, thumbUrl: url, isFloorplan: false }),
    )

    return [...storedImages, ...legacyImages]
  }

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

  async listAll(): Promise<Listing[]> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('listings')
      .select(
        'id, address, type, price_gbp, beds, baths, area_sqft, status, description, photo_urls, created_at, updated_at, deleted_at',
      )
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map((row) => toListing(row as ListingRow))
  }

  async getById(id: string): Promise<Listing | null> {
    if (!UUID_REGEX.test(id)) return null

    const client = createServerClient()
    const { data, error } = await client
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

  async create(input: ListingInput, status: ListingStatus): Promise<Listing> {
    const client = createServerClient()
    const { data, error } = await client
      .from('listings')
      .insert({
        address: input.address,
        type: input.type,
        price_gbp: input.priceGbp,
        beds: input.beds,
        baths: input.baths,
        area_sqft: input.areaSqft,
        description: input.description,
        photo_urls: input.photoUrls,
        status,
      })
      .select(
        'id, address, type, price_gbp, beds, baths, area_sqft, status, description, photo_urls, created_at, updated_at, deleted_at',
      )
      .single()

    if (error) throw error
    return toListing(data as ListingRow)
  }

  async update(
    id: string,
    input: ListingInput,
    status: ListingStatus,
  ): Promise<Listing | null> {
    if (!UUID_REGEX.test(id)) return null

    const client = createServerClient()
    const { data, error } = await client
      .from('listings')
      .update({
        address: input.address,
        type: input.type,
        price_gbp: input.priceGbp,
        beds: input.beds,
        baths: input.baths,
        area_sqft: input.areaSqft,
        description: input.description,
        photo_urls: input.photoUrls,
        status,
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select(
        'id, address, type, price_gbp, beds, baths, area_sqft, status, description, photo_urls, created_at, updated_at, deleted_at',
      )
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return toListing(data as ListingRow)
  }

  async setStatus(
    id: string,
    status: ListingStatus,
  ): Promise<Listing | null> {
    if (!UUID_REGEX.test(id)) return null

    const client = createServerClient()
    const { data, error } = await client
      .from('listings')
      .update({ status })
      .eq('id', id)
      .is('deleted_at', null)
      .select(
        'id, address, type, price_gbp, beds, baths, area_sqft, status, description, photo_urls, created_at, updated_at, deleted_at',
      )
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return toListing(data as ListingRow)
  }

  async delete(id: string): Promise<void> {
    if (!UUID_REGEX.test(id)) return

    const client = createServerClient()
    const { error } = await client
      .from('listings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error
  }
}

export const listingService: ListingService = new DefaultListingService(
  anonClient,
)
