---
name: reviewing
description: The shared adversarial review engine. Spawns a parallel panel of role reviewers (architect, qa, security, ops, and others the lens calls for) under a judge that dedupes, resolves conflicts, and ranks by priority. Use when another skill needs the review engine: /review-plan passes a DESIGN lens, /review-code a CODE+SLOP lens, /review-pr a PR lens. Also reachable directly when the user asks to pressure-test a target. Not for producing the target (that is /plan, /implement), and not for style nits a linter already catches.
---

# reviewing

Run an adversarial panel against a target, then synthesize one verdict. Break confidence; do not validate.

## Inputs

- A target: a plan, a working diff, or a whole PR.
- A lens: DESIGN, CODE+SLOP, or PR. The lens sets which roles the panel carries.

## Mechanics

1. Pick the panel from the lens. Always include architect, qa, security, ops; add what the lens demands (CODE+SLOP adds correctness, performance, slop). Criterion: every role the lens names has a reviewer.
2. Spawn the panel in PARALLEL, one reviewer per role, each under the same protocol below. Criterion: every reviewer reports before the judge runs.
3. Each reviewer runs its checklist, then emits findings scored against the severity rubric and a per-domain confidence. Criterion: each finding carries severity, confidence, and a `file:line` (or a plan quote for DESIGN).
4. For a CODE+SLOP lens, each reviewer returns up to TWO verdicts: spec-compliance and code-quality. Criterion: both verdicts present per reviewer.
5. The JUDGE synthesizes: dedupe overlapping findings, resolve conflicts into a single call (never list both sides), rank by priority. Criterion: no duplicate finding, no unresolved conflict.
6. Optionally escalate the top one or two most critical findings to a second model for a cross-check. Criterion: escalated findings carry the cross-check result.
7. Return the synthesized findings to the calling skill. The engine writes no document of its own. Criterion: nothing written; findings returned.

## Reviewer protocol (every persona obeys)

- Stance: break confidence in the target. A reviewer that finds nothing has not done its job.
- Run the checklist first, score second. No freelancing past the checklist.
- A behavior claim needs a `file:line` citation, not an inference from a name.
- Carry an explicit "what you do not flag" list (your domain's false positives).
- Severity: blocker | major | minor. Confidence: 0.00 to 1.00.

## Per-domain confidence calibration

Confidence is read PER DOMAIN, not globally. A finding surfaces only above its domain threshold.

- Security at 0.60 is actionable.
- Performance at 0.60 is noise.

Each persona sets its own bar; the judge drops anything under it.

## Slop lens

CODE+SLOP carries a dedicated slop reviewer. The checklist and its false-positive guard live in `slop-checklist.md`; read it before running that reviewer.

## Hard rules

- Break confidence, do not validate. Default to skepticism: a clean review is suspect, not a win.
- Cite, do not infer. A name suggests behavior; only a `file:line` proves it. An unverified claim poisons the verdict.
- Distrust the implementer's self-justification. A stated rationale ("left it per YAGNI") never downgrades a finding; verify against the code, not the comment.
- The controller must NOT pre-judge. If a panel prompt contains "do not flag X", that is pre-judging: stop and remove it. Roles report, the judge filters.
- One strong finding beats several weak ones. False positives erode trust in every future review, so drop low-confidence noise instead of padding.
- Confidence is per domain. A global threshold buries real security findings under performance hunches.
