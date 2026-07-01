# Creating Issues

_Adding image uploads to Doorstead. You are on `03_begin`._

## Starting point
The PRD and plan are in `doorstead/docs/`. The plan's units are not yet tracked anywhere a loop or an agent can pick them up.

## The job
Publish each plan unit as one self-contained Linear issue, in dependency order, labelled `feat:listing-image-uploads`. Each issue records the branch it lands on and the base it cuts from.

## Run
```
/to-issues
```

## Result
- Seven Linear issues (the tracer plus six units), each with acceptance criteria, blockers, and a `## Branch` block.
- A manifest: `doorstead/docs/issues/listing-image-uploads.md`.

## Check
```bash
git diff 03_begin..03_end
git checkout 03_end
```
