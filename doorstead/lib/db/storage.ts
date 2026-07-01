import { anonClient } from '@/lib/db/anon-client'
import { createServerClient } from '@/lib/db/server-client'

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

// Read path: anon client, permitted by the scoped anon SELECT policy that only
// exposes objects belonging to a live listing. Minting the signed URL as anon
// is what proves the public page could read it.
export async function createSignedUrl(
  key: string,
  expiresInSeconds: number,
): Promise<string> {
  const { data, error } = await anonClient.storage
    .from(BUCKET)
    .createSignedUrl(key, expiresInSeconds)

  if (error) throw error
  if (!data?.signedUrl) throw new Error('Failed to create signed URL')
  return data.signedUrl
}
