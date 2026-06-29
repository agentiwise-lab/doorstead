# Plan: Listing image uploads

Source: docs/prds/listing-image-uploads.md
Feature key: listing-image-uploads  (one feature = this plan; issues get label `feat:listing-image-uploads`, work lands on branch `feat/listing-image-uploads`)

## Module interaction

Direction is one-way, matching `doorstead/CLAUDE.md` (route to service contract to db, never reversed). An admin route or server action imports the `MediaService` contract (upload, list, reorder, retag, remove) and the unchanged `ListingService` contract; it never imports `@supabase/*`. The `MediaService` implementation calls the `StorageAdapter` contract (logic-free put/remove bytes plus public URL) and a media repository through the cookie-aware server client; the `StorageAdapter` implementation is the only caller of the Supabase storage SDK, exactly as `lib/db/*` is the only caller of the DB driver. Image transformation (web-optimised copy plus thumbnail) lives behind the `MediaService` via an `ImageTransformer` seam, so the caller never learns a variant was made. `Listing.photoUrls` stays on the contract through the whole feature, and a listing with no media has its legacy URLs adapted into the gallery's image shape at read, so public components receive resolved image data as props and render through one path. UI components in `components/**` import no service and no DB.

## Tracer bullet

One admin uploads one image file in the form; the server validates its type, stores the original in Supabase Storage behind the adapter, writes one `listing_media` row, and the public listing page renders that stored image. Thinnest path through every layer: file input to server action to `MediaService` to `StorageAdapter` to db to public gallery `<img>`. No variants, no drag-order, no cover or floorplan tag yet; those are later units, each adding one dimension of difficulty. This is Unit 1.

## Unit 1: Tracer, upload one file end to end

- What it builds: an admin attaches a single image file in the listing form; it is validated for type, stored as the original via the adapter, persisted as one media row, and shown on the public listing page through the existing `<img>` gallery, touching every layer with the least new surface.
- Modules + contracts:
  - `lib/media/contract.ts`: `interface UploadFile { bytes: ArrayBuffer; filename: string; contentType: string; sizeBytes: number }`; `interface ListingMedia { id: string; listingId: string; originalUrl: string; position: number }`; `type UploadResult = { ok: true; media: ListingMedia } | { ok: false; reason: 'invalid_type' }`; `interface MediaService { uploadOriginal(listingId: string, file: UploadFile): Promise<UploadResult>; listForListing(listingId: string): Promise<ListingMedia[]> }`.
  - `lib/media/storage/contract.ts`: `interface StorageAdapter { put(key: string, bytes: ArrayBuffer, contentType: string): Promise<{ publicUrl: string }>; remove(key: string): Promise<void> }`.
  - `supabase/migrations/0003_listing_media.sql`: new `listing_media` table (id, listing_id fk, storage_key, original_url, position int, created_at), RLS mirroring `listings` (anon read where the parent listing is live and not deleted; authenticated all only via `admins`); storage bucket `listing-media`.
- Seams: one new seam, the `StorageAdapter` contract. Tests drive `MediaService` through a `FakeStorageAdapter` (in-memory key to bytes), asserting behavior (a row is returned with a public URL), never asserting the SDK was called. The thin `supabase-storage.ts` adapter has no logic to test.
- Acceptance: a test uploading one valid image through `MediaService` (backed by `FakeStorageAdapter`) returns `{ ok: true }` with a populated `originalUrl` and `position: 0`, and `listForListing` returns it; the public listing page renders that URL in an `<img>`.
- Blocked by: none, parallel-safe

## Unit 2: Server-side validation (type, size, count)

- What it builds: full server-side rejection of disallowed type, oversize file, and over-cap additions, each with a typed reason, so validation holds even when the client is bypassed.
- Modules + contracts:
  - extend `lib/media/contract.ts`: `type RejectReason = 'invalid_type' | 'too_large' | 'too_many'`; `interface MediaLimits { maxBytes: number; maxPerListing: number; allowedTypes: readonly string[] }`; `UploadResult` reason widened to `RejectReason`.
  - `lib/media/schema.ts` (pure functions, mirrors `lib/listings/schema.ts`): `function validateUpload(file: UploadFile, existingCount: number, limits: MediaLimits): { ok: true } | { ok: false; reason: RejectReason }`; `const DEFAULT_MEDIA_LIMITS: MediaLimits` with `maxBytes: 10 * 1024 * 1024`, `maxPerListing: 20`, `allowedTypes: ['image/png', 'image/jpeg']`.
- Seams: existing, pure-function tests on `validateUpload` (the house pattern already used for `schema.test.ts` and `photo-urls.test.ts`); plus `MediaService` through `FakeStorageAdapter` to prove a rejected file is never put to storage and never written as a row.
- Acceptance: `validateUpload` returns `invalid_type` for a PDF and for WebP and HEIC, `too_large` for a file over 10 MB, `too_many` for the 21st image at cap 20, and `ok` for a valid in-bounds PNG or JPEG; a `MediaService` test confirms a rejected upload leaves storage and rows untouched while valid siblings in the same batch still store.
- Blocked by: Unit 1

## Unit 3: Variants, web-optimised copy and thumbnail, keep original

- What it builds: every successful upload also produces a web-optimised copy and a thumbnail, stored alongside the retained original; `ListingMedia` gains `webUrl` and `thumbUrl`.
- Modules + contracts:
  - extend `lib/media/contract.ts`: `ListingMedia` gains `webUrl: string; thumbUrl: string`.
  - `lib/media/transform/contract.ts`: `interface ImageTransformer { toWeb(bytes: ArrayBuffer, contentType: string): Promise<{ bytes: ArrayBuffer; contentType: string }>; toThumb(bytes: ArrayBuffer, contentType: string): Promise<{ bytes: ArrayBuffer; contentType: string }> }`. The transformer returns the same content type it is given; resizes are same-format, no conversion.
  - `MediaService.uploadOriginal` widens internally to produce three keys (original, web, thumb) via the adapter; the contract verb is unchanged, depth grows behind it.
- Seams: existing `StorageAdapter` seam (now three `put` calls) plus the new `ImageTransformer` boundary. Drive `MediaService` through `FakeStorageAdapter` plus a `FakeImageTransformer` (deterministic byte stubs). The real transformer is mocked only at its own boundary, never faked into the service.
- Acceptance: a `MediaService` upload test (fake transformer plus fake storage) yields a `ListingMedia` with three distinct, populated URLs and three stored keys, all the same format as the input, and the original key is still present after variants are made.
- Blocked by: Unit 1

## Unit 4: Persist ordering, cover, and floorplan on save

- What it builds: the form's media set, its order, the cover, and the floorplan tag persist on listing save and reload on edit. Cover is exactly one (defaulting to first if unset); floorplan is at most one and independent of cover.
- Modules + contracts:
  - extend `lib/media/contract.ts`: `ListingMedia` gains `isCover: boolean; isFloorplan: boolean`; `interface MediaService` gains `reorder(listingId: string, orderedIds: string[]): Promise<ListingMedia[]>`, `setCover(listingId: string, mediaId: string): Promise<ListingMedia[]>`, `setFloorplan(listingId: string, mediaId: string | null): Promise<ListingMedia[]>`, `remove(listingId: string, mediaId: string): Promise<void>`.
  - `supabase/migrations/0004_listing_media_flags.sql`: add `is_cover bool`, `is_floorplan bool`; partial unique indexes enforcing at most one cover and one floorplan per `listing_id`.
  - `lib/listings/actions.ts`: `createListing` and `updateListing` read the ordered media id list, cover, and floorplan from the form and call `MediaService`; each action keeps `authService.requireAdmin()` as its first line and the existing `revalidatePath('/')` and `revalidatePath('/listing/${id}')`.
- Seams: existing, action tests through `FakeMediaService` (records reorder/setCover/setFloorplan/remove and returns the resolved set), asserting the saved order, cover, and floorplan, not call internals; a `MediaService`-through-`FakeStorageAdapter` test asserts setting a new cover clears the old.
- Acceptance: after save, `listForListing` returns media in the submitted order with exactly one `isCover` (first if none chosen) and at most one `isFloorplan`; reopening edit reflects the same; setting a new cover clears the previous and tagging a second floorplan clears the first.
- Blocked by: Unit 1, Unit 2

## Unit 5: Public gallery and dashboard render variants and tags

- What it builds: the public listing gallery and homepage and dashboard cards render the web-optimised main image and thumbnail strip, lead with the cover, and badge the floorplan. Frontend, implemented directly, no TDD.
- Modules + contracts:
  - `components/listing/PhotoGallery.tsx`: prop widened from `photoUrls: string[]` to `media: GalleryImage[]` where `GalleryImage = { webUrl: string; thumbUrl: string; isFloorplan: boolean }`, ordered cover first; a plain `<img>` per house rule, never `next/image`.
  - `lib/media/gallery.ts`: pure mapper `toGalleryImages(input: ListingMedia[] | string[]): GalleryImage[]` that normalises uploaded media and legacy `photoUrls` into one shape, so the gallery has a single render path.
  - `app/listing/[id]/page.tsx`, `app/page.tsx`, `app/admin/(authed)/page.tsx`: resolve a listing's media from `MediaService.listForListing` (cover URL for cards), passing resolved props down; components import no service.
- Seams: the pure mapper `toGalleryImages` gets a pure-function test (both an uploaded-media set and a legacy `photoUrls` set normalise into `GalleryImage[]`); the component is implemented directly per house rule.
- Acceptance: a listing with uploaded media renders web and thumb variants with the cover first and a badged floorplan; a listing with no media but a non-empty `photoUrls` still renders its external images through the same path, with no blank gallery.
- Blocked by: Unit 3, Unit 4

## Unit 6: Upload UI, multi-select, drag-drop, drag-to-reorder, progress

- What it builds: replaces `ImageUrlList` with a real uploader: multi-file select, drag-drop a batch, per-file progress and success or reasoned rejection, drag-to-reorder thumbnails, mark cover, tag floorplan, remove. Frontend, implemented directly, no TDD.
- Modules + contracts:
  - `components/admin/ImageUploadList.tsx` (new): props `{ media: ListingMedia[]; onUpload: (files: File[]) => void; onReorder: (orderedIds: string[]) => void; onSetCover: (id: string) => void; onSetFloorplan: (id: string | null) => void; onRemove: (id: string) => void }`; presentation and interaction only, replaces `ImageUrlList` in `ListingForm.tsx`.
  - `lib/media/actions.ts`: server action `uploadListingImage(formData: FormData): Promise<UploadResult>` that gates with `authService.requireAdmin()` and delegates to `MediaService.uploadOriginal`, returning the typed `UploadResult` so the client shows per-file success or rejection reason.
  - remove `components/admin/ImageUrlList.tsx` and the `photoUrls` text-paste input from the form; `parsePhotoUrls` and `serializePhotoUrls` stay only on the legacy read path. This removal is gated through `/destructive-change-gate`: legacy `photoUrls` data is preserved and still renders via Unit 5, no migration drops or rewrites `photo_urls`, only the authoring UI is swapped; confirm before deleting `ImageUrlList.tsx` in case another route references it.
- Seams: existing, the server action is tested through `FakeMediaService` asserting `requireAdmin` is enforced and the typed reason is surfaced; the React component is implemented directly, no TDD per house rule.
- Acceptance: selecting or dragging multiple files uploads each with visible progress and a per-file success or reasoned rejection, valid files in a batch storing even when a sibling is rejected; thumbnails drag to reorder; cover and floorplan can be set; remove drops an image; publishing with zero images is still blocked by the existing guard counting media.
- Blocked by: Unit 2, Unit 3, Unit 4
