# Implementing an Issue

_Done. You are on `04_end`._

## Built: AGE-114, the tracer
An admin uploads one image, Doorstead stores it in a private bucket plus one `listing_media` row, and the public listing page renders it via a signed link. Backend built red-green-refactor. `feat/listing-image-uploads` was cut from `04_begin` and merged here.
- Files: migration `0003_listing_media.sql`, `lib/db/storage.ts`, `lib/media/{contract,service}.ts`, `getImagesForRender` on `ListingService`, the `uploadListingImage` action, the upload form, and the public render.
- Tests: 60 passed (10 new), typecheck clean. Contract-level `FakeMediaService`; no test touches real Supabase.

## Decisions
- Signed-URL TTL -> 1 hour.
- `getImagesForRender` owned by `ListingService`, depends on the `MediaService` contract only.
- Migration written, not applied: the shared dev database is untouched, apply it on deploy.
- A draft listing's images do not preview in admin (the anon SELECT is live-scoped); deferred to a later unit's admin UI, outside the tracer's acceptance.

## Next
The series continues with loop engineering architecture (video 5).
