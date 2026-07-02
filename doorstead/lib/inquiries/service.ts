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

// PostgREST's .ilike() compiles to SQL LIKE, where % and _ are wildcards.
// An email's local part may legally contain either, so they must be escaped
// or a query for "a_b@x.com" could also match an unrelated "aXb@x.com" —
// harmless here only because inquiries_buyer_read (migration 0007) still
// independently re-checks lower(email) = lower(jwt email) as an exact
// match, but escaping keeps this filter's own intent correct rather than
// leaning on that second layer to paper over it.
const escapeForIlike = (value: string): string =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`)

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

  async listForBuyer(email: string): Promise<InquiryWithListing[]> {
    const client = createServerClient()
    // The real security boundary is the inquiries_buyer_read RLS policy
    // (migration 0007), which independently gates on
    // lower(email) = lower(auth.jwt() ->> 'email'). The .ilike() below only
    // shapes the query to the caller's own rows for clarity — removing it
    // could not widen what a buyer can read, since RLS enforces that
    // regardless. It matches RLS's case-insensitivity (not .eq(), which
    // would silently drop a buyer's own pre-signup inquiry if they typed
    // their email in different casing than their verified account email).
    const { data, error } = await client
      .from('inquiries')
      .select(
        'id, listing_id, name, email, phone, created_at, listings!inquiries_listing_id_fkey(address)',
      )
      .ilike('email', escapeForIlike(email))
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map((row) =>
      toInquiryWithListing(row as unknown as InquiryRow),
    )
  }
}

export const inquiryService: InquiryService = new DefaultInquiryService()
