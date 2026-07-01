---
name: prd
description: Turn a feature request or the current conversation into a product requirement document. Use when the user wants to capture what to build before planning it, or when you the agent need a spec before planning. Not for designing the how (that is /plan) or for bugs (that is /diagnose).
---

# PRD

Write the requirement document: the ideal behavior, the expectations, and when it succeeds. Describe the product, not the implementation.

## Process

1. **Explore the repo** to ground the requirement: use the project's glossary and respect ADRs in the area you touch.
2. **Clarify before writing.** Where the request is ambiguous or two requirements conflict, run `/grill` until it is unambiguous.
3. **Write the PRD** using the template below to `docs/prds/<slug>.md` (`<slug>` = `YYYY-MM-DD-topic`).

<prd-template>

## Problem Statement

The problem the user faces, from the user's perspective.

## Solution

The solution, from the user's perspective. What they can now do.

## User Stories

A long, numbered list covering all aspects of the feature, each:

1. As an `<actor>`, I want `<capability>`, so that `<benefit>`.

## Acceptance Criteria

Concrete, testable conditions for success. When is this done and correct? Include edge cases and error behavior.

- [ ] Criterion 1
- [ ] Criterion 2

## Out of Scope

What this explicitly does not cover, so no one gold-plates it.

</prd-template>

## Hard rules

- **One PRD = one coherent deliverable** (shared core, accepted as one thing; it can span surfaces and many requirements). If grilling and slicing it would not fit one focused build, split into separate PRDs. Why: the deliverable boundary is set here, and downstream it becomes one plan and one branch.
  - **Test for "one deliverable":** one nameable identity, one problem or job, one shared core entity, parts that need each other to be useful, one acceptance boundary. Surfaces, actors, and requirements multiply *inside* a deliverable; their count never forces a split.
  - **Split signal:** two of {problem, core entity, acceptance boundary} that are independent, each shippable and accepted on its own with no shared core. That is two PRDs, not one.
- **No implementation.** No modules, seams, schema, file structure, or technical decisions. Behavior and expectations only. The how is `/plan`.
- **No file paths or code snippets** in the PRD. They go stale fast.
- **Acceptance criteria must be testable.** "Works correctly" is not a criterion; "returns 403 for an unauthenticated request" is.

## Handoff

Once the PRD is approved, continue with `/plan`.
