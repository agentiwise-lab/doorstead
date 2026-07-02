# Merging Agent PRs

_Done. You are on `07_end`._

## Reviewed and merged: AGE-115 to AGE-120
The loop's one pull request (`feat/listing-image-uploads`) was reviewed at the PR boundary and squash-merged into the trunk. AGE-120 (the destructive upload UI) was held by the loop for sign-off, then a human approved it; it was implemented as its own reviewed change and merged with the rest.

## The review found three issues, all fixed before merge
`/review-pr` ran a cross-file panel, correctness, security, and tests/scope, over the whole changeset, the coherence the per-issue reviews never saw:
- **Major (correctness):** newly uploaded images all shared `position = 0` with no tiebreaker, so image order and the cover fallback were non-deterministic until a manual reorder. Fixed with a stable `created_at` secondary sort in `listForListing`.
- **Minor (AGE-125):** reorder renumbered only the displayed images, corrupting positions when a tile was hidden. Fixed to assign positions across the full stored set, appending hidden rows.
- **Minor (AGE-126):** `storeImage` could orphan storage objects on a partial upload failure. Fixed to best-effort remove every already-written object before rethrowing.
- **Security and tests/scope:** clean.

All three were fixed on the branch before the merge, not deferred, so the trunk lands correct.

## The gate
CI green (105 tests, typecheck, build), no merge conflicts, a fresh review PASS at the head SHA after the fixes, no open threads. Merged on explicit human confirmation.

## Artifacts
- `doorstead/docs/ship/listing-image-uploads.md`: the `/review-pr` merge log.

## Check
```bash
git diff 07_begin..07_end
```
