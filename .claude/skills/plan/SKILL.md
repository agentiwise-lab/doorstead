---
name: plan
description: Design the HOW and break work into dependency-ordered implementation units. Use after a PRD or bug-report RCA exists, when the user says "plan", "plan this", or asks how to build or sequence the work. Owns all phasing: there is no separate slicing skill. Not for writing requirements (that is /prd) or for writing implementation code (that is /tdd or /to-issues).
---
# Plan
Design the HOW and slice the work into a dependency-ordered set of implementation units. Owns all phasing.

## Inputs
- `docs/prds/<slug>.md` (a feature PRD), OR
- `docs/bug-reports/<slug>.md` (a bug fix RCA).

Reuse the same `<slug>` for the plan; it is the feature key. **One PRD = one plan = one branch** (`feat/<slug>`). Given multiple PRDs, produce one plan each in dependency order: never merge PRDs into one plan, never split one PRD. The deliverable boundary is fixed upstream at grill/PRD; the plan only phases units *within* it. `/to-issues` stamps the key on every issue as `feat:<slug>` and `/implement` turns it into the `feat/<slug>` branch; both carry the key, neither decides it. The `feat/<slug>` branch is cut from the branch you are planning on now, not assumed to be `main`: record that base in the plan and carry it to every issue, so an unattended run never has to guess where to branch from.

## Process
1. Explore the repo: read the glossary, respect existing ADRs, find the modules and seams the work touches. Done when you can name every file the work will modify.
2. Run `/grill` if anything is ambiguous. Done when no open question would change a unit.
3. Run `/deep-modules` for every new or changed interface. Define contracts before phasing. Done when each module has a contract (signatures only, no logic).
4. Map every requirement in the input doc to at least one unit. Done when no requirement is unmapped. Never silently drop one.
5. Break the work into implementation units, dependency-ordered. Unit 1 is the tracer bullet: the thinnest demoable end-to-end path through every layer. Each later unit adds difficulty. Done when units cover all mapped requirements.
6. Mark each unit parallel-safe iff it touches different files than its siblings AND depends on no incomplete unit. Done when every unit has a "Blocked by" line.
7. Gate any destructive change through `/destructive-change-gate` before writing it into the plan. Done when no destructive step is unconfirmed.
8. Announce the branch plan, then continue without waiting: name `feat/<slug>` and its base (the branch you are on now), as "this feature lands on `feat/<slug>`, branched from `<base>`; stop me if that base is wrong." Non-blocking: say it, do not halt.

## Output
Write `docs/plans/<slug>.md`.

<plan-template>
# Plan: <title>
Source: docs/prds/<slug>.md (or docs/bug-reports/<slug>.md)
Feature key: <slug>  (one feature = this plan; issues get label `feat:<slug>`, work lands on branch `feat/<slug>`)
Base branch: <the branch you are on now; `feat/<slug>` is cut from here, and this base is carried to every issue>

## Module interaction
One short paragraph: which modules talk to which, in one direction only.

## Tracer bullet
Name the single thinnest end-to-end path (input to output, through every layer). This is Unit 1.

## Unit 1: <name>
- What it builds: <one line, the demoable tracer path>
- Modules + contracts: <module: method signatures only, no logic>
- Seams: <where tests sit, prefer existing seams, fewest possible>
- Acceptance: <testable condition that proves this unit works>
- Blocked by: none, parallel-safe

## Unit 2: <name>
- What it builds: <one line>
- Modules + contracts: <signatures only>
- Seams: <where tests sit>
- Acceptance: <testable condition>
- Blocked by: Unit 1
</plan-template>

Each unit must be self-contained enough that `/to-issues` can lift it into one issue.

## Hard rules
- No implementation code in the plan. Contracts are signatures only. Code goes stale the moment it is written down.
- Seams-first. Prefer existing seams. Fewest seams wins, ideal is one: every extra seam is a place a test can rot.
- Each unit is roughly 1 to 2 commits, implementable in one session (under ~200k context). A unit that does not fit one session hides a missing split.
- A unit never spans multiple user requirements. One unit, one coherent slice.
- Map every requirement to a unit. A dropped requirement is a silent regression.
- Any destructive change is subject to `/destructive-change-gate`. Never destroy work or merge without confirmation.

## Handoff
Ask the user: "Create issues now, or review the plan first?" Then continue with `/to-issues` or `/review-plan`.
