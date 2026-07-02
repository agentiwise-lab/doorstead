# Code Review: listing-image-uploads-unit-5  (mode: diff)

Reviewed the working diff for AGE-118 (persist image order, cover, floorplan, remove).

## Spec-compliance verdict: PASS
## Code-quality verdict: PASS

## Findings

- [SEV: low] [CONF: 0.75] lib/media/service.ts:setExclusiveFlag
  Evidence: `setCover`/`setFloorplan` issue two non-atomic UPDATEs (clear-all, then set-target). On a partial failure between the two writes the listing ends with zero flags of that kind, never two. The plan's invariant ("at most one cover / floorplan") holds even under failure, so this is acceptable. A single atomic write would require a partial-unique index (migration), which is out of scope for this unit. Recorded as a Decision; a WHY comment documents it in code.

- [SEV: low] [CONF: 0.60] lib/media/service.ts:reorder
  Evidence: `reorder` runs one UPDATE per image in a loop (N round-trips). Fine at a listing's image scale; a batch RPC would need a migration. Not material at this scale.

No correctness, security, or slop findings. All four actions gate on `authService.requireAdmin()` as their first statement (verified in diff). Tests use fakes at the contract boundary and the DB-boundary fake pattern already established in `store-image.test.ts`; each new test was watched RED before GREEN.

## Priority-ranked actions
1. None required. If DB-level enforcement of the single-cover/single-floorplan invariant is wanted later, add a partial unique index in a future migration and collapse `setExclusiveFlag` to one write.
