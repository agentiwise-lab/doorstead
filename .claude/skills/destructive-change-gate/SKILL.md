---
name: destructive-change-gate
description: Stops a skill before it makes a potentially destructive change and forces user sign-off first. Fires when a skill is about to revert pushed commits, run a destructive DB change, or cut a feature's scope, or when another skill needs the destructive-change check.
---

# Destructive Change Gate

Before any destructive change, stop and get the user's sign-off. This is the operational form of "never destroy work without permission."

## Classify the change first

A change is **destructive** (the gate FIRES) if it:

- reverts already-pushed or production commits in a way NOT in the plan,
- makes a destructive database change: dropping columns or tables, irreversible migrations, deleting data,
- cuts a feature's scope or regresses existing behavior.

A change is **not destructive** (proceed without stopping) if it:

- only adds new code, files, or columns,
- only modifies existing behavior without removing it,
- reverts only this feature's own implementation to a prior commit when nothing else is affected.

## When the gate fires

1. Comment on the relevant issue (Linear) with:
   - the plan,
   - the specific features or implementations that would be affected,
   - the open questions the user must answer.
2. STOP. Do not proceed until the user signs off.

## Hard rules

- When unsure whether a change is destructive, treat it as destructive and ask. Default to safe.
- Name the specific commits, tables, or features at risk in the comment, so the user can decide.
- Never proceed silently on a destructive change, even in an AFK or autonomous run.
