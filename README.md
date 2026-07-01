# Implementing an Issue

_Adding image uploads to Doorstead. You are on `04_begin`._

## Starting point
The PRD, plan, review, and seven issues (AGE-114 to AGE-120) are in place. No code yet.

## The job
Implement the tracer, AGE-114, by hand: the thinnest end-to-end slice (an admin uploads one image, Doorstead stores it, the public page renders it via a signed link). Backend is red-green-refactor. The feature branch is cut from here.

## Run
```
/implement AGE-114
```

## Result
- `feat/listing-image-uploads` cut from `04_begin`; the tracer built (storage adapter, `MediaService`, upload action, `getImagesForRender`, migration) with contract-level tests green.
- Merged into `04_end`; AGE-114 marked done.

## Check
```bash
git diff 04_begin..04_end
git checkout 04_end
```
