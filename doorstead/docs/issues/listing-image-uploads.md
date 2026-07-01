# Issues: Listing image uploads

- Project: Doorstead
- Team: Agentiwise
- Label: `feat:listing-image-uploads`
- Source plan: `doorstead/docs/plans/listing-image-uploads.md`

All 7 issues implement on `feat/listing-image-uploads`, cut from `04_begin`.

| # | ID | Title | Blocked by |
|---|------|-------|------------|
| 1 | AGE-114 | Tracer: upload one image, stored by Doorstead, rendered on the public listing page | none, can start immediately |
| 2 | AGE-115 | Server-side validation for image uploads (type, size, count) | AGE-114 |
| 3 | AGE-116 | Generate image variants (web-optimised + thumbnail, keep original) | AGE-114 |
| 4 | AGE-117 | Publish guard counts uploaded media as photos | AGE-114 |
| 5 | AGE-118 | Persist image order, cover, and floorplan | AGE-114 |
| 6 | AGE-119 | Unified render path for gallery and cards | AGE-116, AGE-118 |
| 7 | AGE-120 | [HOLD] Upload UI, removing the legacy pasted-URL input | AGE-115, AGE-118, AGE-119 |

Note: Issue 7 (AGE-120) is DESTRUCTIVE and HELD FOR SIGN-OFF. It removes the legacy pasted-URL admin input. Do not implement until explicitly approved.
