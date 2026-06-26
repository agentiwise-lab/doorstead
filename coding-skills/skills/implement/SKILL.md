---
name: implement
description: Builds the work for one Linear issue or a whole plan, one unit at a time, test-first, as tracer-bullet vertical slices. Use when the user says "implement this issue", "build the plan", "ship this unit", or hands a self-contained Linear issue or a docs/plans/<slug>.md. Triggers on implement, build, ship a unit. Not for planning (use /plan), not for reviewing existing code (use /review-code), not for debugging (use /diagnose).
---

# implement

Build the work for one issue or a whole plan, one unit at a time, test-first.

## Inputs
- A self-contained Linear issue, OR
- `docs/plans/<slug>.md`: implement all units in dependency order, or the first unblocked unit.

## Branching
Work lands on a feature branch, never on `main`. The feature key is the plan slug; the branch is `feat/<slug>`.
1. Resolve the branch from the issue's `feat:<slug>` label, or from the plan slug when there is no issue. Resume it if it exists; else create it off the latest `main` (`git checkout main && git pull`, then `git checkout -b feat/<slug>`). Every issue of a feature shares the key, so all of them land on one branch and later issues resume it. No memory needed.
2. Sequential units commit onto the feature branch in dependency order, each building on the last.
3. Parallel-safe units (only when the plan flagged them and you opted into parallel): one worktree per unit off the feature-branch tip, in `.worktrees/<issue-id>`, merged back into the feature branch in dependency order via `/destructive-change-gate`, then removed.
4. No plan and no issue: stay on the current branch.
5. AFK loop: prefer one issue per fresh session (an orchestrator dispatches one worker per issue). State carries in the `feat/<slug>` branch and the issue, not in conversation, so no compaction or handoff doc is needed.

## Process
For each unit, in dependency order:
1. Identify the unit's seams (the 2-3 handoff points). Criterion: each seam has a named contract before any code.
2. Run `/tdd` to build the unit through those seams (Red-Green-Refactor). Criterion: the unit is a tracer-bullet vertical slice, demoable on its own.
3. Typecheck and run the single touched test file after each green. Criterion: both pass.
4. Run the full suite once after the unit is complete. Criterion: suite is green.
5. Commit the unit to the feature branch (after confirmation). Criterion: one commit per unit.
6. Record the outcome on the tracker, never in a new file. From a Linear issue: mark it done and add a short comment on how it went (challenges, decisions taken, or "went smoothly"). From a plan with no issue: update that unit's status in the plan doc. From neither: report in chat. Criterion: status flips only after step 4 passed, and the record lives on the issue or the plan.
7. Push the feature branch when the run is AFK. If this is an AFK implementation job (an orchestrator, loop, or routine dispatched it), push `feat/<slug>` to origin after the unit, feature branch only, never `main`, so the branch survives a fresh-clone next session. In an interactive run, pushing stays confirmation-gated. Criterion: after an AFK unit, `feat/<slug>` is on origin; `main` is never pushed.

## When blocked or a decision is needed
Stop. Do not guess, and do not widen scope to work around it. Ask the user the specific question and leave it as a comment on the issue (status stays in progress or blocked). Resume only after they answer. Why: a guessed decision is rework, and the issue thread keeps the question and its answer together.

## Hard rules
- Build only what the issue or unit specifies. If the work reveals something outside it, surface it (comment on the issue, ask) instead of silently adding it; genuinely new work becomes its own issue. Why: silent scope creep breaks the one-issue-one-unit contract and buries decisions.
- Backend is Red-Green-Refactor via `/tdd`: one failing test, watch it fail RED, minimum code to pass, repeat, refactor once at the end. Why: minimum-to-pass keeps modules deep and stops speculative code.
- Frontend implements directly, no TDD. Why: component props are the contract; UI behavior is verified by running it, not unit tests.
- Fakes, not mocks. Why: a `Fake*` implementing the contract survives refactors; mocks patch internals and break.
- Tests live in a root `tests/` folder, scoped strictly to the touched function. Why: do not backfill tests for untouched code.
- No hardcoded values. Why: a hardcoded path or key is invisible coupling that breaks on the next environment.
- Never claim done without fresh verification evidence: run it, paste the output. Why: "should work" is not evidence.
- Pushing depends on the run. Interactive: commit and push only with confirmation; the user owns when work lands. AFK (orchestrator / loop / routine): commit and push `feat/<slug>` automatically; the AFK job is the standing authorization and the branch must survive a fresh clone. Never push `main` either way.
- Never commit, merge, or push `main`. Land work on the feature branch and push that; merging the feature into `main` is a separate validated step (`/review-pr`, then a gated merge), never this skill's job. Why: `main` is deployed, an unvalidated merge there is an outage.
- Any destructive change is subject to `/destructive-change-gate`. Why: reset, rebase, force-push can drop work; the gate makes the blast radius explicit first.

## Handoff
Run `/review-code`, then `/review-pr`. Merge the feature branch into `main` only after `/review-pr` passes, as a separate gated step. Never merge here.
