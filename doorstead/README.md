# doorstead

Listings site for **Marlowe & Hart** (Doorstead V1). Next.js (App Router, TypeScript) + Tailwind + Supabase, deployed to Vercel.

## Local development

```bash
cd doorstead
npm install
cp .env.example .env.local         # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Then open http://localhost:3000.

## First-deploy runbook

Do these once, in order, before the first push.

1. **Create the Supabase project** at https://supabase.com/dashboard. Copy the project ref, URL, and anon key.

2. **Install the Supabase CLI and link the project**:

   ```bash
   cd doorstead
   npm install
   npx supabase login
   npx supabase link --project-ref <ref>
   ```

3. **Apply the schema migration**:

   ```bash
   npx supabase db push
   ```

   Verify in the Supabase Table Editor that `admins` and `listings` exist and that RLS is enabled on both.

4. **Disable email signup** (CRITICAL — without this, anyone can sign themselves up and the RLS gate becomes useless):

   Supabase dashboard → Authentication → Providers → Email → uncheck **"Allow new users to sign up."** Save.

5. **Seed the single admin user** (one-time, local-only — the service role key is never committed and never set in Vercel):

   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=...   # from Supabase dashboard, project settings → API
   npx supabase auth admin create-user --email <admin email> --password <strong password>
   ```

   Capture the returned user UUID. Then in the Supabase SQL editor:

   ```sql
   insert into admins (user_id) values ('<uuid>');
   ```

   Unset the env var when done: `unset SUPABASE_SERVICE_ROLE_KEY`.

6. **Set Vercel env vars** (project settings → environment variables): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Do NOT** set `SUPABASE_SERVICE_ROLE_KEY` in Vercel.

7. **Push to main**. Vercel auto-deploys.

8. **Smoke check** on the deployed URL:

   - [ ] `/` returns 200 and renders the empty-state ("No properties are currently listed.").
   - [ ] In the Supabase SQL editor, insert a test live listing:

     ```sql
     insert into listings (address, type, price_gbp, beds, baths, area_sqft, status, description, photo_urls)
     values (
       '12 Acacia Road, London NW1',
       'Flat',
       450000, 2, 1, 750,
       'live',
       'A bright two-bedroom flat with a south-facing balcony.',
       array['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800']
     );
     ```

     Reload `/`. The card should appear.

   - [ ] On a 375px-wide viewport (Chrome devtools, iPhone SE), `/` renders without horizontal scroll.

   - [ ] In the browser console on `/`, paste:

     ```js
     const c = window.supabase ?? (await import('https://esm.sh/@supabase/supabase-js@2')).createClient(
       '<NEXT_PUBLIC_SUPABASE_URL>', '<NEXT_PUBLIC_SUPABASE_ANON_KEY>'
     )
     await c.auth.signUp({ email: 'x@example.com', password: 'aaaaaa1!' })
     ```

     Expect a `signup_disabled` error (or equivalent). If it succeeds, step 4 was missed.

   - [ ] In the Supabase SQL editor, run:

     ```sql
     update listings set address = address;
     select id, updated_at from listings;
     ```

     `updated_at` should be fresh on every row. This confirms the `moddatetime` trigger is in place.

## Project shape

See `CLAUDE.md` for the deep-module rules (route → contract → service → db).

```
app/                  App Router pages and (later) admin server actions
components/           UI components, organised by feature
lib/
  db/                 the ONLY place that imports @supabase/*
  listings/           contract + DefaultListingService + (later) schemas + actions
  auth/               (Unit 3 onwards)
supabase/migrations/  numbered SQL migrations, run via supabase db push
```
