# Code Review: listing-image-uploads-unit-6  (mode: diff)

Reviewed the working diff for AGE-119 (unified render path for gallery and cards).

## Spec-compliance verdict: PASS
## Code-quality verdict: PASS

## Findings

- [SEV: low] [CONF: 0.70] app/page.tsx:12
  Evidence: the home grid calls `getImagesForRender(id, 'public')` once per live
  listing, and each call re-runs `getById` (a listings round-trip the page
  already made via `listLive()`) and signs web+thumb for every image just to use
  the cover thumb. This is extra work per card. It is deliberate: the acceptance
  requires the card to resolve through the SAME path as the gallery so there is
  no behavioural difference between stored-only, legacy-only, and mixed sources.
  A card-only cover resolver would fork the render path, which is exactly what
  this unit unifies. Acceptable at listing-grid scale; matches the Unit-2
  precedent (extra reads accepted for correctness/uniformity). Recorded as a
  Decision, no fix.

- [SEV: low] [CONF: 0.55] app/page.tsx:56
  Evidence: the JSX `.map` destructures a property named `coverThumbUrl`, the same
  identifier as the imported pure helper used a few lines above. Scopes do not
  collide (typecheck + build clean), and the prop name is fixed by the plan
  ("ListingCard takes coverThumbUrl"). Minor readability note only; no change.

No correctness, security, or slop findings otherwise:
- No component imports a service or `@supabase/*`; `ListingCard`, `PhotoGallery`,
  and `ListingDetail` take data as props only. Pages (routes) import the
  `listingService` contract singleton, per `doorstead/CLAUDE.md`.
- Added comments explain WHY (single render path; "cover = first" rule), not
  WHAT. `coverThumbUrl` is a single-line pure helper with a named contract that
  keeps the cover rule in one place; it is the seam the plan calls for.
- Public render signs web+thumb as anon (existing resolver tests assert
  `signContexts = ['public','public']`); admin signs as the server client. The
  new migration `0005_anon_read_variant_objects.sql` widens the anon read policy
  to match `original_key OR web_key OR thumb_key` while preserving 0003's
  live-listing predicate, so public/anon signed URLs for the variants resolve and
  stored-only listings render for visitors. The AGE-116 carry-forward is fixed
  end to end.

## Priority-ranked actions
1. None required. If the per-card resolver cost ever matters at larger grid
   sizes, add a cover-only batch read that still returns a `RenderImage`-shaped
   cover, keeping one render path. Not needed at this scale.
