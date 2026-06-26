---
name: review-plan
description: Runs an adversarial design review of a plan BEFORE any code is written. Spawns a parallel panel of role reviewers (architect, qa, security, ops) under a judge that synthesizes and resolves conflicts. Use when a plan exists at docs/plans/<slug>.md and the user wants it pressure-tested before implementation. Triggers: "review the plan", "poke holes in this plan", "is this plan sound". Not for reviewing written code (use /review-code), not for producing the plan (use /plan), not as a default gate (this step is optional and user-chosen).
---

# review-plan

Break confidence in a plan before a single line of code depends on it.

## Inputs

- `docs/plans/<slug>.md`: the plan under review.

## Process

1. Read the plan. Note its declared level of abstraction (system design vs. unit breakdown vs. step list). Criterion: you can state the plan's altitude in one sentence.
2. Run the `/reviewing` engine with a DESIGN lens: spawn a parallel panel of role reviewers (architect, qa, security, ops), each with the stance "break confidence in this plan, do not validate it; default to skepticism." Criterion: four independent reviewer reports exist before synthesis begins.
3. Each reviewer judges the plan at its declared altitude. Detail that is reasonably decided during implementation is not a finding. Criterion: zero findings flag implementation-level detail the plan deliberately left open.
4. Reviewers attack three surfaces: the design (does it hold?), the unit breakdown (are the seams real, are modules deep?), and the sequencing (does the tracer bullet path work, is order correct?). Criterion: every finding maps to one of these three surfaces.
5. Empirically verify any tool or API claim a reviewer makes before it counts as evidence. Criterion: no finding rests on an unverified mental model of a tool or API.
6. The judge synthesizes, resolves conflicts between reviewers, and ranks findings. Criterion: contradicting reviewer claims are reconciled into a single verdict, not listed side by side.

## Output

Write `docs/plan-reviews/<slug>.md`.

```markdown
# Plan Review: <slug>

## Findings
### <short title>
- Severity: blocker | major | minor
- Confidence: high | medium | low
- Evidence: <verified fact, quote from plan, or tool/API check>
- Recommendation: <concrete change>

## Priority-Ranked Actions
1. <action> (<finding ref>)
2. ...

## Verdict
proceed | revise: <one-line reason>
```

## Hard rules

- Break confidence, do not rubber-stamp. A review that finds nothing wrong has not done its job; the default stance is skepticism.
- One strong finding beats several weak ones. False positives erode trust in every future review, so drop low-confidence noise rather than pad the list.
- Empirically verify tool and API claims. A confident mental model is not evidence; an unchecked claim poisons the whole verdict.
- Judge at the plan's declared altitude. Flagging detail meant for implementation wastes the review and buries real design risk.

## Handoff

When the verdict is proceed, or after the author revises, continue with `/to-issues`.
