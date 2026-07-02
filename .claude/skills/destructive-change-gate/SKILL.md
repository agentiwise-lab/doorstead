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

## Check the issue for a recorded sign-off first

The issue is the record of the human's decision. When the change traces to a
tracker issue, read that issue's labels before firing:

- If the issue carries **`destructive:signed-off`**, the human has already
  reviewed this specific destructive change and approved it. Proceed. Do not stop.
- If it does not, fall through to the gate below. This is the default: an
  unreviewed destructive change always stops.

The sign-off is per-issue and specific to the destructive change that issue
describes. It never carries from one issue to another, and it does not cover a
new destructive change discovered after the issue was signed off (that is a
different change; re-surface it).

## When the gate fires

1. Comment on the relevant issue (Linear) with:
   - the plan,
   - the specific features or implementations that would be affected,
   - the open questions the user must answer.
2. STOP. Do not proceed until the user signs off (in person, or by adding
   `destructive:signed-off` to the issue).

## Hard rules

- When unsure whether a change is destructive, treat it as destructive and ask. Default to safe.
- Name the specific commits, tables, or features at risk in the comment, so the user can decide.
- Never proceed silently on a destructive change unless its issue carries `destructive:signed-off`. Absent that label, stop, even in an AFK or autonomous run.
