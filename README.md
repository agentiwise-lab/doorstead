# Reviewing the Plan and Creating Issues

_You are on `03_end`._

## Review findings
Adversarial design panel over the plan. Full review: `doorstead/docs/plan-reviews/listing-image-uploads.md`; fixes applied to Unit 1 of `doorstead/docs/plans/listing-image-uploads.md`.
- Public render cannot sign a private-bucket URL with only the anon key (blocker): fixed with a scoped anon SELECT on `storage.objects` limited to live-listing objects, written into Unit 1's contract.
- `storage.ts` client wiring unstated (major): `uploadObject` uses the server client, `createSignedUrl` the anon client; pinned per method.
- `getImagesForRender` ownership ambiguous (major): lives on `ListingService`, impl depends on the `MediaService` contract only; settled in Unit 1 before Units 3/5/6 extend it.
- Verified safe: bucket-in-migration is valid, legacy passthrough and unit ordering hold.
- Verdict: revise, then applied. No structural change; every fix localized to Unit 1.

## Produced
- The review, and the plan revised per its three findings.
- Next in this video: the seven Linear issues (`feat:listing-image-uploads`) plus a `doorstead/docs/issues/listing-image-uploads.md` manifest.

## Next
```bash
git checkout 04_begin
```
