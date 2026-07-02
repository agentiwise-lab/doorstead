-- Doorstead V1 — listing media variants (Unit 3 / AGE-116)
--
-- Each uploaded image now stores three objects: the retained original plus a
-- web-optimised copy (gallery hero) and a thumbnail (filmstrip/card). This adds
-- the two variant-key columns alongside the existing original_key.
--
-- Existing rows (created before this migration) have no variants; the columns
-- are nullable and default to the original key so those rows still resolve to a
-- valid signed URL until they are re-uploaded. New rows always carry real web
-- and thumb keys written by DefaultMediaService.storeImage.
--
-- The anon read policy on storage.objects (migration 0003) joins on
-- listing_media.original_key only. Signing a web/thumb object as anon therefore
-- would NOT pass that policy today. Public rendering of the variant objects is
-- wired in a later unit; until then the admin (server client) reads resolve.

alter table listing_media
  add column web_key   text not null default '',
  add column thumb_key text not null default '';

update listing_media
  set web_key = original_key, thumb_key = original_key
  where web_key = '' or thumb_key = '';

alter table listing_media
  alter column web_key   drop default,
  alter column thumb_key drop default;
