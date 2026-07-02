# Plan Review: buyer-accounts

Adversarial design review of `docs/plans/buyer-accounts.md`, run as a four-role panel (architect, QA, security, ops) under a synthesizing judge, before any code is written. Stance: break confidence in the plan, not validate it. Plan altitude reviewed: unit breakdown with deep-module contracts.

Verdict up front: **revise**. The architecture, module direction, additive-migration strategy, and `requireBuyer` analogue are sound and match the codebase conventions. Five blockers must be resolved before issues are cut, because each changes a unit's contract, migration contents, or acceptance. All five have been reconciled into the "Priority-Ranked Actions" below and applied to the revised plan.

## Findings

### B1. A buyer's authenticated client cannot read `listings` at all, so the shortlist renders empty
- Severity: blocker
- Confidence: high
- Surface: design
- Reviewer: architect (verified against `supabase/migrations/0001_listings.sql`)
- Evidence: `listings` has exactly two SELECT policies: `listings_public_read` is `to anon` only, and `listings_admin_all` is `to authenticated using (auth.uid() in (select user_id from admins))`. A buyer is a signed-in non-admin, so `DefaultSavedListingService.listForBuyer()` reading `listings` through the cookie-aware `createServerClient()` (authenticated role) matches no SELECT policy and returns zero rows. Unit 1's acceptance ("loading `/shortlist` shows that listing") cannot pass. The alternate "delegate to `ListingService` contract" path resolves through the anon-bound `listingService` singleton, which filters `status='live' and deleted_at is null`; because this app soft-deletes, an unpublished saved listing silently vanishes from the shortlist with no row cleanup.
- Recommendation: add a `listings` SELECT policy for the authenticated role in the saved-listings migration, mirroring the public read (`for select to authenticated using (status = 'live' and deleted_at is null)`), then perform the shortlist join in one query inside `DefaultSavedListingService` and drop the cross-service delegation. This also removes the service→service import question.

### B2. Enabling Google OAuth opens public self-signup for the first time, turning the `authenticated` role into an attacker-controllable identity
- Severity: blocker
- Confidence: high
- Surface: design
- Reviewer: security (verified against `0001_listings.sql` lines 9-10 and README first-deploy runbook)
- Evidence: today the only way to obtain an `authenticated` JWT is admin-provisioned password sign-in; the README runbook explicitly disables email self-signup and flags it CRITICAL ("the RLS gate becomes useless" otherwise). Migration `0001` documents the threat in a comment: the `authenticated` role is granted to any signed-in user, "including a self-signed-up stranger." Enabling Google OAuth is the moment public self-signup goes live, so every existing `to authenticated` policy must be re-audited against an adversary-controlled principal, not just the two admins. The plan frames provider enablement as a benign environment step analogous to provisioning a Storage bucket; it is not analogous, because a bucket does not mint credentials that satisfy `to authenticated` predicates.
- Recommendation: make "enabling the Google provider = opening public self-signup" an explicit, reviewed security decision in the plan. Add a precondition that enumerates every `to authenticated` policy and proves each gates on the `admins` table, on `auth.uid()` ownership, or on a verified-email match, never on role membership alone. Confirm the runbook's email-signup lockdown stays in force and that Google sign-up cannot mint an admin.

### B3. The email-match inquiry policy is a PII-disclosure vector unless it gates on a provider-verified email claim
- Severity: blocker
- Confidence: high
- Surface: design
- Reviewer: security (with QA corroboration on claim-source divergence)
- Evidence: Unit 3 adds `inquiries_buyer_read for select to authenticated using (email = auth.jwt() ->> 'email')`. Coupled with B2 (public signup now open) and the fact that the inquiry `email` column is unverified free text (`0002` line 23), the residual risk is no longer only the PRD's accepted edge (someone typing your address into an inquiry). If the top-level `email` claim is not provably the provider-verified Google email, or if any reachable path lets a user set an arbitrary unverified email (`updateUser({email})`, mixed sign-in methods, email confirmation disabled), an authenticated attacker can make `auth.jwt() ->> 'email'` equal a victim address and read that victim's inquiry name/email/phone. The plan defers the exact claim expression to "implementation time," which is a security boundary left unpinned. Postgres OR-combines the permissive `inquiries_admin_read` and `inquiries_buyer_read` policies, so the entire PII protection now rests on this one buyer predicate being airtight.
- Recommendation: pin the claim against a real decoded Google JWT for this project before cutting issues, and gate on verification, for example `using ((auth.jwt() ->> 'email_verified')::boolean is true and email = auth.jwt() ->> 'email')` (confirm the exact claim path Supabase emits, not from docs). Pin the project auth config in the plan: email confirmation ON, no reachable arbitrary-email path. Verify with a real-Postgres RLS assertion (see B5), not a contract fake.

### B4. Unit 1's tracer cannot go green in an unattended loop: its acceptance asserts a live Google OAuth round-trip
- Severity: blocker
- Confidence: high
- Surface: unit-breakdown / sequencing
- Reviewer: QA and ops (independently)
- Evidence: the tracer (plan line 27) and Unit 1 acceptance (line 46) both start from "a Google-signed-in buyer session," obtained via an interactive Google consent flow plus a Supabase-dashboard + Google-Cloud-console provisioning step that no unattended `/implement` loop can perform. The unit's own seam note says "No test reaches Supabase or Google," so the only machine-checkable portion is the Fake-backed contract/action tests. As written, the unit is "done" only when a real Google session exists, which the loop can never produce. This violates the tracer principle that the thinnest slice is provably working in the loop.
- Recommendation: split Unit 1 acceptance into (a) the machine-checkable gate the loop keys on (Fake-backed contract + action tests, migration applies against a local `supabase start` stack, typecheck and build pass), and (b) a human post-provisioning smoke check ("after a human enables the Google provider, one live sign-in → save → shortlist"). Provider provisioning happens before the unattended run and is not part of any unit's automated acceptance.

### B5. RLS-enforced and constraint-enforced guarantees have no test home; the plan credits them to contract fakes that cannot exercise them
- Severity: blocker
- Confidence: high
- Surface: unit-breakdown
- Reviewer: QA (with security and ops corroboration)
- Evidence: the coverage map attributes the three most security-critical criteria to contract-fake units that, by the plan's own seam notes, never touch Postgres: cross-buyer shortlist isolation → "U1 (`user_id = auth.uid()` RLS)"; email-scoped inquiries → "U3 (email-claim RLS)"; idempotent single-row save → "U1 (unique constraint + upsert)." A `FakeSavedListingService` has no `auth.uid()` and no policy engine; a JS `Set` dedup passes the idempotency test whether or not the migration actually carries `unique (user_id, listing_id)`. The guarantees live only in DDL the fakes do not run, so the plan claims coverage the seams cannot deliver.
- Recommendation: add real-Postgres verification against a local `supabase start` stack (seeded two-role test or pgTAP) that asserts: (1) buyer A cannot read/insert/delete buyer B's `saved_listings` rows; (2) inserting the same `(user_id, listing_id)` twice yields one row; (3) a buyer JWT reads only its own-email inquiries and zero others; (4) anon still cannot SELECT inquiries. Fold each assertion into the relevant unit's acceptance (this is automatable locally, so it need not be a separate unit). Stop crediting these criteria to contract-fake units in the coverage map.

### M1. Duplicate `0003` migration collision with the parallel image-uploads branch
- Severity: major
- Confidence: high
- Surface: sequencing
- Reviewer: architect and ops (ops verified `0003_listing_media.sql` exists on the sibling branch)
- Evidence: this plan hardcodes `0003_saved_listings.sql` and `0004_inquiries_buyer_read.sql`. The parallel `listing-image-uploads` branch, cut from the same `0001/0002` lineage, ships its own `0003_listing_media.sql`. Different filenames means git merges both clean with no conflict, but `supabase db push` orders by numeric prefix and two `0003`s give ambiguous ordering or a silently skipped migration. The plan's "purely additive, no destructive change" note does not cover this lineage hazard.
- Recommendation: the plan and issues must instruct the implementer to `ls supabase/migrations/` at implement time and pick the next unused prefix rather than hardcoding `0003/0004`; whichever feature merges second renumbers before push. State this as a step, not an assumption.

### M2. `requireBuyer` fails open on an admin-check error, and its reject-admins semantic is an unstated product choice
- Severity: major
- Confidence: high
- Surface: design
- Reviewer: architect and QA
- Evidence: `isAdmin()` swallows any query error as `false` (`service.ts` line 47). For `requireAdmin` that is fail-closed (error → not admin → denied). The plan reuses the same primitive for `requireBuyer`, where "not admin" grants buyer access, so a transient error reading `admins` silently classifies a real admin as a buyer. Separately, the plan has `requireBuyer` throw for admins, which is a policy the PRD never states (the PRD constrains buyer→admin capability, not admin→buyer).
- Recommendation: `requireBuyer` must fail closed on an admin-check error (throw, do not treat as buyer); this likely means `isAdmin` should surface errors rather than collapse them to `false`, or `requireBuyer` uses a distinct path. State the reject-admins decision explicitly in the plan.

### M3. Open redirect in the OAuth callback via an unvalidated `next` param
- Severity: major
- Confidence: high
- Surface: unit-breakdown
- Reviewer: security
- Evidence: Unit 1 (line 35) has the callback "redirect to `/shortlist` (or a `next` param)" with no validation rule. `…/auth/callback?code=…&next=https://evil.example` sends a freshly authenticated user to an attacker origin.
- Recommendation: only ever redirect to a same-origin relative path (a string beginning with a single `/`, rejecting protocol-relative `//`); hardcode `/shortlist` as the fallback. Register the exact callback URL in Supabase's redirect allowlist. State this in Unit 1's callback spec and give the callback its own acceptance.

### M4. Buyer pages ship half-guarded until Unit 4 (fail-open smell)
- Severity: major
- Confidence: medium
- Surface: sequencing
- Reviewer: security and QA (architect rated it minor because RLS is defense-in-depth)
- Evidence: Unit 1's `/shortlist` and Unit 3's `/my-inquiries` call `requireBuyer()` but defer the catch-and-redirect guard to Unit 4. Units are separately mergeable, so between Unit 1 and Unit 4 an unauthenticated hit reaches a buyer page. An uncaught throw renders an error boundary (no data leak) and RLS returns zero rows for a null uid, so the exposure is low, but shipping a half-guarded buyer route is a fail-open smell and the app-layer gate is unproven until Unit 4.
- Recommendation: introduce the shared `app/(buyer)/layout.tsx` guard (one `requireBuyer()` gate for the route group, mirroring `app/admin/(authed)/layout.tsx`) in Unit 1, so buyer pages are born guarded. Auth entry-point polish (header controls, sign-out) can stay in Unit 4. Rely on RLS as defense-in-depth, never as the only gate.

### M5. The PII boundary genuinely widens from "admin-only" to "admin OR verified-self-email"; the plan mislabels it "intact"
- Severity: major
- Confidence: high
- Surface: design
- Reviewer: security and ops
- Evidence: `0002` documents "a lead's name/email/phone can only ever be read by an admin" as load-bearing. Because Postgres OR-combines permissive policies, adding `inquiries_buyer_read` changes the effective SELECT predicate to `admin OR (email = jwt email)`. The plan's coverage map calls the old boundary "intact," which hides that the PII surface widened and now depends entirely on the buyer predicate (B3).
- Recommendation: state the boundary change explicitly in the plan and treat the buyer predicate as a primary PII gate, verified in DB (B5), not a convenience filter.

### M6. OAuth provisioning and per-environment callback URLs are documented nowhere durable
- Severity: major
- Confidence: high
- Surface: design / ops
- Reviewer: ops (with QA corroboration on the callback route)
- Evidence: Google client id/secret correctly live in Supabase project config (no `.env.example` change needed, and the plan is right not to add one), but the callback URL is per-environment (localhost vs preview vs prod) and the plan only mentions it in a migration comment header the human provisioner will never read. The README first-deploy runbook, which already covers the email-signup toggle and admin seed, gets no new step. An unattended loop writes code but cannot edit the Google console; the human who can has no runbook entry.
- Recommendation: add a README first-deploy runbook step enumerating: enable the Google provider, paste client id/secret, and register the exact redirect URLs (`http://localhost:3000/auth/callback`, `https://<prod-domain>/auth/callback`, and the Supabase-issued `.../auth/v1/callback` in the Google console). Confirm Google sign-up is enabled for buyers without re-enabling email self-signup.

### Minor findings (noted, folded into the actions above)
- m1 (architect): `signInWithGoogle` on the `AuthService` contract leaks OAuth transport into a session/identity abstraction. Acceptable, but prefer the action computing the provider URL through a thin helper; keep `requireBuyer` on the contract.
- m2 (QA): the callback route (`exchangeCodeForSession`) is the single load-bearing auth touchpoint with no dedicated acceptance. Give it one (folded into M3/B4).
- m3 (ops): `npx supabase db push` to the remote by an unattended loop risks a non-transactional partial apply that `git revert` does not undo. Have the loop push only against a local stack; the human runs/re-verifies the remote push during provisioning. Additive residue (orphan table/policy) is harmless.

## Priority-Ranked Actions

1. Add an authenticated-role `listings` SELECT policy scoped to live listings and do the shortlist join in one query; drop the cross-service delegation (B1).
2. Pin the inquiries email-match policy to a provider-verified claim and gate on `email_verified`; pin the project auth config against any arbitrary-email path (B3), and record the threat-model change from opening public self-signup (B2).
3. Add real-Postgres verification (local `supabase start`) for cross-buyer isolation, idempotency, email-scoped inquiries, and anon-denial; fold assertions into unit acceptances and correct the coverage map (B5).
4. Re-slice Unit 1 acceptance into a machine-checkable loop gate and a separate human post-provisioning live smoke check (B4).
5. Replace hardcoded migration numbers with "pick the next free prefix at implement time" and a merge renumbering rule (M1).
6. Make `requireBuyer` fail closed on admin-check error and state the reject-admins decision (M2).
7. Validate the callback `next` param to same-origin relative paths and give the callback its own acceptance (M3, m2).
8. Move the buyer route-group guard (`app/(buyer)/layout.tsx`) into Unit 1 so pages are born guarded (M4).
9. State the PII boundary change from "admin-only" to "admin OR verified-self-email" (M5).
10. Add the OAuth provisioning + per-environment callback URLs to the README first-deploy runbook; keep email self-signup locked (M6, m3).

## Verdict

revise: sound architecture, but five blockers (B1 broken shortlist read, B2 public-signup threat-model change, B3 unpinned PII-gating claim, B4 tracer un-runnable unattended, B5 untested DB-enforced guarantees) must be applied to the plan before issues are cut. After the ranked actions land, the plan is cleared to proceed to `/to-issues`.
