// Reproduces, against a real `supabase start` local stack, the RLS-enforced
// guarantees that a vitest fake cannot prove: cross-buyer isolation, the
// idempotent-save unique constraint, and a buyer's read access to a live
// listing. Run this after `supabase db reset` (or `db push`) has applied
// migrations up through 0006_buyer_accounts.sql.
//
// Usage (from doorstead/, with `supabase start` already running):
//   node supabase/verify-local-rls.mjs
//
// Reads connection details from `supabase status -o env` defaults unless
// overridden via SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.
// The local stack's anon/service-role keys are the fixed demo-project keys
// Supabase's CLI seeds for every local instance — not a secret.

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const svc = createClient(URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let failed = false
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    failed = true
  } else {
    console.log('ok:', msg)
  }
}

async function main() {
  const { data: listing, error: listingErr } = await svc
    .from('listings')
    .insert({
      address: '1 RLS Verify Street',
      type: 'House',
      price_gbp: 100000,
      status: 'live',
    })
    .select('id')
    .single()
  if (listingErr) throw listingErr
  const listingId = listing.id

  const { data: b1, error: b1Err } = await svc.auth.admin.createUser({
    email: 'verify-buyer1@rls-verify.local',
    password: 'Passw0rd!buyer1',
    email_confirm: true,
  })
  if (b1Err) throw b1Err
  const { data: b2, error: b2Err } = await svc.auth.admin.createUser({
    email: 'verify-buyer2@rls-verify.local',
    password: 'Passw0rd!buyer2',
    email_confirm: true,
  })
  if (b2Err) throw b2Err

  const buyer1 = createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await buyer1.auth.signInWithPassword({
    email: 'verify-buyer1@rls-verify.local',
    password: 'Passw0rd!buyer1',
  })

  const buyer2 = createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await buyer2.auth.signInWithPassword({
    email: 'verify-buyer2@rls-verify.local',
    password: 'Passw0rd!buyer2',
  })

  // A buyer can read a live listing (the listings_authenticated_read_live policy).
  const { data: readLive, error: readLiveErr } = await buyer1
    .from('listings')
    .select('id,status')
    .eq('id', listingId)
    .maybeSingle()
  assert(!readLiveErr && readLive?.id === listingId, 'buyer can read a live listing')

  // Saving the same listing twice yields exactly one saved entry — exercises
  // the exact upsert shape DefaultBuyerService.saveListing uses.
  const upsertSaved = () =>
    buyer1.from('saved_listings').upsert(
      { buyer_id: b1.user.id, listing_id: listingId },
      { onConflict: 'buyer_id,listing_id', ignoreDuplicates: true },
    )
  const { error: save1Err } = await upsertSaved()
  const { error: save2Err } = await upsertSaved()
  assert(!save1Err && !save2Err, 'saving twice does not error')

  const { data: countRows, error: countErr } = await svc
    .from('saved_listings')
    .select('id')
    .eq('buyer_id', b1.user.id)
    .eq('listing_id', listingId)
  assert(
    !countErr && countRows.length === 1,
    'saving the same listing twice yields exactly one saved entry',
  )

  // The shortlist read: exercises the exact join DefaultBuyerService.listShortlist uses.
  const { data: shortlistRows, error: shortlistErr } = await buyer1
    .from('saved_listings')
    .select('created_at, listings(id, address, status)')
    .eq('buyer_id', b1.user.id)
    .order('created_at', { ascending: false })
  assert(
    !shortlistErr &&
      shortlistRows.length === 1 &&
      shortlistRows[0].listings?.id === listingId,
    'the shortlist join reads back the saved listing',
  )

  // Cross-buyer isolation: buyer2 cannot read, add to, or remove buyer1's saved listings.
  const { data: b2ReadB1, error: b2ReadB1Err } = await buyer2
    .from('saved_listings')
    .select('*')
    .eq('buyer_id', b1.user.id)
  assert(
    !b2ReadB1Err && b2ReadB1.length === 0,
    "buyer2 cannot read buyer1's saved listings",
  )

  const { error: b2AddB1Err } = await buyer2
    .from('saved_listings')
    .insert({ buyer_id: b1.user.id, listing_id: listingId })
  assert(!!b2AddB1Err, "buyer2 cannot add to buyer1's saved listings")

  const { count: b2DelCount } = await buyer2
    .from('saved_listings')
    .delete({ count: 'exact' })
    .eq('buyer_id', b1.user.id)
  const { data: stillThere } = await svc
    .from('saved_listings')
    .select('id')
    .eq('buyer_id', b1.user.id)
    .eq('listing_id', listingId)
  assert(
    (b2DelCount === 0 || b2DelCount === null) && stillThere.length === 1,
    "buyer2 cannot remove buyer1's saved listings",
  )

  await svc.from('saved_listings').delete().in('buyer_id', [b1.user.id, b2.user.id])
  await svc.from('listings').delete().eq('id', listingId)
  await svc.auth.admin.deleteUser(b1.user.id)
  await svc.auth.admin.deleteUser(b2.user.id)

  if (failed) {
    console.error('\nRESULT: FAILURES ABOVE')
    process.exit(1)
  }
  console.log('\nRESULT: ALL RLS ACCEPTANCE CRITERIA PASS')
}

main().catch((e) => {
  console.error('SCRIPT ERROR', e)
  process.exit(1)
})
