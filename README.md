# Doorstead

A small real-estate listings app (Next.js + Supabase) that serves as the demo codebase for the FDE Program's M2 module, "Shipping Code with Engineering Loops." The course runs a real feature through this app on camera. Each video's before and after state is saved as a pair of branches, so a learner can check out the exact starting point and diff it against the finished result.

The application code lives in `doorstead/`. This `main` branch is only the overview; it is not a teaching snapshot.

## Running it and logging in

`cd doorstead && npm install && npm run dev`, then open http://localhost:3000. A dev-only test admin is seeded by `doorstead/supabase/seed.sql` so you can log in and exercise the admin:

- **email:** `admin@doorstead.test`
- **password:** `Passw0rd!demo`

Full setup, the app conventions, and the production-deploy runbook live in the root `CLAUDE.md`.

## How the branches work

Every numbered video has two snapshot branches:

- `NN_begin` carries the starting state plus a runbook README at the repo root that states the job.
- `NN_end` carries the finished state plus a recap README.

To follow a video, check out its `begin` branch, read the root README, then diff it against the `end` branch:

```bash
git checkout 06_begin
cat README.md
git diff 06_begin..06_end
```

## Branch map

| Branches | Video | What it covers |
| --- | --- | --- |
| `02_begin` / `02_end` | V2 Planning with PRDs | write the PRD and plan for image uploads |
| `03_begin` / `03_end` | V3 Issues on Linear | turn the plan into reviewed Linear issues |
| `04_begin` / `04_end` | V4 Implementing an Issue | build the tracer issue (AGE-114) end to end |
| `04_02_begin_conductor` / `04_02_end_conductor` | V4 (parallel track) | the next feature, buyer-accounts, drafted in a separate Conductor worktree cut off `main` |
| `06_begin` / `06_end` | V6 Implementing Loops | the loop takes five issues (AGE-115 to AGE-119) to one PR; AGE-120 was held, then signed off and implemented |
| `feat/listing-image-uploads` | V6 | the feature branch the loop builds on; its PR into `04_end` is the merge exercise |
| `main` | - | this overview |

Notes:

- Videos without code (V0 setup, V1 scoping, V5 loop architecture, V7 merging, V8 cloud) have no snapshot branch. V7's merge happens on the `feat/listing-image-uploads` PR into `04_end`.
- There is no `05_*` pair: V5 is conceptual.
