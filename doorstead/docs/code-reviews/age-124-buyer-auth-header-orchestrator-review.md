# Code Review: age-124-buyer-auth-header (mode: diff, orchestrator second pass)

Reviewed: `git diff cff6ee0..origin/feat/buyer-accounts` (AGE-124 on top of AGE-121/122/123). Independent second pass after the implementer's own self-review, run as a 2-role parallel panel (correctness, security+slop) synthesized by the orchestrator. Extra scrutiny applied because this diff touches the existing, live admin `logout()` action.

## Spec-compliance verdict: FAIL (before fix) — deviates from the project's own plan
## Code-quality verdict: FAIL (before fix)

## Findings

- [SEV: med] [CONF: 0.6] `lib/auth/actions.ts:28-31`, `components/admin/LogoutButton.tsx:5`
  Evidence: this diff parameterizes the shared, previously-untouched admin `logout()` action into `logout(redirectTo: string)` and modifies the admin logout button to bind a target. `docs/plans/buyer-accounts.md` (Unit 4) explicitly specifies the opposite: *"add `buyerLogout(): Promise<void>` … Admin `logout` is untouched; buyer sign-out returns to the public home, not the admin login."* No functional regression was found (both reviewers independently verified admin sign-out still redirects to `/admin/login`, `signOut()` still runs before `redirect()`), but the diff coupled a sensitive admin action's parameter surface to a pattern (a `redirectTo`-named string threaded from a UI call site) that this exact codebase has already had to hangeck twice for open-redirect bugs (AGE-121, AGE-122). The project's own plan already resolved this design question — this isn't a "two engineers would disagree" case, it's a deviation from a documented decision. Single correct fix: follow the plan — revert admin `logout()` to take no arguments (byte-for-byte pre-AGE-124), add a separate `buyerLogout()` action hardcoded to redirect to `/`.

- [SEV: low] [CONF: 0.5] `docs/code-reviews/age-124-buyer-auth-header.md:256-265`
  Evidence: the implementer's own checked-in self-review claims the `logout(redirectTo)` unification "was the design explicitly handed down for this unit's implementation" — the actual plan says the opposite (quoted above). Worth noting for the record; will be corrected implicitly once the fix reverts to the plan's design (the self-review doc's claim becomes moot, no separate action needed on the doc itself).

- [SEV: med] [CONF: 0.65-0.75] `components/ui/BuyerAuthCluster.tsx:7-8`, `app/page.tsx:13`, `app/listing/[id]/page.tsx:20`
  Evidence: `BuyerAuthCluster` branches only on session truthiness, with no `isAdmin` distinction — `Session` carries no role. An admin signed in and browsing the public site sees the full buyer cluster ("My shortlist / My inquiries / Sign out"). Clicking shortlist/inquiries hits `requireBuyer()`, which correctly rejects admins (fails closed, not a security hole) but bounces to `/sign-in`, a dead-end loop for an already-authenticated admin. Fails the acceptance criterion that the header "correctly distinguish[es]" session state and "behave[s] sensibly." Single correct fix: don't render the buyer-signed-in cluster for an admin session (check `isAdmin` alongside session truthiness, or derive an `isBuyer` boolean upstream).

Correctness and security panels independently confirmed: no open redirect exists today (both `logout` call sites are compile-time literals), `signOut()` genuinely invalidates the server-side session, `PublicHeader`/`BuyerAuthCluster` are server components (no session data leaked to client JS), and session threading to every `PublicHeader` render site is complete with no gaps.

## Priority-ranked actions

1. Revert admin `logout()` to no-argument (match plan, pre-AGE-124 behavior exactly); add a separate `buyerLogout()` action for the buyer sign-out path, hardcoded target, no parameter.
2. Make the header/cluster admin-aware so a signed-in admin browsing the public site doesn't see the dead-end buyer cluster.
