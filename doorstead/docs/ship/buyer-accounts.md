# Ship Log: buyer-accounts

## Head SHA (reviewed): 3a54bce7658ee0e32d242c5c4e92f89fe62b6494
## Head SHA (after fixes): 70b50dc397dc0249857444a693495a869685781e
## Head SHA (at merge): 70b50dc397dc0249857444a693495a869685781e
## CI status: green (tsc clean, 186 tests across 27 files, `next build` clean at 12 routes)
## Mergeable (no conflicts): yes (integration merge with image-uploads, conflicts resolved)
## Fresh /review-code: PASS (after the three blocker fixes below)
## Review threads: all resolved (blockers fixed, majors/minors filed)
## Decision: Merge
## Merged: yes 00d1608 (into 08_end, alongside image-uploads)

## What /review-pr found

The buyer-accounts feature (`AGE-121` to `AGE-124`) was built by the cloud routine on one `feat/buyer-accounts` branch, each issue self-reviewed by its worker and reviewed again by the orchestrator. The `/review-pr` cycle then ran a four-lens adversarial panel (security, architect/correctness, qa/tests, ops) over the whole changeset, reasoning about callers and callees the branch did not change, not just the diff. The per-issue reviews were clean; the whole-PR pass surfaced defects that only appear across the changeset.

### Blockers, all fixed before merge (test-first)

1. Middleware session refresh missed buyer routes. The matcher ran only on `/admin*`, and that middleware is the only place a rotated refresh token is written back (server components cannot set cookies). With refresh-token rotation on, a buyer who browsed only buyer pages would be silently signed out at the 1 hour JWT expiry. Fix: broaden the matcher to every app route, and scope the `no-store` header to authenticated responses so anonymous pages stay cacheable. Covered by `tests/middleware.test.ts`.

2. A unit test could not run on a fresh clone. `tests/inquiries/service.test.ts` imported the real service to reach the pure `escapeForIlike` helper, which dragged in `anon-client` (it throws at import when the Supabase env vars are absent), so `npx vitest run` was red for anyone cloning the branch without env exported. Fix: extract `escapeForIlike` into a pure module `lib/inquiries/ilike.ts` and test it there, `tests/inquiries/ilike.test.ts`. The full suite now passes with no env set.

3. `requireBuyer` labelled a database error as "is admin". It used `.catch(() => true)` on the admin-membership check, which rejected the buyer on error (fail closed, correct today) but returned a session derived from a check that never completed, a latent footgun the first time a buyer-only capability is added. Fix: fail closed with an explicit `throw` instead. Behavior-preserving; the existing error-path test in `tests/auth/service.test.ts` still passes.

### Majors and minors, filed as follow-ups (not blocking)

- `AGE-127` (major): the new `DefaultBuyerService` / `DefaultInquiryService` query methods have no contract-boundary vitest coverage. Their RLS-critical behavior is proven against a real local stack in `verify-local-rls*.mjs`; the pure mapping and guard logic is not yet unit-tested.
- `AGE-130` (major): `/` and `/listing/[id]` alias an `isAdmin` error to "is admin" via `.catch(() => true)`, hiding a signed-in buyer's header on a transient error. The mirror of blocker 3; left untouched here to keep the integration merge pure.
- `AGE-128` (minor): the shortlist silently dropped saved listings that later go unavailable. Partially mitigated in this merge (the shortlist now resolves covers through the shared render path and offers unsave), but the "no longer available" placeholder treatment is still tracked.
- `AGE-129` (minor): the committed local `supabase/config.toml` ships `enable_signup = true`, next to a policy (0007) whose safety depends on hosted signup staying off. Documentation footgun for a learner who copies local config to a hosted project.

### Ops note: migration ordering across two parallel branches

The buyer-accounts migrations are numbered `0006` / `0007`, and image-uploads holds `0003` / `0004` / `0005`. Merging image-uploads first, then buyer-accounts, into `08_end` yields a contiguous, monotonic `0001` to `0007` lineage, which is the safe `supabase db push` order. The reverse merge order would have applied `0006` / `0007` before `0003` to `0005` and broken the lineage; it was avoided by construction.

## The integration merge

`08_end` is the combined module-end state: both features merged. Image uploads (`AGE-114` to `AGE-120`) and buyer accounts (`AGE-121` to `AGE-124`) each reworked the listing UI, so the merge resolved four shared files by hand:

- `components/listing/ListingCard.tsx` and `components/listing/ListingDetail.tsx`: the card and detail now take both the image render props (`coverThumbUrl`, `images`) and the buyer props (`saveControl`, `isSaved`, header `session`).
- `app/page.tsx` and `app/listing/[id]/page.tsx`: each resolves the cover or gallery through the render path and computes the buyer's saved state, passing both to the components.
- `app/shortlist/page.tsx` was updated to resolve covers through the same render path and to offer unsave.

Verified on the merge: `tsc --noEmit` clean, 186 tests across 27 files green, `next build` clean at 12 routes plus middleware.
