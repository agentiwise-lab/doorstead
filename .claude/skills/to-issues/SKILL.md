---
name: to-issues
description: Publish a plan to the tracker as one compact, self-contained issue per implementation unit on Linear. Use after a plan exists, when the user says "create issues", "publish to Linear", "make tickets", or "turn this plan into issues". A dumb publisher: it does no slicing or phasing, the plan already did that. Not for slicing work into units (that is /plan), not for writing requirements (that is /prd), not for writing code (that is /implement).
---
# To Issues
Lift each implementation unit from a plan into one compact, self-contained Linear issue. One unit equals one issue.

## Inputs
- `docs/plans/<slug>.md`, OR any requirement doc that already has discrete units.

The unit boundaries are fixed by the input. Never re-slice them.

## Process
1. Read the input and list its units in dependency order. Done when every unit has a name and a "Blocked by" line you can trace.
2. For each unit, distill a self-contained brief: the behavioral expectation plus this unit's slice of the requirement, enough to implement with no other context. Done when the brief reads complete without the plan file open.
3. Flag any destructive intent per `/destructive-change-gate`. Done when each flagged unit carries the warning and is held for sign-off, not published.
4. Discover the Linear tools at runtime (the project's Linear workspace is configured) and create issues in dependency order, so each "Blocked by" can reference a real, already-created issue ID. Tag every issue with the plan's feature key as the label `feat:<slug>` (the key the plan declared, do not invent or re-derive it; create the label if it does not exist). Done when every non-blocked unit is published, its ID recorded, and its feature label set. Read the plan's `Base branch` (fall back to the current branch if the input has none) and record it in every issue's `## Branch` block.
5. Wire blockers: set each issue's "Blocked by" to the real IDs from step 4. Done when no "Blocked by" line names a unit instead of an issue ID.
6. Announce the branch, then continue without waiting: state that these issues implement on `feat/<slug>`, cut from `<base>`, as "these land on `feat/<slug>`, branched from `<base>`; stop me if the base is wrong." Non-blocking: say it, do not halt.

## Output
One Linear issue per unit. Each issue body:

<issue-template>
## What to build
<the expectation in unambiguous, behavioral terms: what the system does after this unit, not how>

## Acceptance criteria
- [ ] <testable condition>
- [ ] <testable condition>

## Blocked by
<issue IDs, or "none, can start immediately">

## Branch
Implement on `feat/<slug>`, cut from `<base>`.
</issue-template>

## Hard rules
- NEVER paste the raw plan file into an issue. Compactness comes from scoping to one unit, not from cutting words. The plan is the source, not the payload.
- Behavioral only. No file paths, no line numbers: they go stale the moment code moves, and the implementer should re-derive them.
- Publish in dependency order. A "Blocked by" that names a unit instead of a real issue ID is a broken link the moment someone opens it.
- Keep each issue within the tracker's text limits. An issue that overflows hides a unit that the plan failed to split.
- One issue equals one unit equals one phase. Never merge units into one issue or split a unit across issues: that silently rewrites the plan's phasing.
- Every issue carries the plan's feature key as the `feat:<slug>` label. The plan decides the grouping (one plan = one feature); this skill only stamps it, never invents or re-slices it. It is the key `/implement` uses to land all of a feature's issues on one `feat/<slug>` branch.
- Every issue records its branch and base in a `## Branch` block (`feat/<slug>`, cut from `<base>`). This is operational metadata, not implementation detail: it makes an unattended `/implement` fully self-contained, so a fresh cloud session never infers the base from whatever branch it happens to boot on.
- Destructive intent is flagged in the issue and stops for sign-off, never silently published. Never destroy work or publish a destructive step without confirmation.

## Handoff
Continue with `/implement`: pick one issue, or implement all in dependency order.
