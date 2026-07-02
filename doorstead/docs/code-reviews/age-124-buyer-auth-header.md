# Code Review: age-124-buyer-auth-header (mode: diff)

## Spec-compliance verdict: PASS
## Code-quality verdict: PASS

Reviewed the working diff for AGE-124 ("Buyer sign-in / sign-out entry point
in the public header, and admin-boundary check") on `feat/buyer-accounts`,
against the issue's three acceptance criteria. Panel: correctness, security,
performance, slop, run in parallel; each independently re-ran `tsc --noEmit`
and `vitest run`.

## Findings

No blocker or major findings from any panelist.

- [SEV: minor] [CONF: 0.15] `tests/auth/actions.test.ts:87-91`
  Evidence: the "redirects buyers to the public home when bound to /" test is
  mildly redundant with the preceding "redirects to the caller-supplied
  target" test (same assertion shape, different literal). Judged justified,
  not fake: it covers the second real call site (`/`) this diff introduces,
  and mutating the implementation (hardcoding either target) breaks one test
  or the other. Not changed.

- [SEV: minor] [CONF: 0.1] `components/admin/LogoutButton.tsx:5`,
  `components/ui/BuyerAuthCluster.tsx:27`
  Evidence: `'/admin/login'` and `'/'` are each bound at a single call site
  via `logout.bind(null, ...)`. Standard Next.js literal-at-call-site usage;
  no shared constant is warranted (the flagged `'/admin/login'` reappearing
  in `app/admin/(authed)/layout.tsx:21` is a pre-existing, unrelated redirect
  untouched by this diff, not a duplicate this diff introduced). Not changed.

- Correctness reviewer noted a documentation-only deviation from
  `docs/plans/buyer-accounts.md`'s Unit 4 write-up, which specified a
  separate `buyerLogout()` alongside an untouched admin `logout()`. This
  diff instead parameterizes the single `logout(redirectTo: string)` and
  binds the target at each of the two call sites. Both call sites were
  verified to produce the plan's required behavior (admin → `/admin/login`,
  buyer → `/`), and this shape was the design explicitly handed down for
  this unit's implementation (avoids duplicating the signOut-then-redirect
  logic across two near-identical functions). Not a correctness bug; no
  change made.

## Deliberately not changed (considered, judged non-issues)

- The "Sign in with Google" control in the header is a `<Link href="/sign-in">`
  to the existing sign-in page rather than a form that triggers the Google
  OAuth redirect directly. This reuses the already-built `/sign-in` page
  (branding, `SignInForm`) instead of duplicating the OAuth-trigger form
  inside the header, and matches the issue's "entry point" framing. All
  panelists confirmed the link resolves correctly and is not itself a
  state-changing action (no CSRF surface).
- `PublicHeader.tsx`'s column-3 wrapper changed from a conditional
  `{action && (<div>...)}` to an unconditional `<div className="... flex ...">`.
  Confirmed non-empty on every render path: `BuyerAuthCluster` always renders
  visible content (the sign-in link or the buyer cluster), so there is no
  whitespace-only wrapper case.
- No new `authService` calls were added anywhere; all 4 render sites
  (`app/page.tsx`, `app/shortlist/page.tsx`, `app/my-inquiries/page.tsx`,
  `app/listing/[id]/page.tsx` → `ListingDetail.tsx`) reuse the session object
  each page was already fetching, just hoisted so the whole `Session` survives
  past its `try`/`catch` instead of being destructured into `buyerId`/`email`
  early. Confirmed no duplicate round-trip.
- AC3 (buyer cannot reach admin) required no new guard code per the issue's
  explicit framing. Verified existing coverage instead:
  `tests/auth/service.test.ts`'s `requireAdmin (regression) > rejects a
  confirmed non-admin` test is exactly the buyer-session-hits-requireAdmin
  case; `middleware.ts`'s matcher plus `app/admin/(authed)/layout.tsx`'s own
  `requireAdmin()` call independently gate every `/admin/*` route except
  `/admin/login`, both untouched by this diff.

## Priority-ranked actions

None — no fixes required before handoff.

## Verification

- `npx tsc --noEmit` — clean, no output.
- `npx vitest run` — 123/123 tests passed (12 files), including 3 new
  `logout(redirectTo)` regression tests
  (`tests/auth/actions.test.ts`).
- `npx next build` — compiles, all routes generated, no new client bundle
  (no `'use client'` added; sign-out stays a zero-JS server-action form).
