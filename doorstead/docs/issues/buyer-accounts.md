# Issues: Buyer accounts

- Project: Doorstead
- Team: Agentiwise
- Label: `feat:buyer-accounts`
- Source plan: `doorstead/docs/plans/buyer-accounts.md`

All 4 issues implement on `feat/buyer-accounts`, cut from `04_02_end_conductor`.

| # | ID | Title | Blocked by |
|---|------|-------|------------|
| 1 | AGE-121 | Tracer: sign in with Google, save one live listing, see it on the shortlist | none, can start immediately |
| 2 | AGE-122 | Unsave, and the save control reflects saved state on both surfaces | AGE-121 |
| 3 | AGE-123 | My inquiries: a buyer sees inquiries matched to their verified account email | AGE-121 |
| 4 | AGE-124 | Buyer sign-in / sign-out entry point in the public header, and admin-boundary check | AGE-121, AGE-123 |

Notes:
- No unit is destructive; there are no HOLD issues. The feature is additive (new `saved_listings` table, one additive authenticated-role SELECT policy on `listings` scoped to live, one additive verified-email SELECT policy on `inquiries`, new buyer pages and controls). Admin surfaces and the anonymous inquiry funnel are untouched.
- Two reviewed decisions carried from the plan review: enabling the Google provider opens public self-signup for the first time, and the inquiries read boundary intentionally widens from admin-only to admin OR verified-self-email. Both are recorded in the plan and its review.
- Migration prefixes are not hardcoded in the issues: the implementer picks the next unused prefix at implement time, because the parallel `listing-image-uploads` feature also introduces a migration from the same lineage.
