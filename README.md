# AFK Coding on Cloud

_Done. You are on `08_end`._

## Built: the loop, running cold, and both features landed
The loop now runs off your machine. A saved Claude routine executes the orchestrator prompt (`doorstead/docs/prompts/afk-routine.md`) on a schedule, in a fresh cloud container cloned from the repo, connected to Linear and Slack. No laptop, nobody at the keyboard. This end state is where the two features Doorstead built come together: the image-upload feature the local loop shipped, and the buyer-accounts feature the cloud routine shipped, merged into one trunk.

## How the routine runs each cycle
- Lists the ready issues (Backlog or Todo), skips anything not ready, and defers a destructive issue unless it carries `destructive:signed-off`.
- Dispatches one fresh worker per issue: the worker builds test-first, self-reviews its diff with `/review-code`, and returns. The orchestrator then reviews again independently, a second perspective, and dispatches a fix-worker for any auto-fixable findings.
- Raises a reviewable PR, never touching `main` and never merging its own work.
- Reports a per-issue outcome to a Linear status update and Slack, with a push notification only when something ran.

## What the routine shipped, and what the gate caught
- The buyer-accounts backlog (`AGE-121` to `AGE-124`) was implemented cold on `feat/buyer-accounts`: buyer Google sign-in, save and shortlist, my-inquiries, and the sign-in/out header.
- You stayed the merge gate. The `/review-pr` cycle ran a four-lens adversarial panel over the whole PR and caught three blockers the per-issue reviews missed: buyer sessions dropped at the JWT expiry because the session-refresh middleware skipped buyer routes, a unit test that failed on a fresh clone, and a buyer gate that labelled a database error as "is admin". All three were fixed test-first before merge. The remaining findings are tracked as `AGE-127` to `AGE-130`.
- The record of the review and the fixes is `doorstead/docs/ship/buyer-accounts.md`.

## This branch is the combined end state
`08_end` carries both features merged: image uploads (`AGE-114` to `AGE-120`) and buyer accounts (`AGE-121` to `AGE-124`). Both reworked the listing UI, so the merge integrated them by hand: a listing card and detail now show uploaded images and a save control together, and the migrations line up contiguously (`0001` to `0007`). Verified: `tsc --noEmit` clean, 207 tests across 29 files green, `next build` clean at 12 routes plus middleware.

## Run it yourself
Two setup steps are easy to miss when exercising both features against a fresh Supabase project:

- **Apply every migration, up to `0007`.** The combined branch reads `saved_listings` on the home page, so a database still at `0005` throws a server error on `/`. Migration `0006` creates `saved_listings` plus the buyer RLS policies, and `0007` adds the buyer inquiry-read policy. Apply the full `doorstead/supabase/migrations/` set before loading the app.
- **Enable the Google auth provider**, or buyer sign-in fails with `provider is not enabled`. Create a Google Cloud OAuth web client, add `https://<project-ref>.supabase.co/auth/v1/callback` as its redirect URI, paste the client id and secret into Supabase Authentication > Providers > Google, and add `http://localhost:3000/auth/callback` to the redirect allowlist. Keep email self-signup OFF (see the deploy runbook in `CLAUDE.md` and the header of migration `0007`).

The two sign-in paths differ by design:
- **Admin** signs in with email and password (the seeded admin in `doorstead/supabase/seed.sql`). A listing needs at least one photo before it can be published: the publish guard blocks a live listing with no media.
- **Buyers** sign in with Google only. An inquiry sent from a listing page before signing in shows up under **My inquiries** once the buyer signs in with the same email.

## Check
```bash
git diff 08_begin..08_end
cat doorstead/docs/ship/buyer-accounts.md
cat doorstead/docs/prompts/afk-routine.md
```
