# Implementing Loops

_Done. You are on `06_end`._

## Built: AGE-115 to AGE-119 via the loop
The loop ran the five backlog issues on `feat/listing-image-uploads`, one commit per unit, each implemented red-green-refactor and reviewed before the next started.
- AGE-115 validation: reject non JPEG/PNG/WebP, files over 10 MB, and uploads past 30 images. Server-side, typed rejection message.
- AGE-116 variants: web and thumb copies beside the retained original via `sharp`; migration `0004` adds the key columns.
- AGE-117 publish guard: publish counts uploaded media plus legacy URLs, not just pasted URLs.
- AGE-118 order/cover/floorplan: reorder, exactly-one cover, exactly-one floorplan, remove; each admin-gated.
- AGE-119 unified render: one resolver feeds both cards and the gallery; migration `0005` lets anon read the variant objects.
- Tests: 66 to 102, all green. Typecheck and build clean. Contract-level fakes; no test touches real Supabase.

## Then: AGE-120, held by the loop, implemented on sign-off
The loop held AGE-120 because it is destructive: it removes the legacy pasted-URL admin input. Once signed off, it was implemented on the branch as its own change, its backend seams built test-first and the full suite kept green. A real uploader (multi-select, drag-and-drop, reorder, cover, floorplan, remove) replaces the pasted-URL input; new listings stage files, then upload once the draft exists. Legacy `photo_urls` and their public read path are preserved, so existing listings still render. Suite green at 101, typecheck and build clean.

## Decisions
- MIME is trusted from the browser; true content sniffing is its own later unit.
- Variant keys share the original's uuid stem (`x.web.jpg`, `x.thumb.jpg`).
- Cover and floorplan use clear-then-set writes; the at-most-one invariant holds, an atomic index is a later migration.
- Home cards resolve through the same `getImagesForRender` path as the gallery, so sources never diverge.
- Migrations `0004` and `0005` applied to dev on approval.
- AGE-120 was held by the loop, then signed off and implemented; rollback is `git revert`, not a runtime flag.

## Code review
Every unit ran `/review-code` on its own diff before committing; all five passed spec and quality. Reviews live in `doorstead/docs/code-reviews/`. The variant unit's review flagged that anon could not yet read the web and thumb objects; the render unit fixed it with migration `0005`.

## Next
The merge step takes the `feat/listing-image-uploads` PR into `04_end`, a separate human-gated decision.
