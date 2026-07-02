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

## Code review
`/review-code` on the tracer diff. Full review: `doorstead/docs/code-reviews/age-114-tracer.md`. Spec-compliance FAIL, code-quality PASS: the tests were green, the review caught what they could not.
- Admin edit page 500s on a draft (blocker): `getImagesForRender` signs via anon, anon RLS is live-only -> sign via the server client on admin routes (client keyed off trust context, not operation).
- Public read mixes clients (minor): `listing_media` read via the server client on the public page -> route it through the anon client.
- One bad key fails the whole page via `Promise.all` (minor): deferred to Unit 3.
- Verified clean: admin gate, RLS pattern, real contract tests, no slop.

Fixed 1 and 2 with a `MediaContext` (admin vs public) seam that selects the client per trust context; 66 tests green, typecheck clean.

## Next
The series continues with loop engineering architecture.
