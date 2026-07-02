# AFK Coding on Cloud

_Taking the loop off your machine. You are on `v8_begin`._

## Starting point
The next feature, buyer-accounts, is fully drafted: brief, PRD, plan, plan-review, and a dependency-ordered set of Linear issues (`AGE-121` to `AGE-124`), all produced in the Conductor thread and cut from `main`. It is an independent feature, its own line, so this branch carries only its planning docs, not the image-uploads work. Every loop so far has run locally, with you at the keyboard.

## The job
Lift the loop off your device. Configure a Claude routine that runs the orchestrator logic cold on a schedule, in a fresh cloud container cloned from the repo, connected to Linear and Slack. It lists the ready buyer-accounts issues, gates the destructive ones for sign-off, dispatches one fresh worker per issue (each worker self-reviews with `/review-code`, then the orchestrator reviews again independently), and raises reviewable PRs unattended. It never touches `main` and never runs a destructive change without a human's sign-off.

The routine prompt lives in the repo: `doorstead/docs/prompts/afk-routine.md`. It is the loop written out as steps the routine runs cold every time.

## Run
```
# In the routine config (cloud):
#  1. Point it at the repo + the Linear Doorstead project + Slack.
#  2. Paste doorstead/docs/prompts/afk-routine.md as the routine prompt.
#  3. Set the schedule and wire the guardrails (no main, no destructive DB, branch-only).
#  4. Let it run cold.
```

## Result
- A saved Claude routine running the loop cold on a schedule, guardrailed.
- It drains the buyer-accounts backlog (`AGE-121` to `AGE-124`) into reviewable PRs while you are offline, each on a `feat/buyer-accounts` branch cut from this state.
- State lives in the branch and the issues, so each run resumes cold and is safe to repeat.

## Check
```bash
git checkout v8_end
git diff v8_begin..v8_end
cat doorstead/docs/prompts/afk-routine.md
```
