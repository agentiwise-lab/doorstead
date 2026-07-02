# Merging Agent PRs

_Done. You are on `07_end`._

## Reviewed and merged: AGE-115 to AGE-119
The loop's one pull request (`feat/listing-image-uploads`) was reviewed at the PR boundary and squash-merged into the trunk. AGE-120 stays held at the issue level; it was never in the PR.

## The review found one real defect
`/review-pr` ran a cross-file panel, correctness, security, and tests/scope, over the whole changeset, the coherence the per-issue reviews never saw:
- **Major (correctness):** newly uploaded images all shared `position = 0` with no tiebreaker, so image order and the cover fallback were non-deterministic until a manual reorder. Fixed before merge with a stable `created_at` secondary sort in `listForListing`.
- **Minor:** reorder renumbers only the displayed images (AGE-125); `storeImage` can orphan storage objects on a partial upload failure (AGE-126). Both filed as follow-ups.
- **Security and tests/scope:** clean.

## The gate
CI green (102 tests, typecheck, build), no merge conflicts, a fresh review PASS at the head SHA after the fix, no open threads. Merged on explicit human confirmation.

## Artifacts
- `doorstead/docs/ship/listing-image-uploads.md`: the `/review-pr` merge log.

## Check
```bash
git diff 07_begin..07_end
```
