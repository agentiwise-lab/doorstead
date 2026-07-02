-- Doorstead V1 — listing media (Unit 1 / AGE-114)
--
-- Introduces Doorstead-stored images. Today a listing's photos are external
-- URLs in listings.photo_urls (text[]); those stay in place for legacy
-- listings. This table records one row per uploaded image, storing the object
-- key inside a PRIVATE storage bucket rather than an external URL.
--
-- Storage trust model (LOAD-BEARING): the 'listing-media' bucket is private
-- (public=false), so objects are never served over a public URL. Two paths:
--   - WRITE: only the admin (server client, authenticated + in admins) may
--            insert objects. Enforced by storage_listing_media_admin_write.
--   - READ:  the anon role may SELECT (and therefore mint a signed URL for)
--            an object ONLY when that object's key maps to a listing_media row
--            whose listing is live and not deleted. Draft-listing objects and
--            unrelated objects stay unreadable AND unenumerable to anon.
--
-- Cross-policy coupling (LOAD-BEARING): storage_listing_media_anon_read's
-- subquery `... listings.status='live' and listings.deleted_at is null`
-- mirrors listings_public_read (migration 0001). Keep them in lockstep: if
-- listing visibility tightens, tighten this predicate too, or signed links for
-- newly-hidden listings will keep resolving.
--
-- The object key convention is 'listing/<listing_id>/<uuid>'; the join below
-- matches storage.objects.name against listing_media.original_key, so the key
-- stored in the row MUST equal the object name in storage.

create table listing_media (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings(id) on delete cascade,
  original_key text not null unique,
  position     int not null default 0,
  is_cover     boolean not null default false,
  is_floorplan boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index listing_media_listing_id_idx on listing_media (listing_id);

create trigger handle_updated_at
  before update on listing_media
  for each row execute procedure extensions.moddatetime(updated_at);

alter table listing_media enable row level security;

create policy listing_media_public_read on listing_media
  for select to anon
  using (
    listing_id in (
      select id from listings where status = 'live' and deleted_at is null
    )
  );

create policy listing_media_admin_all on listing_media
  for all to authenticated
  using (auth.uid() in (select user_id from admins))
  with check (auth.uid() in (select user_id from admins));

-- Private bucket for Doorstead-hosted images. public=false means objects are
-- only reachable via a signed URL minted through the SELECT policy below.
insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', false)
on conflict (id) do nothing;

create policy storage_listing_media_admin_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'listing-media'
    and auth.uid() in (select user_id from admins)
  )
  with check (
    bucket_id = 'listing-media'
    and auth.uid() in (select user_id from admins)
  );

create policy storage_listing_media_anon_read on storage.objects
  for select to anon
  using (
    bucket_id = 'listing-media'
    and exists (
      select 1
      from listing_media
      join listings on listings.id = listing_media.listing_id
      where listing_media.original_key = storage.objects.name
        and listings.status = 'live'
        and listings.deleted_at is null
    )
  );
