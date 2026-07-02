# Drafting the Next Feature (Conductor)

_Buyer accounts, drafted in parallel. You are on `04_02_begin_conductor`._

## What this is
While the image-upload tracer was being implemented on the main line, the next feature, buyer accounts, was drafted at the same time in a separate Conductor worktree cut off `main`. This branch is the START of that parallel draft: the raw client brief, before any spec or plan.

## The starting point
- `doorstead/docs/briefs/buyer-accounts.md`: the client brief, the same shape of ask a client hands you.

## The job
Run the full brainstorm-to-issues pass on the brief, in this worktree, without touching the image-upload work: write the PRD, slice the plan, review the plan, then publish the issues. The result is on `04_02_end_conductor`.

## Why a separate worktree
Buyer accounts is independent of image uploads, so Conductor cuts it off `main` and keeps the main line clean. Planning-the-next and implementing-the-current run side by side.

## Check
```bash
git checkout 04_02_end_conductor
git diff 04_02_begin_conductor..04_02_end_conductor
```
