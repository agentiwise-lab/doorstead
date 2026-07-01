---
name: review-code
description: Reviews the working git diff (or the whole codebase in scan mode) for correctness and AI slop, returning two verdicts (spec-compliance and code-quality) with cited findings. Use when the user asks to review code, check a diff before commit, audit a change for bugs, or scan a codebase for slop and over-engineering. Triggers: "review this", "review the diff", "check my changes", "find the slop", "scan the codebase". Not for reviewing a pull request on its own branch (use review-pr), and not for style nits a linter already catches.
---

# review-code

Review the working diff (or the whole codebase) for correctness and AI slop, then return two verdicts.

## Inputs
- The working git diff: `git diff HEAD` (default mode).
- The whole codebase (scan mode): supplied when there is no diff to review or the user asks for a full scan.
- The spec or task description the change claims to satisfy, if one exists.

## Process
1. Detect mode. If `git diff HEAD` is non-empty, review the diff; else scan the codebase. Criterion: mode is stated in the output header.
2. Run the `/reviewing` engine with a CODE + SLOP lens: spawn a parallel role panel (correctness, security, performance, slop) and let the judge synthesize. Criterion: every role returns findings before the judge runs.
3. Do not pre-judge. Never write "do not flag X" into a panel prompt; let each role report, then filter at synthesis. Criterion: panel prompts contain no exclusion instructions.
4. Calibrate confidence PER DOMAIN, not globally. Security at 0.60 is actionable; performance at 0.60 is noise. Surface a finding only above its domain threshold. Criterion: each finding carries a confidence and clears its domain bar.
5. Cite, do not infer. A behavior claim needs a `file:line`, not a guess from a name. Criterion: every behavior claim has a `file:line`.
6. Distrust self-justification. "Left it per YAGNI" is the implementer grading their own work; verify against the code. Criterion: no finding is dismissed on the implementer's word alone.
7. Apply the false-positive guard (below) before emitting. Criterion: each surviving finding survives the guard.

## Output
Write `docs/code-reviews/<slug>.md`. Template:
```
# Code Review: <slug>  (mode: diff | scan)

## Spec-compliance verdict: PASS | FAIL
## Code-quality verdict: PASS | FAIL

## Findings
- [SEV: high|med|low] [CONF: 0.NN] path/file.ext:LINE
  Evidence: <quote or behavior at that line, why it is wrong>

## Priority-ranked actions
1. <highest-leverage fix first>
```

## Slop axis (first-class lens, flag each)
- Unnecessary comments restating the code.
- Defensive over-engineering: try/except for impossible errors, broad `except`.
- Gratuitous abstraction: a base class or wrapper for a single implementation.
- Dead code; leftover debug prints.
- Over-parameterization: knobs no caller uses.
- Fake tests: break the impl in your head; if the test still passes, it is fake.
- Confident hallucination: APIs, flags, or methods that do not exist.
- Architectural drift at integration points: a new endpoint that skips auth, a handler that bypasses the service layer.

False-positive guard: generic names are fine in small scopes; defensive code is fine in genuinely critical paths; detailed docstrings are fine for public libraries. Do not flag these.

## Hard rules
- Flag mocks of internal collaborators: we use fakes, because mocks patch internals and break on refactor.
- Flag hardcoded values and rollback-shim flags: config belongs in config, and rollback is `git revert`, not a runtime toggle.
- Flag tests that hit internals instead of the contract boundary: contract tests survive refactors, internal tests do not.
- Focus on integration points, not internal logic: grep `shared/` and `utils/` before judging reuse, because the helper often already exists.
- Do not flag pure-style nits a linter catches: spacing and import order are the linter's job, not the reviewer's.

## Handoff
Continue with `/review-pr` to fold these findings into the pull-request review.
