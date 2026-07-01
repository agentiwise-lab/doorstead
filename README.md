# Creating PRDs and Plans

_Done. You are on `02_end`._

## Produced
Two files, no code yet:
- `doorstead/docs/prds/listing-image-uploads.md`: goal, decisions, acceptance, out of scope.
- `doorstead/docs/plans/listing-image-uploads.md`: tracer-first, dependency-ordered units.

## Questions and decisions
Raised while writing the PRD and plan, and how they were answered:
- Which file types? JPEG, PNG, WebP; others rejected.
- Max size per file? 10 MB.
- Max images per listing? 30.
- Where do the bytes live? Doorstead's own private storage, served via signed, expiring links; no third-party hosts.
- Keep full quality? Store the original plus a web copy and a thumbnail.
- Existing pasted-URL listings? Keep rendering, no migration; only the admin URL input is removed (gated, Unit 7).
- Extend `photo_urls` or add a table? New `listing_media` table; the flat array cannot carry order, cover, floorplan, and variant keys.

## Next
```bash
git checkout 03_begin
```
