---
name: review-pr
description: Reviews a whole pull request for cross-file coherence, re-verifies the merge gate, and merges only on explicit confirmation. Use when the user asks to review a PR, check if a PR is mergeable, ship a branch, or merge a pull request. Triggers: "review the PR", "is this mergeable", "ship it", "merge this PR". Not for reviewing the local working diff (use review-code), and not for unattended or auto-merge: this skill never merges without a typed-or-explicit confirmation.
---

# review-pr

The final gate: review the whole PR, prove it is mergeable for real, then merge on explicit confirmation.

## Inputs
- The whole PR / changeset (every file the branch touches, not just the latest diff).
- The live PR metadata and CI state: `gh pr view --json headRefOid,mergeable,statusCheckRollup,reviewDecision` (or the Linear/GitHub equivalent).

## Process
1. Run `/reviewing` over the FULL changeset, with cross-file coherence as the lens, not the diff in isolation. Criterion: the review reasons about callers and callees the branch did not change, not only changed lines.
2. SHA-anchor the review: read the head SHA at review time and stamp it into the output. Criterion: the output records the exact head SHA the review covers.
3. Re-verify the gate (see Hard rules). Criterion: each of the three gate conditions is recorded as pass or fail with its evidence.
4. Before any merge, re-read the live head SHA and compare it to the stamped SHA. Criterion: if they differ, stop, mark the review stale, and wait for a fresh `/review-code`; do not present merge as an option.
5. Present exactly four options: Merge / open-PR / Keep / Discard. Discard requires a typed confirmation string; the others require explicit user choice. Criterion: the user picked one option, and Discard was typed.
6. Merge only after the user explicitly confirms. Criterion: a merge runs only following an explicit Merge confirmation in this turn.

## Output
Write `docs/ship/<slug>.md` (the merge log). Template:
```
# Ship Log: <slug>

## Head SHA (reviewed): <40-char SHA>
## Head SHA (at merge):  <40-char SHA | n/a>
## CI status: green | failing | absent
## Mergeable (no conflicts): yes | no
## Fresh /review-code: PASS | FAIL | stale
## Review threads: all resolved | <N> open
## Decision: Merge | open-PR | Keep | Discard
## Merged: yes <merge SHA> | no
```

## Hard rules
- The merge gate is all three: CI green AND a fresh SHA-matched `/review-code` AND every review thread resolved. Miss one, the gate fails.
- "Mergeable" means no conflicts only, NOT that CI passed. Read CI separately, because a clean merge can still ship a red build.
- Do not auto-resolve threads opened by human reviewers: a human raised it, a human closes it.
- Never treat a stale or absent review as tacit approval: no review means no gate, because silence is not a pass.
- A SHA mismatch invalidates the review: new commits can break what you approved, so a moved head means re-review.
- Never merge without explicit confirmation, and never push without it: rollback is `git revert`, but an unwanted merge is already in history.
- Any follow-up issue you file for a finding you do not fix now is raised in the `/to-issues` format: `## What to build`, `## Acceptance criteria`, `## Blocked by`, and a `## Branch` block naming the base branch. A bare bug note is not enough; an unattended run must be able to pick it up self-contained.

## Handoff
Done: the PR is merged.
