# Code Review: age-123-my-inquiries (mode: diff, orchestrator second pass)

Reviewed: `git diff 9fbf896..origin/feat/buyer-accounts` (AGE-123 on top of the already-shipped, already-reviewed AGE-121/AGE-122). Independent second pass after the implementer's own self-review, run as a 3-role parallel panel (correctness, security, slop) synthesized by the orchestrator.

## Spec-compliance verdict: PASS
## Code-quality verdict: PASS (after fixes)

## Findings

- [SEV: med] [CONF: 0.75] `lib/inquiries/service.ts:26-27,68-90`
  Evidence: `escapeForIlike` and `listForBuyer` are new functions with zero unit-test coverage (only exercised by a local-stack-only verify script, not wired into `npm test`). Per CLAUDE.md "every new function gets a test." A regression to the wildcard-escaping logic would pass the suite cleanly. Missing-test gap, single correct fix: add direct tests.

- [SEV: med] [CONF: 0.85] `app/my-inquiries/page.tsx:14-18` vs `app/admin/(authed)/inquiries/page.tsx:5-9`
  Evidence: `formatDateTime` is a byte-for-byte copy of the existing admin-inquiries page's formatter — now a third near-duplicate of the same date-formatting concern in the codebase. Real, fixable duplication with a single correct solution: extract to a shared helper.

- [SEV: low] [CONF: 0.6] `app/my-inquiries/page.tsx:21-27`
  Evidence: `try { requireBuyer() } catch { redirect('/sign-in') }` collapses any error (including a transient DB failure) into a sign-in redirect. Flagged by the correctness panel, but this is a verbatim mirror of the already-reviewed-and-accepted pattern in `app/shortlist/page.tsx` from AGE-121 — not new drift, not blocking.

- [SEV: low] [CONF: 0.55-0.7] Verify-script boilerplate duplication (`supabase/verify-local-rls-inquiries-buyer-read.mjs` vs `verify-local-rls.mjs`), migration comment verbosity — both judged non-blocking: the standalone-script pattern matches AGE-121's established precedent, and the migration comment is genuine WHY reasoning, not padding.

Security panel traced the full claim chain (Google OAuth → GoTrue → `auth.users.email` → JWT → RLS `auth.jwt()->>'email'` ↔ app-side `getUser().data.user.email`) and found no exploitable issue — correctly keys off the provider-verified top-level JWT claim, never `user_metadata`. Pre-existing admin-read/anon-insert policies confirmed untouched. Two low-severity documentation/process suggestions (cite Supabase's identity-linking doc; wire the verify script into CI) — not blockers.

## Priority-ranked actions

1. Add direct unit tests for `escapeForIlike` and `listForBuyer` (via `FakeInquiryService` / a real service test).
2. Extract the duplicated `formatDateTime` into a shared helper and use it from both `app/my-inquiries/page.tsx` and `app/admin/(authed)/inquiries/page.tsx`.
