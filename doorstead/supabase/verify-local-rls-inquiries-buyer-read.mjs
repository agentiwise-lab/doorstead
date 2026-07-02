// Reproduces, against a real `supabase start` local stack, the RLS-enforced
// guarantee that a vitest fake cannot prove for AGE-123: a signed-in buyer
// reads exactly the inquiries carrying their own account email — including
// ones sent before the account existed or while logged out — and no others;
// anon still cannot read any inquiry; admins still read all inquiries. Run
// this after migrations through 0007_inquiries_buyer_read.sql have been
// applied.
//
// Usage (from doorstead/, with the local stack already running):
//   node supabase/verify-local-rls-inquiries-buyer-read.mjs
//
// Reads connection details the same way supabase/verify-local-rls.mjs does:
// the local stack's fixed demo-project anon/service-role keys unless
// overridden via SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@doorstead.test'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Passw0rd!demo'

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
      address: '1 Buyer Inquiry Read Street',
      type: 'House',
      price_gbp: 150000,
      status: 'live',
    })
    .select('id')
    .single()
  if (listingErr) throw listingErr
  const listingId = listing.id

  const buyer1Email = 'verify-inquiry-buyer1@rls-verify.local'
  const buyer1EmailMixedCase = 'Verify-Inquiry-Buyer1@RLS-Verify.local'
  const buyer2Email = 'verify-inquiry-buyer2@rls-verify.local'
  const buyer3Email = 'verify-inquiry-buyer3-no-match@rls-verify.local'
  const otherEmail = 'someone-else@rls-verify.local'

  // email_confirm mirrors what a real Google sign-in gets: an auth.users row
  // whose top-level email is set from a provider-verified address, with no
  // client-reachable path to change it (there is no updateUser({ email })
  // call anywhere in this app). Password sign-in here is only a stand-in for
  // driving that same auth.users.email claim — Google OAuth itself cannot be
  // scripted in this harness.
  const { data: b1, error: b1Err } = await svc.auth.admin.createUser({
    email: buyer1Email,
    password: 'Passw0rd!buyer1',
    email_confirm: true,
  })
  if (b1Err) throw b1Err
  const { data: b2, error: b2Err } = await svc.auth.admin.createUser({
    email: buyer2Email,
    password: 'Passw0rd!buyer2',
    email_confirm: true,
  })
  if (b2Err) throw b2Err
  const { data: b3, error: b3Err } = await svc.auth.admin.createUser({
    email: buyer3Email,
    password: 'Passw0rd!buyer3',
    email_confirm: true,
  })
  if (b3Err) throw b3Err

  // Four inquiries, inserted as service role so RLS never gates the setup
  // itself: one predating buyer1's account (by email, not by any buyer_id —
  // there is no such column) in buyer1's exact account casing, a second
  // predating it in DIFFERENT casing (the public form never normalizes
  // case — this proves the lower()-normalized match in migration 0007,
  // not just an exact-case one), one for buyer2, and one for a third party
  // who never signs up at all.
  const { error: insertErr } = await svc.from('inquiries').insert([
    { listing_id: listingId, name: 'Buyer One', email: buyer1Email, phone: '+44 7700 900001' },
    { listing_id: listingId, name: 'Buyer One (different casing)', email: buyer1EmailMixedCase, phone: '+44 7700 900004' },
    { listing_id: listingId, name: 'Buyer Two', email: buyer2Email, phone: '+44 7700 900002' },
    { listing_id: listingId, name: 'Third Party', email: otherEmail, phone: '+44 7700 900003' },
  ])
  if (insertErr) throw insertErr

  const buyer1 = createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await buyer1.auth.signInWithPassword({
    email: buyer1Email,
    password: 'Passw0rd!buyer1',
  })

  // Buyer1 reads both their own-email inquiries — including the fact they
  // were inserted before this sign-in ever happened, i.e. "sent before the
  // account existed / while logged out" is satisfied by construction since
  // the match is keyed on email, not on any buyer_id foreign key — AND the
  // one submitted in different letter-casing, proving the match is
  // case-insensitive rather than a byte-for-byte comparison.
  const { data: buyer1Rows, error: buyer1Err } = await buyer1
    .from('inquiries')
    .select('id, email')
  assert(
    !buyer1Err &&
      buyer1Rows.length === 2 &&
      buyer1Rows.every(
        (row) => row.email.toLowerCase() === buyer1Email.toLowerCase(),
      ),
    'a signed-in buyer reads exactly their own-email inquiries regardless of casing, and none other',
  )

  const anon = createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: anonRows, error: anonErr } = await anon
    .from('inquiries')
    .select('id')
  assert(
    !anonErr && anonRows.length === 0,
    'an anonymous (signed-out) client still cannot read any inquiry',
  )

  const admin = createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await admin.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })
  const { data: adminRows, error: adminErr } = await admin
    .from('inquiries')
    .select('id, email')
    .in('email', [buyer1Email, buyer1EmailMixedCase, buyer2Email, otherEmail])
  assert(
    !adminErr && adminRows.length === 4,
    'an administrator still reads all inquiries, including ones matching no buyer session',
  )

  const buyer2Client = createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await buyer2Client.auth.signInWithPassword({
    email: buyer2Email,
    password: 'Passw0rd!buyer2',
  })
  const { data: buyer2Rows, error: buyer2Err } = await buyer2Client
    .from('inquiries')
    .select('id, email')
  assert(
    !buyer2Err &&
      buyer2Rows.length === 1 &&
      buyer2Rows[0].email === buyer2Email,
    "buyer2 reads exactly their own-email inquiry, never buyer1's",
  )

  const buyer3Client = createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await buyer3Client.auth.signInWithPassword({
    email: buyer3Email,
    password: 'Passw0rd!buyer3',
  })
  const { data: buyer3Rows, error: buyer3Err } = await buyer3Client
    .from('inquiries')
    .select('id')
  assert(
    !buyer3Err && buyer3Rows.length === 0,
    'a buyer with no matching inquiries reads zero rows, not an error',
  )

  await svc
    .from('inquiries')
    .delete()
    .in('email', [buyer1Email, buyer1EmailMixedCase, buyer2Email, otherEmail])
  await svc.from('listings').delete().eq('id', listingId)
  await svc.auth.admin.deleteUser(b1.user.id)
  await svc.auth.admin.deleteUser(b2.user.id)
  await svc.auth.admin.deleteUser(b3.user.id)

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
