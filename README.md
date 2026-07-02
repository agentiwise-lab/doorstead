# Merging Agent PRs

_Reviewing and merging the loop's PR. You are on `07_begin`._

## Starting point
The loop opened one pull request, `feat/listing-image-uploads` into `04_end`, carrying AGE-115 to AGE-119. AGE-120 (the destructive upload UI) is held at the issue level and never entered the PR. CI is green and each unit carries a per-issue bot review, but not one line has been read by a human.

## The job
Be the gate. Review the whole PR at two altitudes, `/review-code` on the changeset and `/review-pr` at the merge boundary, for the cross-file coherence the per-issue passes never saw. Re-verify the merge gate (CI green, a fresh review PASS at the head SHA, every thread resolved). Fix anything the review finds, or file it, then squash-merge on explicit confirmation. Never merge a destructive change without sign-off.

## Run
```
/review-pr feat/listing-image-uploads     # review the whole PR, verify the gate
# fix what the review finds (or file it), re-verify from a clean trunk
gh pr merge <n> --squash --delete-branch   # merge on confirmation, re-verify trunk
```

## Result
- The whole PR reviewed at the PR boundary; findings recorded in `doorstead/docs/ship/listing-image-uploads.md`.
- Real defects fixed before merge or filed as follow-ups.
- The PR squash-merged into the trunk, re-verified from a clean checkout.

## Check
```bash
git checkout 07_end
git diff 07_begin..07_end
cat doorstead/docs/ship/listing-image-uploads.md
```
