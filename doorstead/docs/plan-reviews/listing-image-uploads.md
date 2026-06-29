# Plan Review: listing-image-uploads

Adversarial design review (architect, qa, security, ops) of `docs/plans/listing-image-uploads.md`, judged at the plan's unit-breakdown altitude, every claim verified against the doorstead repo. The core design holds: `MediaService` is a genuinely deep module, `StorageAdapter` is a real two-implementation seam, and the tracer-first ordering is right. The findings are at the edges: unassigned cross-module contract changes, an omitted policy surface, cross-system atomicity, and the draft-privacy and render-resolution boundaries.

## Findings

### 1. The publish guard is never rewired to count uploaded media
- Severity: blocker
- Confidence: high
- Evidence: `validateForPublish` (`lib/listings/schema.ts`) gates on `ListingLiveSchema` → `photoUrls.min(1)`, called in two places in `lib/listings/actions.ts`: the `intent==='live'` branch of `parseListingFormData`, and `publishListing` (which re-validates from `current.photoUrls`). Uploaded media live in the new `listing_media` table; the guard never reads it. No unit's contract modifies `validateForPublish` or `publishListing`. Unit 4 calls `MediaService` only for ordering/cover/floorplan. Independently raised by qa, architect, and ops. The PRD asserts the new behaviour (US 13, AC: "the guard counts uploaded images") but Unit 6's acceptance only states it, no unit delivers it. Because Unit 6 also removes the `photoUrls` text input, a listing with uploaded media but empty `photoUrls` becomes unpublishable.
- Recommendation: Add a unit (or fold into Unit 4) that redefines the publish predicate as `mediaCount + photoUrls.length >= 1` and updates BOTH callsites. `publishListing` must fetch `MediaService.listForListing(id).length` (async) before validating, since today it validates a pure in-memory candidate. Test: media-only publishes, legacy-URL-only publishes, neither blocks.

### 2. Supabase Storage RLS is omitted; uploads will fail under the anon-key runtime
- Severity: blocker
- Confidence: high
- Evidence: The deployed app holds only `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`.env.example`, `.env.local`); the service-role key is deliberately never in the runtime, so every write passes RLS as the authenticated admin. Supabase Storage objects are governed by policies on `storage.objects`, a separate surface the plan never mentions. The plan's "RLS mirroring listings" covers only the `listing_media` table. So `StorageAdapter.put` runs under the anon key and is denied unless `0003` ships `storage.objects` policies. Failure modes: uploads 403 and Unit 1 stalls, or someone smuggles the service-role key into the runtime, breaking the env contract and bypassing RLS for the storage path.
- Recommendation: `0003` defines `storage.objects` INSERT/UPDATE/DELETE policies gated on `auth.uid() in (select user_id from admins)` and `bucket_id = 'listing-media'` (SELECT per Finding 4). State in Unit 1 that the storage write path is RLS-gated under the anon key, no service-role.

### 3. The storage-then-DB write is not atomic; partial failure orphans storage objects
- Severity: major
- Confidence: high
- Evidence: `MediaService.uploadOriginal` does N storage `put`s (1 in Unit 1, 3 in Unit 3) then one DB row insert, across two systems with no shared transaction. The words atomic, orphan, cleanup, rollback, transaction appear zero times in the plan. If the row insert fails after puts succeed, bytes are orphaned in the bucket (billed, unreferenced); if Unit 3's second of three puts fails, 1 to 2 objects orphan with no row. The PRD's "no half-stored image attaches" is satisfied only by insert-last (no orphan row), but the storage objects still leak, and no unit owns the put-succeeded-insert-failed path. Raised by qa and ops.
- Recommendation: Make insert-last the explicit contract, and add a best-effort compensating `StorageAdapter.remove` on insert failure. Test through `FakeStorageAdapter` configured to fail the Nth put: assert no row is written and no earlier keys remain. State the residual-orphan risk and whether a sweep is in or out of scope.

### 4. A public bucket plus `publicUrl` exposes draft-listing media
- Severity: major
- Confidence: high
- Evidence: `listings` RLS hides draft listings from anon. The plan mirrors that for the `listing_media` table, but `StorageAdapter.put` returns `publicUrl`, implying a public bucket, which serves every object to anyone with the URL with no row-level gating. So the table says draft media is private while the bucket says anyone with the URL can fetch it. Anything uploaded before a listing goes live leaks. The PRD out-of-scope line ("no signed-URL expiry beyond storage default") reads as public-by-default, a decision never reconciled against the draft privacy the rest of the system enforces.
- Recommendation: Choose explicitly. Given the listings model hides drafts, the consistent choice is a private bucket and `createSignedUrl` (TTL), so the adapter returns `signedUrl`, not `publicUrl`. Cheap now; a breaking adapter change later.

### 5. "One render path" forks at resolution, and a card component is missed
- Severity: major
- Confidence: high
- Evidence: The component takes one shape (`GalleryImage[]`), but the gallery now has two sources: `listing.photoUrls` (kept on the `Listing` contract) and `MediaService.listForListing` (the new table). Every page must decide "media if present, else photoUrls" and call a second service per listing; that decision is the real second path, located nowhere and smeared across three page files as `ListingMedia[] | string[]` handling. For the homepage and dashboard that is an N+1 the plan does not acknowledge. Separately, Unit 5 names `app/page.tsx` and `app/admin/(authed)/page.tsx` but not `components/listing/ListingCard.tsx`, which renders the card image from `listing.photoUrls[0]` directly (verified line 10), so uploaded-media listings would show no cover. Raised by architect (resolution fork, N+1) and ops (missing ListingCard).
- Recommendation: Resolve images behind one boundary (e.g. `MediaService.galleryFor(listing)` that internally falls back to `photoUrls`, or have the listing read join media), so the union never reaches a page. Batch the per-card lookup (`listForListings(ids)`) to avoid the N+1. Add `ListingCard.tsx` to Unit 5's touch list.

### 6. Storage key derivation is unspecified
- Severity: major
- Confidence: medium
- Evidence: `StorageAdapter.put(key, ...)` takes a `key` and `UploadFile` carries an attacker-controlled `filename`; the plan never says how `key` is built. A filename-derived key like `../0001-other/cover.png` enables cross-listing traversal or overwrite, and predictable keys make draft media enumerable if the bucket is public (compounds Finding 4). The repo already guards untrusted ids carefully (`UUID_REGEX` on every `getById`/`update`), so unguarded key construction would be out of character.
- Recommendation: Specify server-generated opaque keys in Unit 1's contract: `${listingId}/${randomUUID()}.${ext}`, where `ext` derives from the validated content type, never from `filename`. `filename` is metadata only.

### 7. Variant generation on a Vercel function has no stated runtime envelope
- Severity: major
- Confidence: medium
- Evidence: No image library in `package.json`, no `vercel.json`, default `next.config`. Unit 3 leaves the real `ImageTransformer` unspecified and inline in the upload server action. Resizing a 10 MB PNG (the configured `maxBytes`) into web and thumb variants is real CPU and memory; sharp cold-start plus a batch of 20 makes a timeout or OOM plausible on Vercel function limits. The plan treats this as depth behind a verb, which is fine architecturally but silent on the envelope.
- Recommendation: Pin the transformer (sharp) and state the budget: function memory and maxDuration, expected per-image latency at 10 MB, and behaviour for a 20-file batch. If inline resize cannot fit, move the variant step off the request path (queue or storage-side transform), which changes Unit 3's seams.

### 8. Unit 4 persists media ids before Unit 6 is the unit that produces them
- Severity: major
- Confidence: medium
- Evidence: Unit 4 (blocked by 1, 2) has `createListing`/`updateListing` read the ordered media id list, cover, and floorplan from the form, but the `uploadListingImage` action that creates `listing_media` rows is introduced in Unit 6 (blocked by 2, 3, 4). Unit 4's cover/floorplan persistence cannot be exercised end to end until Unit 6 ships; its tests pass only because `FakeMediaService` supplies ids no real path yet produces. The tracer principle (thinnest working slice) is violated for the cover/floorplan dimension.
- Recommendation: Either wire a minimal real upload action in Unit 1's tracer so media ids exist before Unit 4, or reorder so the uploader action precedes cover/floorplan persistence. State which unit first produces a real `listing_media.id` consumable by the save path.

### 9. Type validation is content-type-only and spoofable
- Severity: minor
- Confidence: high
- Evidence: Unit 2's `validateUpload` checks the client-supplied `file.contentType` against `['image/png','image/jpeg']`. A PDF, HTML, or script-bearing SVG renamed and labelled `image/png` passes, defeating the "a request that bypasses the client is rejected" acceptance. Minor because the bucket serves images and Finding 4's private path limits blast radius; it rises if the bucket stays public.
- Recommendation: Add a magic-byte sniff (PNG `89 50 4E 47`, JPEG `FF D8 FF`) in or beside `validateUpload`; treat content-type as a hint, not the gate. Pure function, fits the `schema.test.ts` pattern.

### 10. A few acceptance lines drift toward asserting call internals
- Severity: minor
- Confidence: medium
- Evidence: The house rule tests through the contract with fakes, asserting behaviour not internals. Unit 3 ("three stored keys") and Unit 6 ("asserting `requireAdmin` is enforced") are phrased ambiguously enough to invite a `vi.fn()` spy that breaks on refactor. The existing pattern (`tests/listings/actions.test.ts`) asserts via fake-recorded call arrays, which is fine.
- Recommendation: Re-word to assert observable fake state (keys present in `FakeStorageAdapter`'s map; the `requireAdmin`-throws path returns the typed reject), matching the `Fake*Calls` convention.

## Priority-Ranked Actions

1. Add an owning unit that rewires the publish guard to count media at both callsites, including `publishListing` (Finding 1, blocker).
2. Add `storage.objects` RLS policies to `0003` and state the no-service-role storage write path (Finding 2, blocker).
3. Decide bucket privacy now and shape the adapter return (`signedUrl` vs `publicUrl`) accordingly (Finding 4), and specify opaque server-generated keys (Finding 6).
4. Make the storage-then-insert path orphan-safe (insert-last plus compensating remove) with a partial-failure test (Finding 3).
5. Collapse image resolution behind one boundary, batch the per-card lookup, and add `ListingCard.tsx` to Unit 5 (Finding 5).
6. Pin the transformer and state its Vercel runtime envelope; move it off the request path if it does not fit (Finding 7).
7. Resolve the Unit 4 / Unit 6 ordering so cover/floorplan persistence is exercisable when it lands (Finding 8).
8. Add the magic-byte sniff (Finding 9) and tighten the two acceptance lines to observable fake state (Finding 10).

## Verdict

revise: the architecture is sound, but two blockers (publish guard never counts media; Storage RLS omitted under the anon-key runtime) and several seam-level majors (atomicity, draft-media privacy, forked render resolution) must be assigned to named units and tightened in the contracts before this plan is build-ready.
