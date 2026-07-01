import { anonClient } from '@/lib/db/anon-client'
import { createServerClient } from '@/lib/db/server-client'
import type { MediaContext } from '@/lib/media/contract'

const BUCKET = 'listing-media'

// Write path: server client so the authenticated-admin RLS on storage.objects
// passes. A shared client cannot serve both trust contexts, so the client is
// chosen per method the way DefaultListingService already picks its client.
export async function uploadObject(
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  const client = createServerClient()
  const { error } = await client.storage
    .from(BUCKET)
    .upload(key, bytes, { contentType, upsert: false })

  if (error) throw error
}

// Read path: the client is chosen by the caller's trust context, NOT the
// operation. Public renders sign as anon (the scoped anon SELECT policy proves
// the object belongs to a live listing, which is exactly what a visitor may
// read). Admin renders sign as the server client so a DRAFT listing's objects
// resolve too — the anon policy denies drafts, so signing a draft as anon would
// 404 and 500 the edit page.
export async function createSignedUrl(
  key: string,
  expiresInSeconds: number,
  context: MediaContext,
): Promise<string> {
  const client = context === 'admin' ? createServerClient() : anonClient
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(key, expiresInSeconds)

  if (error) throw error
  if (!data?.signedUrl) throw new Error('Failed to create signed URL')
  return data.signedUrl
}
