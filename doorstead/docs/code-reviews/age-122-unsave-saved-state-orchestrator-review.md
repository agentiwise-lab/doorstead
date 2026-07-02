# Code Review: age-122-unsave-saved-state (mode: diff, orchestrator second pass)

Reviewed: `git diff 932e9c5..origin/feat/buyer-accounts` (everything AGE-122 added on top of the already-shipped, already-reviewed AGE-121 tracer). Independent second pass after the implementer's own self-review (see `age-122-unsave-saved-state.md`, which found and fixed a real open-redirect bypass), run as a 3-role parallel panel (correctness, security, slop) synthesized by the orchestrator.

## Spec-compliance verdict: PASS
## Code-quality verdict: PASS (after one fix)

## Findings

- [SEV: med] [CONF: 0.85] `tests/buyers/actions.test.ts:59-69`
  Evidence: `saveListing`'s happy-path test still only asserts `revalidatePath('/shortlist')`, unchanged from before this diff, even though `lib/buyers/actions.ts:42-44` now also calls `revalidatePath('/')` and `revalidatePath('/listing/${listingId}')`, and the implementer's own review doc claims this parity fix is tested. Deleting either new call would not fail the suite. Missing-test gap with a single correct fix: add the two missing assertions (mirroring the existing `unsaveListing` test at lines 144-157).

- [SEV: low] [CONF: 0.55] `lib/auth/next-path.ts:19-32`
  Evidence: newly-exported `isSafeRelativePath` has no direct unit test, only indirect coverage via `sanitizeNextPath` and `resolveRedirect`. Per CLAUDE.md "every new function gets a test." Bundling into the same fix pass since it's the same class of gap and low-risk to add.

- [SEV: low/med] [CONF: 0.55] `lib/buyers/actions.ts:24-46,48-70`
  Evidence: `saveListing`/`unsaveListing` share a near-identical ~14-line body (auth gate + redirect + revalidatePath triplet), which is exactly what let the test drift in the first finding happen. Legitimate dedup opportunity, not urgent — leaving as-is; not blocking.

- [SEV: low] [CONF: 0.55] `lib/buyers/actions.ts:29,53` + `app/page.tsx:44` / `app/listing/[id]/page.tsx:18`
  Evidence: a signed-in admin sees live "Save" buttons (isSaved computed from `getSession()`) but clicking bounces them to `/sign-in` via `requireBuyer()`'s admin-rejection — a UX dead-end, not a data-safety issue, already knowingly deferred by the implementer as out of scope. Doesn't violate any stated AC.

## Priority-ranked actions

1. Add the two missing `revalidatePath` assertions to `saveListing`'s test, and a direct unit test for `isSafeRelativePath`.
2. (Optional, not blocking) Dedup `saveListing`/`unsaveListing`'s shared body into a helper.

Security panel independently fuzzed the open-redirect fix (`isSafeRelativePath`) against ~35 payload classes (control chars, backslash raw/percent-encoded, Unicode homoglyphs, traversal, mixed separators) and found no bypass. Buyer-gate ordering, `buyer_id` provenance, and RLS DELETE coverage all verified correct.
