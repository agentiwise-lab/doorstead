# Plan Review: listing-image-uploads

Adversarial design panel (architect, qa, security, ops) under an orchestrator judge. Reviewed at the plan's declared altitude (unit breakdown + contracts + sequencing). Tool/API claims were verified before counting as evidence.

## Findings

### sharp variant generation is unbudgeted for the serverless runtime
- Severity: major
- Confidence: medium
- Evidence: Unit 3 runs `sharp` (native libvips) inside the upload server action. The PRD allows multi-select, so one request can encode several files times three renditions. A serverless function has a bounded execution time; the plan is silent on sequential vs parallel encoding and on the timeout budget, so a large batch could exceed it.
- Recommendation: add a runtime-budget note to Unit 3: encode per file, measure on staging with real images, and if a multi-file batch risks the function timeout, move variant generation to an async job (named as the fallback, out of scope for V1).

### Storage bucket provisioning is implicit in the tracer migration
- Severity: minor
- Confidence: high
- Evidence: an ops reviewer flagged "a bucket cannot be created by a migration" as a blocker. Verified false: `storage.buckets` is a regular table, and `insert into storage.buckets (id, name, public) values ('listing-media','listing-media', false)` runs under `npx supabase db push` (the repo's only migration path per CLAUDE.md). The real gap is that Unit 1 says "create a private storage bucket" without stating it is done in SQL alongside the `storage.objects` RLS.
- Recommendation: make Unit 1's migration explicit: provision the private bucket via `insert into storage.buckets`, plus RLS on `storage.objects`, all under `db push`, nothing created out of band.

### Signed URLs plus fresh reads defeat browser and CDN caching
- Severity: minor
- Confidence: high
- Evidence: signed URLs are minted per request with a unique signature, and public routes read fresh, so identical bytes get a new `img src` each load and client/CDN caches never hit. Correct for edits-show-immediately, but the PRD's "load quickly" NFR then rests on Supabase edge, not caching.
- Recommendation: one-line note in Unit 6 that this is intentional and acceptable for the admin-focused workload, to be revisited if public traffic grows.

## Verified safe
- Unit 7 preserves the `photo_urls` column and the legacy public read path; only the admin input is removed. Rollback is `git revert`.
- Unit 7 is the only destructive step and is correctly gated for sign-off.
- Security: every upload and mutation action is admin-gated, bytes live in a private bucket served via short-lived signed links, and validation is server-side. No new public write path is introduced.

## Priority-Ranked Actions
1. Unit 3: add the runtime-budget note and the staging-measurement requirement (major).
2. Unit 1: state that the bucket and its RLS are provisioned in SQL within the migration (minor).
3. Unit 6: note the signed-URL caching trade-off (minor).

## Verdict
proceed: no structural change. Three clarifications applied to the plan; the unit breakdown, contracts, and sequencing stand.
