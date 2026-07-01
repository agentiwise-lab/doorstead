# Doorstead · Video 02: Plan the feature

Doorstead is a property-listings site. Across this module we add a **listing image uploads** feature to it, one video at a time. Every video has two branches: `NN_begin` (before the step) and `NN_end` (after). You are on **`02_begin`**.

## 1. Where you are right now
- The client's requirement is captured as a short brief: `doorstead/docs/briefs/listing-image-uploads.md`.
- `main` is the current product: a listing holds its photos as pasted image URLs.
- The requirement is written down, but it is not yet a spec you can build from, and a few decisions are still open.

## 2. The problem to solve next
- A builder cannot work from a loose brief with open decisions.
- Your job is to turn the brief into a **PRD** (the what, with every open decision locked) and then a dependency-ordered **plan** (the how, sliced into a tracer-first set of units). No new interview: synthesise the brief and the codebase.

## 3. The command to run
```
/prd
/plan
```

## 4. Steps to follow
1. Run `/prd`. It reads the brief, resolves the open decisions (file types, size and count limits, what happens to the legacy pasted URLs), and writes the PRD.
2. Skim the PRD and confirm it matches what you want, especially what is **out of scope**.
3. Run `/plan`. It slices the PRD into dependency-ordered units, with Unit 1 as the thinnest end-to-end tracer.
4. Skim the plan and confirm the tracer and the unit order.

## 5. What you should see (expected output)
- Two new files:
  - `doorstead/docs/prds/listing-image-uploads.md`
  - `doorstead/docs/plans/listing-image-uploads.md`
- The PRD states the goal, the in-scope behaviour, the out-of-scope list, and the locked decisions. The plan names the tracer and a dependency-ordered set of units.
- No application code yet.

## 6. End state, how to check
```bash
git diff 02_begin..02_end     # the exact changes this video should produce
git checkout 02_end           # jump straight to the finished version if you get stuck
```
When the video is done, you have a PRD and a plan to build from. Continue with video 03 (`/to-issues`): `git checkout 03_begin`.
