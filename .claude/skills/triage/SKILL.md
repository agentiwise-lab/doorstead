---
name: triage
description: Classify an incoming request or bug from a tracker and route it, clarifying asynchronously when no human is at the terminal. Use when a Linear issue or message arrives needing intake: deciding category, reproducing a claim, asking for missing info, or routing to the right next step. Triggers on a new issue, a request to "triage this", an unlabeled bug report, or a backlog item with no owner. Not for diagnosing a confirmed bug (use /diagnose), not for writing the spec of a ready feature (use /prd), not for executing the fix.
---

# triage

Intake front door: classify an incoming request, verify the claim, route it.

## Inputs

- An incoming request or bug report: a Linear issue, or a message.

## Process

1. Classify into the state machine: category (`bug` | `enhancement`) and state (`needs-triage` | `needs-info` | `ready-for-agent` | `wontfix`). Criterion: the issue carries exactly one category label and one state label.
2. Verify the claim before acting. For a bug, reproduce from the reporter's steps; for any request, check the codebase for an existing implementation or a prior rejection. Criterion: you have a concrete result (reproduced / not reproduced / already exists / previously rejected), not an assumption.
3. If the request needs clarifying and no human is present, post the clarifying questions as a comment, label `needs-info`, and stop. Criterion: open questions are recorded on the issue and no further action is taken this round.
4. Route or reject. A ready feature goes to `/prd`; a ready bug goes to `/diagnose`; an infeasible or duplicate request is rejected with a brief reason and labeled `wontfix`. Criterion: the issue ends in `ready-for-agent` with a routing pointer, or `wontfix` with a one-line reason.

## Hard rules

- Every comment the agent posts during triage starts with a one-line disclaimer that it was AI-generated. Why: a reader with no human in the loop must know the source before trusting the content.
- Apply the `/destructive-change-gate`. If acting would mean a destructive change, comment the plan and the open questions on the issue and stop for sign-off, unless the issue already carries `destructive:signed-off` (the recorded human decision), in which case proceed. Why: silent destructive action on an async tracker has no human to catch it before damage lands; the label is how that human decision rides on the issue.
- Cap clarification rounds. Why: a confused thread that loops never converges and burns the reporter's patience; a bounded count forces a route-or-reject decision.
- Do not re-ask questions already answered in prior triage notes. Why: re-asking signals the agent did not read the thread and erodes trust in the intake.

## Handoff

A ready feature hands off to `/prd`. A ready bug hands off to `/diagnose`. A rejected request stays closed in `wontfix` with its reason.
