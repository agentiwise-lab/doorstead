# Plan: Listing image uploads

Source: docs/prds/listing-image-uploads.md
Feature key: listing-image-uploads  (one feature = this plan; issues get label `feat:listing-image-uploads`, work lands on branch `feat/listing-image-uploads`)
Base branch: 02_begin  (`feat/listing-image-uploads` is cut from here; carry this base to every issue)

## Module interaction

One direction only. Admin route/action (`app/admin/**`, `lib/listings/actions.ts`) → `MediaService` contract (new, `lib/media/contract.ts`) for storing bytes and issuing links, and → `ListingService` contract for persisting the per-listing image list. `DefaultMediaService` (`lib/media/service.ts`) is the only caller of a new `lib/db/storage.ts` adapter that wraps Supabase Storage; `DefaultListingService` stays the only caller of the listings table. Variant generation lives behind `MediaService` (implementation detail, not a separate public seam). The public render path (`ListingCard`, `PhotoGallery`, `ListingDetail`) consumes a single resolved list of image view-models produced server-side from the listing's stored media plus any legacy URLs; UI components import no service and no DB, receiving data and callbacks as props (per `doorstead/CLAUDE.md`). Routes never import `@supabase/*`; only `lib/db/*` does.

## Data model note (for planning; SQL lives in units, not here)

Today a listing's photos are `listings.photo_urls text[]` of external URLs. This feature introduces stored media with per-image roles (order, cover, floorplan) and variant keys, which a flat `text[]` cannot carry. The plan adds a `listing_media` concept (one row per uploaded image: listing id, storage keys for original/web/thumb, position, is_cover, is_floorplan) while leaving `photo_urls` in place for legacy listings. The unified render path (Unit 7) reads both.

## Tracer bullet

Admin uploads ONE real image file on the listing edit form → `MediaService` stores the raw bytes in Doorstead's private Supabase Storage bucket and records one `listing_media` row for the listing → the public listing detail page renders that image via a private, time-limited (signed) link. Admin-only, real file bytes end to end, no variants, no validation beyond what Storage enforces, no reorder/cover/floorplan yet. This is Unit 1.

## Unit 1: Tracer — upload one image, stored by Doorstead, rendered on the public listing page

- What it builds: an authenticated admin uploads a single image file on the edit form; Doorstead stores the bytes in a private bucket and one `listing_media` row; the public listing detail gallery shows it via a signed link.
- Modules + contracts:
  - `lib/db/storage.ts` (new; only caller of Supabase Storage): `uploadObject(key: string, bytes: Uint8Array, contentType: string): Promise<void>`, `createSignedUrl(key: string, expiresInSeconds: number): Promise<string>`
  - `lib/media/contract.ts` (new): `interface MediaService { storeImage(listingId: string, file: { bytes: Uint8Array; contentType: string; filename: string }): Promise<StoredImage>; listForListing(listingId: string): Promise<StoredImage[]> }` where `StoredImage = { id: string; originalKey: string; position: number; isCover: boolean; isFloorplan: boolean }`
  - `lib/media/service.ts` (new): `class DefaultMediaService implements MediaService` — only caller of `lib/db/storage.ts` and the `listing_media` table
  - `lib/listings/actions.ts`: new server action `uploadListingImage(formData: FormData): Promise<void>` (first line `authService.requireAdmin()`)
  - `lib/listings/contract.ts`: extend read model so a listing exposes resolved image links for render, e.g. `getImagesForRender(listingId: string): Promise<RenderImage[]>` where `RenderImage = { url: string; isFloorplan: boolean }` (signed url for stored media; passthrough url for legacy)
  - migration `supabase/migrations/0003_listing_media.sql`: `listing_media` table (listing_id, original_key, position, is_cover, is_floorplan, timestamps) + private storage bucket + RLS (admin write, no anon direct object read; public reads go through signed links minted server-side)
  - `PhotoGallery` / `ListingDetail`: accept the resolved `RenderImage[]` (signed urls) instead of raw `photoUrls` for stored media
- Seams: pure-function + fake seam at the `MediaService` contract (`FakeMediaService`), matching the existing `FakeListingService` pattern in `tests/`; action test drives `uploadListingImage` against the fake. No test reaches Supabase Storage directly.
- Acceptance: given an admin session, submitting the upload action with one real image byte-payload results in one `listing_media` row and the object present under its key; loading the listing detail page renders an `<img>` whose src is a signed link that resolves to those bytes.
- Blocked by: none, parallel-safe

## Unit 2: Server-side validation (type, size, count)

- What it builds: reject non-JPEG/PNG/WebP files, files over 10 MB, and uploads that would push a listing past 30 images — enforced in the action/service, with a message naming the limit.
- Modules + contracts:
  - `lib/media/validation.ts` (new, pure): `validateUpload(file: { contentType: string; byteLength: number }, currentCount: number): { ok: true } | { ok: false; reason: 'type' | 'size' | 'count'; message: string }`; constants `ALLOWED_IMAGE_TYPES`, `MAX_IMAGE_BYTES = 10 * 1024 * 1024`, `MAX_IMAGES_PER_LISTING = 30`
  - `lib/media/contract.ts`: `storeImage` gains the documented rejection contract (throws or returns a typed rejection) so callers surface the message
  - `lib/listings/actions.ts`: `uploadListingImage` returns a typed error state carrying the rejection message instead of silently dropping
- Seams: pure-function tests on `validateUpload` (type, size boundary at exactly 10 MB, count boundary at 30); action test asserts a rejected file leaves the listing unchanged and returns the message.
- Acceptance: a `.gif`/oversized/31st-image upload is refused server-side, the listing gains no row, and the returned state names the allowed types / 10 MB / 30-image limit respectively.
- Blocked by: Unit 1

## Unit 3: Image variants (web-optimised + thumbnail, keep original)

- What it builds: on store, generate a web-optimised copy and a thumbnail alongside the retained original; record all three keys.
- Modules + contracts:
  - `lib/media/variants.ts` (new): `generateVariants(bytes: Uint8Array, contentType: string): Promise<{ web: Uint8Array; thumb: Uint8Array; webContentType: string; thumbContentType: string }>` (implementation uses an image lib such as `sharp`; kept behind this function)
  - `lib/db/storage.ts`: reused as-is (three `uploadObject` calls)
  - `lib/media/contract.ts`: `StoredImage` gains `webKey: string; thumbKey: string`; `getImagesForRender` returns `{ url, thumbUrl, isFloorplan }` — gallery hero uses `web`, filmstrip/card use `thumb`
  - migration `0004_listing_media_variants.sql`: add `web_key`, `thumb_key` columns to `listing_media`
- Seams: contract-level test through `FakeMediaService` asserting three keys are recorded and the render model exposes web + thumb urls; a focused `generateVariants` test on a real small image asserting it returns two smaller byte payloads with expected content types.
- Acceptance: storing one image produces three stored objects (original, web, thumb); the gallery hero request uses the web variant and the filmstrip/card use the thumbnail; the original remains retrievable by key.
- Blocked by: Unit 1 (needs the store path); independent of Unit 2, but sequence after it to keep the store path stable.

## Unit 4: Publish guard counts uploaded media

- What it builds: `validateForPublish` treats a listing as having a photo when it has at least one uploaded image OR at least one legacy URL, so the existing publish gate stays correct once URL input goes away.
- Modules + contracts:
  - `lib/listings/schema.ts`: `validateForPublish` (and the publish action path) take an effective image count, e.g. `validateForPublish(input, imageCount: number)`, replacing the current "`photoUrls.length >= 1`" check as the sole photo signal
  - `lib/listings/actions.ts`: `publishListing` / live-intent path passes `mediaService.listForListing(id).length + legacyUrlCount`
- Seams: pure-function tests on `validateForPublish` for the four cases (0 uploads + 0 legacy → blocked; ≥1 upload → ok; ≥1 legacy → ok; both → ok); action test that publish is refused with the photo message when count is zero.
- Acceptance: publishing a listing with zero uploaded media and zero legacy URLs is blocked naming the photo requirement; publishing with ≥1 of either succeeds.
- Blocked by: Unit 1

## Unit 5: Persist order, cover, and floorplan

- What it builds: admin actions to reorder images, set exactly-one cover, and set exactly-one floorplan, persisted per listing.
- Modules + contracts:
  - `lib/media/contract.ts`: `reorder(listingId: string, orderedImageIds: string[]): Promise<void>`, `setCover(listingId: string, imageId: string): Promise<void>`, `setFloorplan(listingId: string, imageId: string): Promise<void>`, `removeImage(listingId: string, imageId: string): Promise<void>`
  - `lib/media/service.ts`: `DefaultMediaService` implements them; `setCover`/`setFloorplan` clear the previous flag in the same write (at most one cover, at most one floorplan)
  - `lib/listings/actions.ts`: thin server actions wrapping each, each first line `authService.requireAdmin()`
  - `getImagesForRender` ordering rule: explicit cover first, else position order; floorplan tagged
- Seams: contract tests through `FakeMediaService`: reorder persists new order; setting a second cover clears the first; same for floorplan; remove drops the row. Action tests assert `requireAdmin` gate and delegation.
- Acceptance: after reorder+save+reload the order matches; at most one cover and one floorplan exist per listing; the render list leads with the cover.
- Blocked by: Unit 1 (needs media rows); reads variant keys from Unit 3 for the render model, so sequence after Unit 3.

## Unit 6: Unified render path for gallery and cards

- What it builds: one server-side resolver that merges stored media (signed web/thumb urls, ordered by cover/position) with legacy `photo_urls` into a single ordered `RenderImage[]`, consumed identically by `ListingCard` (cover = first) and `PhotoGallery`/`ListingDetail` (full gallery).
- Modules + contracts:
  - `lib/listings/contract.ts`: finalise `getImagesForRender(listingId): Promise<RenderImage[]>` as the single public read for render; `RenderImage = { url: string; thumbUrl: string; isFloorplan: boolean }`
  - `app/page.tsx`, `app/listing/[id]/page.tsx`: resolve images server-side and pass the list down; `ListingCard` takes `coverThumbUrl`, gallery takes the full list — no component imports a service
  - legacy URLs map to `{ url, thumbUrl: url, isFloorplan: false }` so mixed listings render uniformly
- Seams: pure-function test on the merge/order resolver (stored-only, legacy-only, mixed); component render stays untested per frontend rule, but the resolver output shape is asserted.
- Acceptance: a stored-only, a legacy-only, and a mixed listing all render a correct ordered cover + gallery through the same resolver, with no behavioural difference between sources.
- Blocked by: Unit 3 (variant urls), Unit 5 (order/cover/floorplan)

## Unit 7 (DESTRUCTIVE — hold for sign-off): Upload UI, removing the legacy pasted-URL input

- What it builds: replace `ImageUrlList` (pasted-URL rows) in `ListingForm` with an uploader: multi-select file picker, drag-and-drop, thumbnail previews, reorder handles, cover and floorplan toggles, remove. This DELETES the pasted-URL admin input for new/edited listings.
- Modules + contracts:
  - `components/admin/ImageUploader.tsx` (new, `'use client'`): props `{ images: UploaderImage[]; onUpload: (files: File[]) => void; onReorder; onSetCover; onSetFloorplan; onRemove }` — component takes data + callbacks only, no service import
  - `components/admin/ListingForm.tsx`: swap the `<fieldset>Photo URLs` block (the `ImageUrlList` + hidden `photoUrls`) for `ImageUploader`
  - `components/admin/ImageUrlList.tsx`: DELETED
  - `lib/listings/photo-urls.ts` (`parsePhotoUrls`/`serializePhotoUrls`) and the `photoUrls`-from-form path in `actions.ts`: DELETED from the admin write path (the `photo_urls` column and legacy read path remain for existing listings)
- Destructive-change gate: this removes a working admin capability (pasting URLs) and deletes `ImageUrlList` + the form's URL serialization. Do NOT implement until explicitly signed off. Legacy `photo_urls` data and its public read path are preserved; only the admin *input* is removed. Rollback is `git revert`, not a flag.
- Seams: frontend implemented directly (no TDD per project rule); the actions it calls are already contract-tested in Units 1–5. Deleting `parsePhotoUrls` requires removing/retargeting `tests/listings/photo-urls.test.ts` in the same unit.
- Acceptance: the edit/new form shows the uploader (no URL text inputs); multi-select and drag-drop attach images; reorder/cover/floorplan/remove work end to end against the Unit-5 actions; a legacy listing's existing photos still render on the public site.
- Blocked by: Unit 2, Unit 5, Unit 6
