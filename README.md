# Reviewing the Plan and Creating Issues

_You are on `03_end`._

## Findings and decisions
Full review: `doorstead/docs/plan-reviews/listing-image-uploads.md`. Verdict: revise, applied; every fix localized to Unit 1.
- Private-bucket URL unsignable with the anon key (blocker) -> scoped anon SELECT on `storage.objects`, live listings only.
- `storage.ts` client per method unstated (major) -> server client to upload, anon client to sign.
- `getImagesForRender` ownership ambiguous (major) -> on `ListingService`, depends on `MediaService` contract only.
- Bucket-in-migration, legacy passthrough, unit ordering -> verified safe.

## Produced
- The review, and the plan revised per its three findings.
- Next in this video: the seven Linear issues (`feat:listing-image-uploads`) plus a `doorstead/docs/issues/listing-image-uploads.md` manifest.

## Next
```bash
git checkout 04_begin
```
