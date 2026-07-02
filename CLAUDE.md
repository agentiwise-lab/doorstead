# real-estate-project

Client project for **Doorstead** (Real Estate). The app lives in `doorstead/` (Next.js App Router + TypeScript + Tailwind + Supabase, deployed to Vercel). This file is the single home for how the repo and the app are built, run, and tracked.

## Linear

Work for this repo is tracked in Linear.

- **Workspace:** agentiwise
- **Project:** Doorstead — https://linear.app/agentiwise/project/doorstead-e15edb7840ab
- **Project ID:** `eeef63b5-fcd1-4aa3-9a80-59932d24472f`
- **Team:** Agentiwise (`AGE`)
- **Team ID:** `485073dc-ae49-4099-af99-54c2e19dd3e1`

### MCP

Linear MCP is configured locally for this project (HTTP transport):

- URL: `https://mcp.linear.app/mcp`
- Scope: local (`~/.claude.json`, project-scoped)
- Tools: `mcp__linear__*`

### Usage conventions

- When listing/creating issues, default to **team `AGE`** and **project `Doorstead`** unless told otherwise.
- Filter `list_issues` by `project: "Doorstead"` or `team: "AGE"` to keep results scoped.
- New issues belong to the Doorstead project by default.

## Running the app

### Local development

```bash
cd doorstead
npm install
cp .env.example .env.local         # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Then open http://localhost:3000.

### Test admin (dev only)

So anyone can log in and exercise the admin (listings, image uploads), `doorstead/supabase/seed.sql` seeds a ready-made admin:

- **email:** `admin@doorstead.test`
- **password:** `Passw0rd!demo`

The seed runs automatically on `supabase db reset` against the local stack. For a hosted dev project, paste `doorstead/supabase/seed.sql` into the SQL editor once. It is idempotent. **Dev only** — never seed this known-password account into production; the first-deploy runbook provisions the real admin separately.

### First-deploy runbook

Do these once, in order, before the first push.

1. **Create the Supabase project** at https://supabase.com/dashboard. Copy the project ref, URL, and anon key.
2. **Install the Supabase CLI and link the project**:

   ```bash
   cd doorstead
   npm install
   npx supabase login
   npx supabase link --project-ref <ref>
   ```

3. **Apply the schema migration**: `npx supabase db push`. Verify in the Table Editor that `admins` and `listings` exist and that RLS is enabled on both.
4. **Disable email signup** (CRITICAL — without this, anyone can sign themselves up and the RLS gate becomes useless): Supabase dashboard → Authentication → Providers → Email → uncheck **"Allow new users to sign up."** Save.
5. **Provision the production admin** (one-time, local-only — the service role key is never committed and never set in Vercel):

   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=...   # from Supabase dashboard, project settings → API
   npx supabase auth admin create-user --email <admin email> --password <strong password>
   ```

   Capture the returned user UUID, then in the SQL editor: `insert into admins (user_id) values ('<uuid>');`. Unset the env var when done.
6. **Set Vercel env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Do NOT** set `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
7. **Push to main**. Vercel auto-deploys.
8. **Smoke check** on the deployed URL: `/` returns 200 with the empty-state; email signup returns `signup_disabled`; the `moddatetime` trigger keeps `updated_at` fresh on `update listings set address = address`.

## App conventions (`doorstead/`)

These apply to every file inside `doorstead/`. Non-negotiable for V1; later units extend the same shape. Paths below are relative to `doorstead/`.

### Module direction (deep modules — do not reverse)

```
routes (app/**)  →  service contract (lib/*/contract.ts)
                    ↘ never imports Supabase directly
service impl (lib/*/service.ts)  →  lib/db/*
lib/db/*  →  @supabase/supabase-js
```

- Routes (server components, server actions) import only `ListingService` and `AuthService` contract types and their typed singletons. Never `@supabase/*`.
- `Default*Service` implementations are the only callers of `lib/db/`.
- `lib/db/` is the only folder that imports `@supabase/supabase-js`.
- UI components in `components/**` never import services or the DB. They receive data and callbacks as props.

### Two Supabase clients

- `lib/db/anon-client.ts` — cookie-free, used by public reads. RLS sees the anon role.
- `lib/db/server-client.ts` — cookie-aware, used by admin reads and writes. RLS sees the authenticated user via membership in the `admins` table.

Public routes use anon. Admin routes use server-client. Never mix.

### Public route caching

Public routes (`/`, `/listing/[id]`) set `export const dynamic = 'force-dynamic'` so a fresh read runs on every request — edits to live listings must show on the next page load. Admin server actions that mutate listings call `revalidatePath('/')` and, for per-listing edits, `revalidatePath('/listing/${id}')`.

### Photos

- Use plain `<img>`, NEVER `next/image`. Photos come from arbitrary external hosts; `next/image` would require every host in `remotePatterns` behind a code change + redeploy.
- The description field is rendered as React text children with `whitespace-pre-wrap`. NEVER `dangerouslySetInnerHTML`.

### Admin auth gate

Every admin server action calls `authService.requireAdmin()` as its first line. Next.js middleware does NOT execute for server actions invoked from non-admin paths, so each action is its own gate. `requireAdmin()` checks both the Supabase session AND membership in the `admins` table.

### Tests

- `tests/` at the app root.
- Pure-function tests on schemas and `validateForPublish`.
- Action tests against a `FakeListingService` implementing the contract — fakes, not mocks.
- Frontend components: implement directly, no TDD.
- Every new function gets a test; modified functions get their test created or updated. Scope is the touched function only; do not backfill.

### SQL migrations

- Live in `supabase/migrations/`, numbered `0001_*`, `0002_*`, …
- Run via `npx supabase db push`. Never via the SQL editor — that breaks the migration lineage.

### Comments

Default to no comments. Only add one when the WHY is non-obvious: a hidden constraint, a workaround, behavior that would surprise the next reader. Never WHAT the code does — well-named identifiers do that.

## Project shape

```
doorstead/
  app/                  App Router pages and admin server actions
  components/           UI components, organised by feature
  lib/
    db/                 the ONLY place that imports @supabase/*
    listings/           contract + DefaultListingService + schemas + actions
    auth/               session + admin gate
  supabase/migrations/  numbered SQL migrations, run via supabase db push
  supabase/seed.sql     dev-only test-admin seed
```
