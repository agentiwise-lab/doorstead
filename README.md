# Reviewing the Plan and Creating Issues

_You are on `03_end`._

## Review findings
Adversarial design panel over the plan. Full review: `doorstead/docs/plan-reviews/listing-image-uploads.md`; fixes applied to `doorstead/docs/plans/listing-image-uploads.md`.
- Unbudgeted `sharp` on serverless (major): added a runtime-budget note to Unit 3 (measure on staging, async job is the out-of-scope fallback).
- Bucket provisioning implicit (minor): an ops reviewer called it a blocker; verified false, a private bucket is created in SQL via `insert into storage.buckets` under `db push`, so Unit 1 now says that.
- Signed URLs defeat caching (minor): intentional, noted in Unit 6.
- Safe: legacy `photo_urls` preserved, destructive gate on Unit 7, every action admin-gated.
- Verdict: proceed, no structural change.

## Produced
- The review, and the plan updated with the three fixes.
- Next in this video: the seven Linear issues (`feat:listing-image-uploads`) plus a `doorstead/docs/issues/listing-image-uploads.md` manifest.

## Next
```bash
git checkout 04_begin
```
