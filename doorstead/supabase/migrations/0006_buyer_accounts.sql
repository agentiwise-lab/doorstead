-- Doorstead V1 — buyer accounts tracer bullet (AGE-121)
--
-- Table: saved_listings (a buyer's shortlist)
--
-- Enabling Google sign-in turns on public self-signup for the first time —
-- previously only the pre-provisioned admin fixture could authenticate.
-- Two properties must hold as a result:
--
-- 1. No self-service path mints an administrator. There is still no INSERT/
--    UPDATE/DELETE policy on `admins` for any role (see 0001_listings.sql) —
--    admin membership is granted exclusively via the service-role key, never
--    through the API. A self-signed-up Google buyer can never become an
--    admin by any request they can make.
--
-- 2. Every authenticated read is scoped to the caller, never to "signed in"
--    alone. `saved_listings` is owner-scoped below (auth.uid() = buyer_id).
--    `listings_authenticated_read_live` (added below) mirrors the existing
--    anon read policy exactly (status='live' and deleted_at is null) rather
--    than granting anything wider — a buyer can see the same live listings
--    a signed-out visitor already can, nothing more.

create table saved_listings (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid not null references auth.users(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (buyer_id, listing_id)
);

alter table saved_listings enable row level security;

-- Single owner-scoped policy for all operations: a buyer's shortlist is
-- theirs to read, add to, and (later) remove from. No admin override policy
-- is added — admins have no product reason to read another user's shortlist
-- in this slice, and adding one would widen a read path unnecessarily.
create policy saved_listings_owner_all on saved_listings
  for all to authenticated
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

-- Without this, a signed-in buyer (authenticated role, not in admins) has
-- NO read access to listings at all: listings_public_read (0001) is scoped
-- `to anon` only, and listings_admin_all (0001) is scoped `to authenticated`
-- but gated on admins-table membership. Postgres RLS policies for `anon`
-- do not apply to the `authenticated` role, so without this policy a buyer
-- would get zero rows back from listingService.getById() on a live listing.
create policy listings_authenticated_read_live on listings
  for select to authenticated
  using (status = 'live' and deleted_at is null);
