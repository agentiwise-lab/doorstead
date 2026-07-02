-- Doorstead V1 — anon read for variant objects (Unit 6 / AGE-119)
--
-- The public render path (getImagesForRender, 'public' context) now signs the
-- web_key and thumb_key variant objects as the anon client, because the gallery
-- hero uses the web variant and cards/filmstrip use the thumb. But the anon read
-- policy from migration 0003 (storage_listing_media_anon_read) only matched an
-- object whose name equals listing_media.original_key. Signed URLs for the web
-- and thumb variants would therefore fail the policy and 404, and stored-only
-- listings would not render for public visitors — breaking this unit's
-- acceptance.
--
-- Widen the key match to original_key OR web_key OR thumb_key. The live-listing
-- predicate is unchanged from 0003 (status = 'live' and deleted_at is null), so
-- the trust model is identical: anon may read an object only when it belongs to
-- a live, non-deleted listing. The variants are simply the same trusted image in
-- other sizes, so they earn the same anon-readability as the original.
--
-- Cross-policy coupling (LOAD-BEARING, mirrors 0003): the live-listing predicate
-- still mirrors listings_public_read (migration 0001). Keep them in lockstep: if
-- listing visibility tightens, tighten this predicate too.

drop policy storage_listing_media_anon_read on storage.objects;

create policy storage_listing_media_anon_read on storage.objects
  for select to anon
  using (
    bucket_id = 'listing-media'
    and exists (
      select 1
      from listing_media
      join listings on listings.id = listing_media.listing_id
      where storage.objects.name in (
          listing_media.original_key,
          listing_media.web_key,
          listing_media.thumb_key
        )
        and listings.status = 'live'
        and listings.deleted_at is null
    )
  );
