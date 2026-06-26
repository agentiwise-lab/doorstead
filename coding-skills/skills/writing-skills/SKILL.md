---
name: writing-skills
description: Reference for writing and editing the skills in this suite. Use when creating a new skill, editing one, or reviewing a skill for quality.
disable-model-invocation: true
---

# Writing Skills

A skill exists to wrangle determinism out of a stochastic system. **Predictability** is the root virtue: the agent takes the same process every run. Every rule below serves that.

## Invocation axis (the one structural decision)

One frontmatter boolean splits every skill:

- **Step skill** (`disable-model-invocation: true`): only you can invoke it by name. Zero context load. It orchestrates. Use for any side-effecting skill (publishing, merging) so the agent never fires it on its own.
- **Cross-cutting / discipline** (omit the boolean): the agent can reach it autonomously, and so can you. It carries reusable discipline. It costs context load (its description sits in the window).

A step skill may invoke a discipline; a discipline never invokes a step skill.

## Section template

Frontmatter: `name` (lowercase-hyphen, no "claude"/"anthropic"), `description` (third person, what + when + exact trigger phrases + a "Not for..." clause), optional `disable-model-invocation`.

Body, in order, only what applies:
1. **H1 + one-line purpose.**
2. **Inputs** - what it consumes and the exact path.
3. **Process** - numbered, imperative steps. Each step ends in a checkable completion criterion.
4. **Output** - the artifact and its exact path or destination, with an inline template.
5. **Hard rules / Do-NOT** - the forceful "never X", stating the why once.
6. **Handoff** - the next skill, named via prose `/skill` invocation, never a file path.

## Brevity (non-negotiable)

- Hard ceiling ~300 lines; real target far lower. Step skills well under 100. Past 300, it is doing too much: split or push reference to a sibling file.
- Every section terse and unambiguous. Delete no-ops: any line the agent would already obey by default.
- Single source of truth: a fact lives in SKILL.md or a reference file, never both.
- Match freedom to fragility: prose where many approaches work, exact scripts for git or merge steps.

## Leading words

Recruit a concept the model already holds, so one word anchors a region of behavior: `tracer`, `red`, `relentless`, `deletion test`. A weak word (`be thorough`) is a no-op; the fix is a stronger word.

## House rules

- **No em dashes.** Anywhere. Colon, comma, or period.
- **No hardcoded stuff.** Name and justify constants; keep env-varying values in config; no rollback-shim flags (rollback is `git revert`).
- **Fakes, not mocks** wherever a skill prescribes tests.
- **State the why** behind each hard rule, so the skill teaches rather than dictates.

## Five failure modes to hunt

- **Premature completion** - a step rushed because a later step tempts it. Sharpen the completion criterion; split if needed.
- **Duplication** - the same meaning in two places. Collapse it.
- **Sediment** - stale lines kept because removing felt risky. Cut them.
- **Sprawl** - too long even when every line is live. Push reference down a level.
- **No-op** - a line the model already obeys. Delete it.

## Before shipping a skill

Build at least 3 evaluation scenarios first, run them, then write the minimum instruction that passes. Use a fresh agent to use the skill on a real task and watch where it struggles. No skill ships unproven.
