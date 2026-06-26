import { anonClient } from '@/lib/db/anon-client'
import { createServerClient } from '@/lib/db/server-client'
import type {
  InquiryInput,
  InquiryService,
  InquiryWithListing,
} from './contract'

type InquiryRow = {
  id: string
  listing_id: string
  name: string
  email: string
  phone: string
  created_at: string
  listings: { address: string | null } | null
}

const toInquiryWithListing = (row: InquiryRow): InquiryWithListing => ({
  id: row.id,
  listingId: row.listing_id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  createdAt: row.created_at,
  listingAddress: row.listings?.address ?? null,
})

export class DefaultInquiryService implements InquiryService {
  async create(input: InquiryInput): Promise<void> {
    // Anon write path: no .select() — anon has no SELECT policy on inquiries,
    // so the inserted row is invisible to it (the PII boundary).
    const { error } = await anonClient.from('inquiries').insert({
      listing_id: input.listingId,
      name: input.name,
      email: input.email,
      phone: input.phone,
    })

    if (error) throw error
  }

  async listAll(): Promise<InquiryWithListing[]> {
    const client = createServerClient()
    const { data, error } = await client
      .from('inquiries')
      .select(
        'id, listing_id, name, email, phone, created_at, listings!inquiries_listing_id_fkey(address)',
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map((row) =>
      toInquiryWithListing(row as unknown as InquiryRow),
    )
  }
}

export const inquiryService: InquiryService = new DefaultInquiryService()
