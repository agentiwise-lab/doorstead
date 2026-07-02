# Code Review: age-121-buyer-accounts (mode: diff, orchestrator second pass)

Reviewed: `git diff origin/04_02_end_conductor...feat/buyer-accounts`. Independent second pass after the implementer's own self-review (see `age-121-buyer-accounts.md`), run as a 4-role parallel panel (correctness, security, slop, performance) synthesized by the orchestrator.

## Spec-compliance verdict: PASS (after one fix)
## Code-quality verdict: PASS

## Findings

- [SEV: med] [CONF: 0.6] `app/sign-in/page.tsx:9,11`
  Evidence: `searchParams: { next?: string }` is typed as a single string, but Next.js 14's App Router delivers a repeated query key (`?next=/a&next=/b`) as `string[]`. `sanitizeNextPath` (`lib/auth/next-path.ts`) assumes a string and its `containsControlCharacter` helper calls `.charCodeAt(i)` on the value, which throws `TypeError: raw.charCodeAt is not a function` on an array — an uncaught exception crashing `/sign-in` (500) instead of falling back to `/shortlist` as intended. Confirmed independently by both the correctness and security review roles. Not exploitable as an open redirect (the callback route reads `next` via `URLSearchParams.get()`, always a string or null, so that path is unaffected) — this is a robustness/availability bug isolated to the sign-in entry page.

- [SEV: low] [CONF: 0.5] `lib/buyers/service.ts` (join query)
  Evidence: selects `deleted_at` on the nested `listings` resource but never reads it (`ListingRow`/`toListing()` don't use it) — harmless dead column, RLS already filters `deleted_at is null` for the `authenticated` role.

- [SEV: low] [CONF: 0.5] `lib/buyers/service.ts` (cast)
  Evidence: `data as unknown as SavedListingRow[]` — unnecessary double cast where a single `as SavedListingRow[]` (the pattern used elsewhere in the codebase) would compile fine.

- [SEV: low] [CONF: 0.5] `app/shortlist/page.tsx` (redirect)
  Evidence: `redirect('/sign-in?next=%2Fshortlist')` is redundant — `sanitizeNextPath`'s own `FALLBACK` is already `/shortlist`, so the explicit param duplicates the default one file away.

## Priority-ranked actions

1. Fix `app/sign-in/page.tsx` to normalize `searchParams.next` (or the sanitizer itself) so a `string[]` doesn't crash the page — e.g. `Array.isArray(raw) ? raw[0] : raw` before sanitizing.
2. (Optional, not blocking) Drop the unused `deleted_at` column from the shortlist join select, simplify the double cast, and drop the redundant `next` param on the sign-in redirect.

Security panel additionally verified: no privilege-escalation path to `admins`, `saved_listings` RLS is correctly owner-scoped (`USING`/`WITH CHECK` symmetric), the buyer gate fails closed on an `isAdmin()` error, and the previously-fixed open-redirect in `sanitizeNextPath` has no bypass under ~20 fuzzed payload classes. Performance panel found no findings above its confidence bar.
