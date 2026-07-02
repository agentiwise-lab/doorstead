# Code Review: age-122-unsave-saved-state (mode: diff)

## Spec-compliance verdict: PASS
## Code-quality verdict: PASS (after fixes below)

Reviewed the working diff for AGE-122 ("Unsave, and the save control reflects
saved state on both surfaces") on `feat/buyer-accounts`, against the tracked
issue's four acceptance criteria. Panel: correctness, security, slop,
architect+QA+ops (QA independently reran `vitest run`, `tsc --noEmit`,
`next build`).

## Findings

- [SEV: major] [CONF: 0.85] `lib/buyers/actions.ts:14-24` (pre-fix)
  Evidence: `resolveRedirect`'s open-redirect guard only rejected values
  starting with `//`. A value like `/\evil.com` satisfies "starts with `/`,
  doesn't start with `//`" as a literal string, but the WHATWG URL algorithm
  (used by browsers resolving a `Location` header) normalizes a leading `\`
  to `/` for special schemes, so it resolves to `https://evil.com/`.
  Verified directly: `new URL('/\\evil.com', 'https://doorstead.app').href`
  → `'https://evil.com/'`. Unanimous finding across all four panelists.
  Notably, `lib/auth/next-path.ts`'s `sanitizeNextPath` (used for
  `/sign-in?next=`) already had the correct fix for this exact bypass class,
  tested in `tests/auth/next-path.test.ts:29-51` against backslash and
  control-character variants — the new `resolveRedirect` reimplemented a
  weaker ad hoc check instead of reusing it.
  **Fixed**: extracted the validation core into an exported
  `isSafeRelativePath` in `lib/auth/next-path.ts` (control-character reject,
  backslash reject, then `new URL()` origin-resolution check), reused it from
  `resolveRedirect` in `lib/buyers/actions.ts`, and added regression tests
  (`tests/buyers/actions.test.ts`, backslash-disguised-redirect cases for both
  `saveListing` and `unsaveListing`) that failed before the fix and pass
  after.

- [SEV: minor] [CONF: 0.6] `lib/buyers/actions.ts:44` (pre-fix)
  Evidence: `saveListing` only called `revalidatePath('/shortlist')`, while
  the new `unsaveListing` (this diff) calls `/shortlist`, `/`, and
  `/listing/${id}`. This diff is what first wires `saveListing` into the
  overview grid (`app/page.tsx`), giving it the same cross-surface
  requirement `unsaveListing` was given, but it wasn't updated to match.
  Flagged independently by the slop and ops reviewers.
  **Fixed**: `saveListing` now also revalidates `/` and `/listing/${id}`,
  matching `unsaveListing`.

- [SEV: minor] [CONF: 0.9] `tests/buyers/actions.test.ts` (pre-fix)
  Evidence: the `unsaveListing` redirectTo tests covered the
  protocol-relative case but not the absolute-URL case already covered for
  `saveListing`, understating the actual validator surface.
  **Fixed**: added the missing absolute-URL case to the `unsaveListing`
  block for parity with `saveListing`.

## Deliberately not changed (considered, judged non-issues)

- `authService.requireBuyer()` not the literal first statement in
  `unsaveListing`/`saveListing` (it's preceded only by a local `readString`
  call, no I/O) — no service/DB call precedes the gate; matches the
  pre-existing `saveListing` pattern from AGE-121, not a new issue.
- An authenticated non-buyer session's admin/buyer status is resolved via
  `authService.getSession()` (not `requireBuyer()`) on the two public pages
  purely to compute `isSaved`/`savedIds` without gating the whole public
  page — flagged at low confidence as a theoretical stuck-button UX edge
  case (a single account that is both an admins-table member and has
  `saved_listings` rows), not a security boundary issue; RLS still scopes to
  `auth.uid()`. Out of scope for this slice.
- No new migration: `saved_listings_owner_all`
  (`supabase/migrations/0006_buyer_accounts.sql:36-39`,
  `for all to authenticated using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id)`)
  already covers the new DELETE and SELECT-by-ids queries; confirmed by
  re-reading the policy, not assumed.
- `app/shortlist/page.tsx`'s own `ListingCard` usage intentionally left
  without a save control — the issue's acceptance criteria name only the
  overview and detail surfaces.
- `ListingCard.tsx`'s `saveControl` slot rendered as a DOM sibling of
  `<Link>` (absolutely positioned), not nested inside it — this is the
  correct fix for what would otherwise be an invalid nested
  `<form>`/`<button>` inside an `<a>`, not gratuitous restructuring.
- No direct `DefaultBuyerService` unit-test layer added — matches the
  established repo precedent (no sibling service, e.g. `DefaultListingService`,
  has one either; the fake-backed action tests are the established seam).

## Priority-ranked actions

1. Fix the open-redirect bypass in `resolveRedirect` by reusing
   `isSafeRelativePath` — **done**.
2. Bring `saveListing`'s `revalidatePath` calls in line with `unsaveListing`
   — **done**.
3. Fill the missing absolute-URL redirectTo test case for `unsaveListing`
   — **done**.

## Verification after fixes

- `npx vitest run` — 110/110 tests passed (10 files), including 2 new
  regression tests that failed before the fix and pass after.
- `npx tsc --noEmit` — clean.
- `npx next build` — compiles, all routes generated.
