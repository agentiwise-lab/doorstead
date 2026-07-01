# Reviewing the Plan and Creating Issues

_Adding image uploads to Doorstead. You are on `03_begin`._

## Starting point
The PRD and plan are in `doorstead/docs/`. The plan has not been reviewed, and its units are not yet tracked anywhere a loop or an agent can pick them up.

## The job
Review the plan and apply what the review surfaces, then publish each unit as one self-contained Linear issue in dependency order (label `feat:listing-image-uploads`). Each issue records the branch it lands on and the base it cuts from.

## Run
```
/review-plan
/to-issues
```

## Result
- A plan review at `doorstead/docs/plan-reviews/listing-image-uploads.md`, with the plan updated to address it.
- Seven Linear issues (the tracer plus six units), each with acceptance criteria, blockers, and a `## Branch` block.
- A manifest at `doorstead/docs/issues/listing-image-uploads.md`.

## Check
```bash
git diff 03_begin..03_end
git checkout 03_end
```
