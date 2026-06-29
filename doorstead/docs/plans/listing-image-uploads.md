# Plan: Listing image uploads

Source: docs/prds/listing-image-uploads.md
Feature key: listing-image-uploads  (one feature = this plan; issues get label `feat:listing-image-uploads`, work lands on branch `feat/listing-image-uploads`)

## Module interaction

Direction is one-way, matching `doorstead/CLAUDE.md` (route → service contract → db, never reversed):

```
admin route / server action (app/admin/**, lib/listings/actions.ts)
    → MediaService contract (lib/media/contract.ts)        # upload, list, reorder, retag, remove
    → ListingService contract (lib/listings/contract.ts)   # unchanged shape; now reads/writes media via input
MediaService impl (lib/media/service.ts)
    → StorageAdapter contract (lib/media/storage/contract.ts)   # put/remove bytes, public URL — logic-free wrapper
    → MediaRepository (lib/db/media-repo via server-client)     # rows in listing_media
StorageAdapter impl (lib/media/storage/supabase-storage.ts) → @supabase/supabase-js storage
ListingService impl → lib/db/* (unchanged)
PhotoGallery / dashboard cards (components/**) ← receive resolved image data as props only
```

- The `MediaService` is the new deep module: a small interface (upload one file, list a listing's media, reorder, set cover, set floorplan, remove) over a large hidden implementation (validation, variant generation, storage put/remove, row persistence, atomic ordering). Callers learn the six verbs, not the storage layout or the variant pipeline.
- The `StorageAdapter` is the only place the storage SDK is touched, exactly as `lib/db/*` is the only place the DB driver is touched. The service never imports `@supabase/*`.
- Image transformation (web-optimised + thumbnail) lives behind `MediaService`; the caller never learns it happened. It is mocked at its true boundary only (the transform library / clock), not faked into the service contract.
- `Listing.photoUrls` stays on the contract through the whole feature so legacy listings and the public read path keep working; the form and gallery move to media-derived URLs, and `photoUrls` is the migration-safe fallback (deletion test: removing media leaves legacy URLs rendering).

## Tracer bullet

One admin uploads one image file in the form; the server validates it, stores the original in Supabase Storage behind the adapter, writes one `listing_media` row, and the public listing page renders that stored image. Thinnest path through every layer: file input → server action → MediaService → StorageAdapter → DB → public gallery `<img>`. No variants, no drag-order, no cover/floorplan tag yet — those are later units, each adding one dimension of difficulty.

## Unit 1: Tracer — upload one file end to end

- What it builds: an admin attaches a single image file in the listing form; it is validated (type only), stored as the original via the adapter, persisted as one media row, and shown on the public listing page. Reuses the existing `photoUrls` render path by feeding the stored public URL into the same `<img>` gallery, so the demoable slice touches every layer with the least new surface.
- Modules + contracts:
  - `lib/media/contract.ts`
    ```ts
    export type MediaId = string
    export interface ListingMedia {
      id: MediaId
      listingId: string
      originalUrl: string
      position: number
    }
    export interface UploadResult {
      ok: true; media: ListingMedia
    } | { ok: false; reason: 'invalid_type' }
    export interface MediaService {
      uploadOriginal(listingId: string, file: UploadFile): Promise<UploadResult>
      listForListing(listingId: string): Promise<ListingMedia[]>
    }
    export interface UploadFile {
      bytes: ArrayBuffer; filename: string; contentType: string; sizeBytes: number
    }
    ```
  - `lib/media/storage/contract.ts`
    ```ts
    export interface StorageAdapter {
      put(key: string, bytes: ArrayBuffer, contentType: string): Promise<{ publicUrl: string }>
      remove(key: string): Promise<void>
    }
    ```
  - `supabase/migrations/0003_listing_media.sql` — new `listing_media` table (id, listing_id fk, storage_key, original_url, position int, created_at), RLS mirroring `listings` (anon read where parent listing is live + not deleted; authenticated all only via `admins`); a private/public storage bucket `listing-media`.
- Seams: one new seam — the `StorageAdapter` contract. Tests drive `MediaService` through a `FakeStorageAdapter` (in-memory key→bytes), asserting behavior (a row is returned with a public URL), never asserting the SDK was called. Action/route tests continue against `FakeListingService` plus a new `FakeMediaService` in `tests/media/fakes.ts`. The SDK itself is exercised only by the thin `supabase-storage.ts` adapter, which has no logic to test.
- Acceptance: a test uploading one valid image through `MediaService` (backed by `FakeStorageAdapter`) returns `{ ok: true }` with a populated `originalUrl` and `position: 0`, and `listForListing` returns it; an end-to-end check shows the public listing page renders that URL in an `<img>`.
- Blocked by: none, parallel-safe

## Unit 2: Server-side validation (type, size, count)

- What it builds: full server-side rejection of disallowed type, oversize file, and over-cap additions, with a typed reason per rejection. This is the security/correctness backbone the PRD demands ("enforced on the server, not only in the browser").
- Modules + contracts:
  - extend `lib/media/contract.ts`
    ```ts
    export type RejectReason = 'invalid_type' | 'too_large' | 'too_many'
    export interface MediaLimits {
      maxBytes: number; maxPerListing: number; allowedTypes: readonly string[]
    }
    // UploadResult.reason widened to RejectReason
    ```
  - `lib/media/schema.ts` (pure functions, mirrors `lib/listings/schema.ts`)
    ```ts
    export function validateUpload(
      file: UploadFile, existingCount: number, limits: MediaLimits,
    ): { ok: true } | { ok: false; reason: RejectReason }
    export const DEFAULT_MEDIA_LIMITS: MediaLimits
    ```
- Seams: existing — pure-function tests on `validateUpload` (the house pattern already used for `schema.test.ts` / `photo-urls.test.ts`); plus `MediaService` through `FakeStorageAdapter` to prove a rejected file is never put to storage and never written as a row.
- Acceptance: `validateUpload` returns the right `reason` for a PDF, a 10MB+1 file, and the 31st image at cap 30, and `ok` for a valid in-bounds file; a `MediaService` test confirms a rejected upload leaves storage and rows untouched.
- Blocked by: Unit 1

## Unit 3: Variants — web-optimised + thumbnail, keep original

- What it builds: every successful upload also produces a web-optimised copy and a thumbnail, stored alongside the retained original; `ListingMedia` gains `webUrl` and `thumbUrl`.
- Modules + contracts:
  - extend `lib/media/contract.ts`: `ListingMedia` gains `webUrl: string; thumbUrl: string`.
  - `lib/media/transform/contract.ts`
    ```ts
    export interface ImageTransformer {
      toWeb(bytes: ArrayBuffer, contentType: string): Promise<{ bytes: ArrayBuffer; contentType: string }>
      toThumb(bytes: ArrayBuffer, contentType: string): Promise<{ bytes: ArrayBuffer; contentType: string }>
    }
    ```
  - `MediaService.uploadOriginal` is widened internally to produce three keys (original/web/thumb) via the adapter; the contract verb is unchanged, depth grows behind it.
- Seams: existing `StorageAdapter` seam (now three `put` calls) plus the new `ImageTransformer` boundary. Drive `MediaService` through `FakeStorageAdapter` + a `FakeImageTransformer` (returns deterministic byte stubs). The real transformer (sharp/equivalent, decides HEIC handling) is mocked only at its own boundary, never faked into the service.
- Acceptance: a `MediaService` upload test (fake transformer + fake storage) yields a `ListingMedia` with three distinct, populated URLs and three stored keys; the original key is still present after variants are made.
- Blocked by: Unit 1

## Unit 4: Persist ordering, cover, and floorplan on save

- What it builds: the form's media set, its order, the cover, and the floorplan tag persist on listing save and reload on edit. Cover is exactly one (defaulting to first if unset); floorplan is at most one and independent of cover.
- Modules + contracts:
  - extend `lib/media/contract.ts`
    ```ts
    export interface ListingMedia { /* + */ isCover: boolean; isFloorplan: boolean }
    export interface MediaService {
      reorder(listingId: string, orderedIds: MediaId[]): Promise<ListingMedia[]>
      setCover(listingId: string, mediaId: MediaId): Promise<ListingMedia[]>
      setFloorplan(listingId: string, mediaId: MediaId | null): Promise<ListingMedia[]>
      remove(listingId: string, mediaId: MediaId): Promise<void>
    }
    ```
  - `supabase/migrations/0004_listing_media_flags.sql` — add `is_cover bool`, `is_floorplan bool`; a partial unique index enforcing one cover and one floorplan per `listing_id`.
  - `lib/listings/actions.ts` — `createListing`/`updateListing` read the ordered media id list + cover + floorplan from the form and call `MediaService`; each action keeps `authService.requireAdmin()` as its first line and the existing `revalidatePath('/')` / `revalidatePath('/listing/${id}')`.
- Seams: existing — action tests through `FakeMediaService` (records reorder/setCover/setFloorplan/remove calls and returns the resolved set), asserting the saved order/cover/floorplan, not call internals. DB partial-unique constraint is verified by a `MediaService`-through-`FakeStorageAdapter` test asserting setting a new cover clears the old.
- Acceptance: after save, `listForListing` returns media in the submitted order with exactly one `isCover` (first if none chosen) and at most one `isFloorplan`; reopening edit reflects the same; setting a new cover clears the previous.
- Blocked by: Unit 1, Unit 2 (validated set is what gets ordered)

## Unit 5: Public gallery + dashboard render variants and tags

- What it builds: the public listing gallery and homepage/dashboard cards render the web-optimised main image and thumbnail strip, lead with the cover, and visibly distinguish the floorplan. Frontend — implemented directly, no TDD.
- Modules + contracts:
  - `components/listing/PhotoGallery.tsx` — prop widened from `photoUrls: string[]` to `media: GalleryImage[]` where `GalleryImage = { webUrl: string; thumbUrl: string; isFloorplan: boolean }`, ordered with cover first; falls back to `photoUrls` when a listing has no media (legacy listings).
  - `app/listing/[id]/page.tsx`, `app/page.tsx`, `app/admin/(authed)/page.tsx` — resolve a listing's media (cover URL for cards) from `MediaService.listForListing`, passing resolved props down; components import no service.
- Seams: none new — pure props in, presentation out. Legacy fallback is a prop branch, covered by the existing `photoUrls` path; no test added for untouched gallery logic, only the new prop branch is exercised manually per house rule (frontend implements directly).
- Acceptance: a listing with uploaded media renders web/thumb variants with the cover first and a labelled floorplan; a legacy listing with only `photoUrls` still renders its external images (no blank).
- Blocked by: Unit 3 (variants), Unit 4 (cover/floorplan)

## Unit 6: Upload UI — multi-select, drag-drop, drag-to-reorder, progress

- What it builds: replaces `ImageUrlList` with a real uploader: multi-file select, drag-drop a batch, per-file progress and success/error, drag-to-reorder thumbnails, mark cover, tag floorplan, remove. Frontend — implemented directly, no TDD.
- Modules + contracts:
  - `components/admin/ImageUploadList.tsx` (new) — props `{ media: ListingMedia[]; onUpload: (files: File[]) => void; onReorder; onSetCover; onSetFloorplan; onRemove }`. Parent owns the upload calls; the component is presentation + interaction only. Replaces `ImageUrlList` in `ListingForm.tsx`.
  - `lib/listings/actions.ts` (or a sibling `lib/media/actions.ts`) — a server action `uploadListingImage(formData)` that gates with `requireAdmin()` and delegates to `MediaService.uploadOriginal`, returning the typed `UploadResult` so the client can show per-file success/rejection reason.
  - `ImageUrlList.tsx` and the `photoUrls` text-paste input are removed from the form; `serializePhotoUrls`/`parsePhotoUrls` stay only on the legacy read path until a future migration retires them (out of scope here).
- Seams: existing — the new server action is tested through `FakeMediaService` asserting `requireAdmin` is enforced and the typed reason is surfaced; the React component itself is implemented directly (no TDD, house rule).
- Acceptance: selecting/dragging multiple files uploads each with visible progress and a per-file success or reasoned rejection; thumbnails drag to reorder; cover and floorplan can be set; remove drops an image; publishing with zero images is still blocked by the existing guard counting media.
- Blocked by: Unit 2, Unit 3, Unit 4

---

### Parallel-safe map

- **Unit 1** — parallel-safe (foundational, blocks nothing before it).
- **Unit 2** and **Unit 3** are parallel-safe with each other: both depend only on Unit 1 and touch different files (Unit 2: `lib/media/schema.ts`; Unit 3: `lib/media/transform/*` + variant logic). Run concurrently after Unit 1.
- **Unit 4** depends on Units 1+2; not parallel with Unit 2.
- **Unit 5** depends on Units 3+4; **Unit 6** depends on Units 2+3+4. Units 5 and 6 touch different files (5: public/dashboard render; 6: admin upload UI + action) and are parallel-safe with each other once 3+4 land.

### Destructive-change note

Removing the pasted-URL input and `ImageUrlList` (Unit 6) deletes a working admin path. It is gated: legacy `photoUrls` data and its public render path are preserved (Unit 5 fallback), so no stored data is destroyed — only the authoring UI is replaced. No migration drops or rewrites existing `photo_urls` values. This passes the destructive-change gate because the change is additive at the data layer and only the input surface is swapped; confirm before deleting `ImageUrlList.tsx` in case any other route references it.
