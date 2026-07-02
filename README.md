# AFK Coding on Cloud

_Done. You are on `v8_end`._

## Built: the loop, running cold
The loop now runs off your machine. A saved Claude routine executes the orchestrator prompt (`doorstead/docs/prompts/afk-routine.md`) on a schedule, in a fresh cloud container cloned from the repo, connected to Linear and Slack. No laptop, nobody at the keyboard.

## How it runs each cycle
- Lists the ready issues (Backlog or Todo), skips anything not ready, and defers a destructive issue unless it carries `destructive:signed-off`.
- Dispatches one fresh worker per issue: the worker builds test-first, self-reviews its diff with `/review-code`, and returns. The orchestrator then reviews again independently, a second perspective, and dispatches a fix-worker for any auto-fixable findings.
- Raises one reviewable PR per issue, never touching `main` and never merging its own work.
- Reports a per-issue outcome to a Linear status update and Slack, with a push notification only when something ran.

## Result
- The buyer-accounts backlog (`AGE-121` to `AGE-124`) drains into reviewable PRs while you are offline, each on its own `feat/buyer-accounts` branch cut from this state.
- State lives in the branch and the issue, so the next run resumes cold and is safe to repeat.
- You stay the merge gate: review each PR with the `/review-pr` cycle and merge on confirmation.

## Note on this branch
The routine's deliverable is reviewable PRs on GitHub, not a change to this trunk, so `v8_end` shares `v8_begin`'s code. The buyer-accounts feature itself is built by the routine, PR by PR, on `feat/buyer-accounts` branches.

## Check
```bash
git diff v8_begin..v8_end
cat doorstead/docs/prompts/afk-routine.md
```
