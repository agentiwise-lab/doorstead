# Code Review: age-121-buyer-accounts (mode: diff)

## Spec-compliance verdict: PASS
## Code-quality verdict: PASS

Reviewed via a 7-role adversarial panel (correctness, security, performance, slop, architect, qa, ops) against `git diff HEAD` on `feat/buyer-accounts`, cut from `origin/04_02_end_conductor`. All blocker- and major-severity findings below were fixed and re-verified before this verdict; findings marked "not fixed" were judged out of scope or already adequately mitigated, with reasoning recorded.

## Findings

- [SEV: blocker] [CONF: 0.92] `lib/auth/next-path.ts` (fixed)
  Evidence: `sanitizeNextPath` only rejected `//` and `\`. The WHATWG URL parser strips ASCII tab/CR/LF before parsing, so `/\t/evil.com` passed the string checks unchanged (starts with a single `/`) but resolved to `http://evil.com/` once `new URL()` parsed it in `app/auth/callback/route.ts`. Open redirect (CWE-601) right after a trust-building OAuth flow. Independently reproduced with `node -e "new URL('/\t/evil.com','http://localhost:3000').href"` → `http://evil.com/`.
  Fix: reject any control character (`charCodeAt <= 0x1f`) outright, then independently re-verify by resolving the candidate path against a fixed trusted origin and checking `resolved.origin` matches, rather than trusting prefix checks alone. Regression tests added in `tests/auth/next-path.test.ts` (tab/CR/LF cases) and `tests/auth/callback.test.ts` (full round-trip), verified RED against the pre-fix code before the fix, GREEN after.

- [SEV: major] [CONF: 0.80] `app/admin/login/page.tsx:9` (fixed)
  Evidence: this file is unmodified by the feature diff but calls `authService.isAdmin(session.userId)` unwrapped. The diff changes `isAdmin()` from swallowing a query error to `false` into throwing it (needed so `requireBuyer()` can fail closed). This unaudited caller would have turned a transient admins-table read error into an unhandled exception on the admin login page instead of gracefully falling through to the login form — a regression in a live, working feature.
  Fix: wrapped the call in `.catch(() => false)`, restoring the exact prior graceful-degradation behavior while keeping `isAdmin()`'s new throw-on-error contract for callers that need to distinguish "confirmed not admin" from "could not determine" (`requireAdmin`, `requireBuyer`).

- [SEV: major] [CONF: 0.75] `lib/auth/service.ts:68-86` (`getGoogleSignInUrl`) (fixed)
  Evidence: the only test for this method exercised solely the error branch; the mock ignored whatever `redirectTo`/`provider` arguments were passed, so the host/x-forwarded-proto/localhost-fallback logic and the `next`-encoding template string were unverified — breaking that logic would not fail any test.
  Fix: extended the test's Supabase-client stub to capture the `signInWithOAuth` call arguments, and added 4 tests asserting the constructed `redirectTo` for: normal host+proto, localhost fallback (no proto header), non-localhost fallback, and missing host header.

- [SEV: minor] [CONF: 0.6] `tests/auth/service.test.ts` (fixed)
  Evidence: "returns false for an empty code without calling Supabase" asserted only the return value, not that Supabase was actually skipped.
  Fix: added a call counter to the stub client and asserted it stayed at 0.

- [SEV: minor→resolved] Migration numbering (`0006_buyer_accounts.sql`) — not a defect. The slop reviewer flagged this as "should be 0003" reading CLAUDE.md's numbering convention in isolation; the QA and architect reviewers, and the implementer's original brief, confirm `origin/feat/listing-image-uploads` already claims `0003`-`0005` from the same migration lineage, and the issue's own "Migration numbering" instructions require checking that branch and picking the next number after it. 0006 is correct per the actual instructions; no change made.

- [SEV: minor] [CONF: 0.55-0.7] Documentation/reproducibility gaps (fixed) — QA flagged the local-Postgres RLS verification (buyer isolation, idempotent save, live-listing read) as "unreproducible tribal knowledge" (no committed script); architect flagged `supabase/config.toml`'s addition as undocumented in CLAUDE.md; ops flagged the callback route's missing explicit `dynamic` export.
  Fix: committed `supabase/verify-local-rls.mjs` (rerunnable, documented, exercises the exact upsert/join shapes `DefaultBuyerService` uses, extended to also assert the shortlist-join read-back per QA's Criterion-1 gap) and added `export const dynamic = 'force-dynamic'` to `app/auth/callback/route.ts`. Updated `CLAUDE.md`: buyer auth gate section, Google OAuth provisioning runbook step, two-Supabase-clients description, module-direction component exception, SQL-migrations pointer to the verify script, and the project-shape tree.

- Not fixed, judged acceptable:
  - `lib/db/server-client.ts:22-29` swallowed cookie-set errors (security, CONF 0.4) — pre-existing file, untouched by this diff, not independently exploitable per the reviewer's own assessment (observability gap, not a bypass). Out of this diff's scope.
  - `getGoogleSignInUrl`'s host-header-derived origin (correctness, CONF 0.4) — mitigated operationally via Supabase's own redirect-URL allowlist (now documented as a required provisioning step in CLAUDE.md), not something app code can further constrain.
  - `saveListing`'s raw upsert error on a malformed/hand-crafted `listingId` (correctness, CONF 0.25) — not reachable via the normal UI (the form's hidden input always carries a real listing UUID); the FK constraint provides a clear backstop. Two independent reviewers rated this low severity/confidence; deferred rather than gold-plated.
  - `app/(buyer)/layout.tsx` route-group guard vs. the inlined guard in `app/shortlist/page.tsx` (QA, architectural preference) — an earlier plan document (`docs/plans/buyer-accounts.md`) sketched a shared layout guard for reuse across future buyer pages (shortlist, my-inquiries). Functionally equivalent for this issue's scope (verified via real HTTP: unauthenticated/admin → redirected to `/sign-in`); the reusable-layout refactor is better done when the second buyer page (`/my-inquiries`, a separate future issue) actually exists, to avoid speculative structure now.

## Priority-ranked actions

1. ~~Fix the tab/CR/LF open-redirect bypass in `sanitizeNextPath`.~~ Done.
2. ~~Fix `app/admin/login/page.tsx`'s unwrapped `isAdmin()` call.~~ Done.
3. ~~Add real test coverage for `getGoogleSignInUrl`'s URL construction.~~ Done.
4. ~~Commit a reproducible local-stack RLS verification script and document it.~~ Done.
5. Follow-up (not blocking): when a second buyer page is built, extract the inline `requireBuyer()` guard in `app/shortlist/page.tsx` into a shared `app/(buyer)/layout.tsx`, mirroring `app/admin/(authed)/layout.tsx`.
