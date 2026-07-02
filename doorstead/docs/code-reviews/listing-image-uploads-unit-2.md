# Code Review: listing-image-uploads-unit-2  (mode: diff)

## Spec-compliance verdict: PASS
## Code-quality verdict: PASS

## Findings
- [SEV: low] [CONF: 0.55] lib/media/validation.ts:24
  Evidence: `validateUpload` trusts the client-supplied `contentType` (MIME) for the
  type check; it does not sniff magic bytes. A client could spoof `image/jpeg`.
  This matches the plan, which specifies validation on `contentType`. Recorded as
  a Decision, not a required fix for this unit. No action taken.

- [SEV: low] [CONF: 0.50] lib/listings/actions.ts:246
  Evidence: `currentCount` is fetched via `listForListing(id, 'admin')` on every
  upload. This is one extra read per upload but is required to enforce the 30-count
  cap server-side, and uploads are low-frequency admin actions. Acceptable; no fix.

## Priority-ranked actions
1. None. No material findings. Server-side enforcement is correct, tests drive the
   pure function and the action through the `FakeMediaService` contract boundary,
   rejected uploads leave the listing unchanged, and messages name the type / 10 MB
   / 30-image limits per the acceptance criteria.
