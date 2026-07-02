# Implementing Loops

_Automating the issue loop on Doorstead. You are on `06_begin`._

## Starting point
The tracer (AGE-114) is merged into `04_end`. Five issues remain in the backlog: AGE-115 validation, AGE-116 variants, AGE-117 publish guard, AGE-118 order/cover/floorplan, AGE-119 unified render. AGE-120 (upload UI) is destructive and held.

## The job
Cut `feat/listing-image-uploads` from `04_end` and run the implement-then-review loop over the five issues in dependency order, one commit per unit. Each pass implements an issue red-green-refactor, reviews its own diff, fixes findings, then commits before the next. Hold AGE-120.

## Run
```
For each of AGE-115, AGE-116, AGE-117, AGE-118, AGE-119 in order:
  /implement <issue>     # backend, red-green-refactor
  /review-code           # review the unit's diff, fix findings
  commit                 # one commit per unit on feat/listing-image-uploads
```

## Result
- Five units land on `feat/listing-image-uploads`: 66 tests to 102, typecheck and build clean.
- Two migrations added: `0004` variant columns, `0005` anon read for variant objects.
- The `feat/listing-image-uploads` PR into `04_end` is what the merge step takes, a separate human-gated decision.

## Check
```bash
git checkout 06_end
git diff 06_begin..06_end
```
