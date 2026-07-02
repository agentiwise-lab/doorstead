# Ship Log: listing-image-uploads

## Head SHA (reviewed): e58a752444ee963eff7c12816f01bcc7b7a5547e
## Head SHA (at merge):  e58a752444ee963eff7c12816f01bcc7b7a5547e
## CI status: green (102 tests, tsc --noEmit clean, next build clean)
## Mergeable (no conflicts): yes
## Fresh /review-code: PASS (after the major fix below)
## Review threads: all resolved
## Decision: Merge
## Merged: yes (squash into 04_end / recorded on 07_end)

## The PR
One pull request, `feat/listing-image-uploads` into `04_end`, carrying AGE-115 to AGE-119 (validation, variants, publish guard, order/cover/floorplan, one render path) plus AGE-120 (the destructive upload UI). AGE-120 was held by the loop for sign-off; a human approved it, and it was implemented as its own reviewed change and merged with the rest.

## Review panel (cross-file coherence, the coherence per-issue passes never saw)
- **Correctness — 1 major, 1 minor**
  - MAJOR: `lib/media/service.ts` `listForListing` sorted by `position` only; newly uploaded images all share the default `position = 0`, so image order and the cover fallback were non-deterministic (arbitrary Postgres order, flips between reloads) until a manual reorder. **FIXED before merge:** stable `created_at` secondary sort in `listForListing`, falling ties back to upload order (commit `e58a752`, one new test).
  - MINOR: reorder renumbers only the displayed images, corrupting positions if a tile was dropped for a signing failure. Filed as **AGE-125**.
- **Security — no findings.** All 10 admin actions gate on `requireAdmin()` first; the two-client (anon vs server) pattern is never mixed; the anon read policy (migration 0005) scopes to live listings only, so a draft's objects are unreadable to anon; upload validation (type/size/count) has no new bypass; no untrusted input reaches storage keys or SQL.
- **Tests / scope / slop — no findings.** No test tampering (the flipped `photoUrls` assertion and the `photo-urls.test.ts` deletion both track deliberate source changes); every touched function has a contract-boundary test with real `Fake*` classes; no scope creep; conventions hold (deep modules, plain `<img>`, force-dynamic public routes). One minor noted: `storeImage` can orphan storage objects on a partial upload failure. Filed as **AGE-126**.

## Merge
Squash-merged, one clean revertable commit on the trunk. The trunk re-verifies green from a clean checkout. AGE-120 was signed off and merged with the rest; the two minors ride as tracked follow-ups.
