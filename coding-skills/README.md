# Coding Skills

Opinionated agent skills for the engineering lifecycle, for people who already ship code. Small, composable, adaptable. They do not own the process; you reach for the skill the request needs and skip the rest.

## Lifecycle

```
prd -> plan -> review-plan (optional) -> to-issues -> implement -> review-code -> review-pr
bug: diagnose -> plan -> (same path)
grill clarifies at any stage, triggered by you or the agent.
```

- `prd` writes the requirement (behavior and success, no planning).
- `plan` breaks it into dependency-ordered implementation units (phases), tracer bullet first. It owns all phasing.
- `to-issues` publishes one compact, self-contained issue per unit to the tracker (Linear).
- `implement` builds a unit test-first; `review-code` then `review-pr` gate it before merge.
- `diagnose` produces a root-cause analysis for bugs, then feeds `plan`.

## Skills

**You type (step skills):** `prd`, `plan`, `review-plan`, `to-issues`, `implement`, `review-code`, `review-pr`, `diagnose`, `triage`.

**Reachable by you or the agent (cross-cutting + disciplines):** `grill`, `reviewing`, `tdd`, `deep-modules`, `diagnose-loop`, `destructive-change-gate`.

**Authoring standard:** `writing-skills` (how every skill here is written).

## House rules

No em dashes. Fakes, not mocks. Tracer bullet. Deep modules, interface first. Red-green-refactor on the backend; frontend implements directly. No hardcoded values. Never destroy work or merge without confirmation.

## Use

Each skill is a folder under `skills/` with a `SKILL.md`. To make them live in a project, link them into `.claude/skills/` (see `scripts/link-skills.sh`).
