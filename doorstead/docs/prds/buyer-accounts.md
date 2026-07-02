# PRD: Buyer accounts

## Problem Statement

Anyone can browse listings and send an inquiry, but a buyer has no reason or way to come back to what they were doing. There is no account, so the site cannot remember which properties a buyer liked, and buyers lose track of which listings they have already messaged the agency about. People email the agency asking "which ones did I message again?" and there is no good answer. Buyers want their own small space that persists across visits: a place to keep the listings they care about and a record of the inquiries they have sent.

## Solution

A buyer can create an account and sign in with Google. Once signed in, they get two things that are private to them:

1. A shortlist. On any listing they can save it or unsave it with a save control, and they can view everything they have saved in one place.
2. A view of the inquiries they have already sent, gathered in one place so they stop losing track.

Signing in is optional for browsing and for sending inquiries. The account only adds the shortlist and the "my inquiries" view on top of the existing public experience. The admin side is untouched, and a buyer can never reach admin screens or see any other person's data.

## User Stories

1. As a visitor, I want to create an account by signing in with Google, so that the site can remember me across visits without my managing another password.
2. As a returning buyer, I want to sign in with Google, so that I get back my saved shortlist and my inquiry history.
3. As a signed-in buyer, I want to sign out, so that my shortlist and inquiries are no longer reachable from this browser.
4. As a signed-in buyer, I want to save a listing from the listings overview, so that I can find it again later.
5. As a signed-in buyer, I want to save a listing from its detail page, so that I can keep it while reading the full details.
6. As a signed-in buyer, I want to unsave a listing I previously saved, so that my shortlist reflects only what I still care about.
7. As a signed-in buyer, I want each listing's save control to show whether it is already on my shortlist, so that I know its current state at a glance.
8. As a signed-in buyer, I want a single page listing every property on my shortlist, so that I can review all my saved options together.
9. As a signed-in buyer, I want to open a saved listing from my shortlist and go to its detail page, so that I can act on it.
10. As a signed-in buyer, I want a single page showing the inquiries I have sent, so that I stop losing track of which listings I have messaged the agency about.
11. As a signed-in buyer, I want my inquiry view to include inquiries I sent before I had an account and inquiries I sent while logged out, so that my history is complete as long as I used my account email.
12. As any visitor, I want to send an inquiry without signing in, so that contacting the agency stays as easy as it is today.
13. As a signed-in buyer, I do not want to reach the admin dashboard or any admin screen, so that account holders and staff stay cleanly separated.
14. As a signed-in buyer, I do not want to see another buyer's shortlist, so that my activity and theirs stay private.
15. As a signed-in buyer, I do not want to see inquiries belonging to anyone else's account email, so that no one else's contact details are exposed to me.

## Acceptance Criteria

### Accounts and sign-in

- [ ] A visitor can complete Google sign-in and end up signed in as a buyer without setting or entering a password.
- [ ] After signing in, the buyer's own account email (as verified by Google) is the identity used everywhere in this feature.
- [ ] A signed-in buyer can sign out, and after signing out the shortlist page and the my-inquiries page no longer return their data.
- [ ] A buyer account (a signed-in user who is not an administrator) never gains any administrative capability by virtue of having an account.

### Shortlist: save and unsave

- [ ] A signed-in buyer can save a live listing from the listings overview and from the listing detail page.
- [ ] A signed-in buyer can unsave a listing they previously saved, from either surface, and it is removed from their shortlist.
- [ ] Saving the same listing more than once results in it appearing on the shortlist exactly once; there are never duplicate shortlist entries for one listing.
- [ ] The save control reflects the listing's current saved/not-saved state for the signed-in buyer when the page loads.
- [ ] When a visitor is not signed in, the save control does not silently save to a shared or anonymous list; an unauthenticated request to save or unsave does not create or modify any shortlist and does not return another buyer's data.

### Shortlist: view

- [ ] A signed-in buyer can open a page that lists every listing currently on their shortlist and nothing they have not saved.
- [ ] A buyer with an empty shortlist sees an empty-state view rather than an error.
- [ ] From the shortlist view a buyer can navigate to the detail page of any saved listing.
- [ ] An unauthenticated request for the shortlist view does not return any shortlist data; it yields no data and directs the visitor to sign in.

### My inquiries: view

- [ ] A signed-in buyer sees exactly the inquiries whose email address equals their Google-verified account email, and no inquiries with any other email.
- [ ] The my-inquiries view includes matching inquiries that were submitted before the account existed and matching inquiries submitted while the buyer was logged out.
- [ ] A buyer with no matching inquiries sees an empty-state view rather than an error.
- [ ] An unauthenticated request for the my-inquiries view does not return any inquiry data; it yields no data and directs the visitor to sign in.

### Authorization boundaries

- [ ] A signed-in buyer who navigates to any admin URL is denied and never reaches an admin screen.
- [ ] One buyer cannot retrieve another buyer's shortlist by any request; each buyer's shortlist is scoped to their own identity.
- [ ] A buyer cannot retrieve inquiries matched to a different account email by any request.

### Anonymous inquiry funnel is unchanged

- [ ] An anonymous visitor can still send an inquiry on a live listing exactly as before, with no sign-in prompt blocking submission.
- [ ] The existing rule that inquiry contact details (name, email, phone) are readable only by an administrator still holds; the buyer-facing my-inquiries view only ever surfaces rows carrying the signed-in buyer's own verified account email.

### Known edge case (accepted)

- [ ] Because the email on an inquiry is free text entered at submit time and is not verified against the sender, a buyer may see an inquiry that a different person submitted while typing the buyer's own email address. This is accepted: the view only ever exposes rows carrying the signed-in buyer's own address, never a third party's contact details.

## Out of Scope

- Sharing a shortlist with anyone else (for example, sending a partner a link). The shortlist is private to each buyer in this feature; a shareable shortlist is deferred to a later PRD.
- Any change to the admin side: no new admin screens, no change to how administrators sign in, and no change to how administrators read or manage inquiries or listings.
- Requiring sign-in to send an inquiry, or otherwise gating or altering the anonymous inquiry funnel.
- Notifications or email of any kind (welcome emails, saved-listing alerts, price-change alerts, inquiry receipts).
- Email/password sign-in, magic links, or any authentication method other than Google for buyers.
- Stamping an account identifier onto inquiries or otherwise attributing past inquiries to a user record. Matching is by verified account email only.
- Buyer profile management beyond sign-in and sign-out (editing name, changing email, deleting the account).
- Any buyer-facing action on a listing beyond save, unsave, and inquire (for example, notes, ratings, or scheduling a viewing).

## Decisions resolved during grill

- Q: How do buyers authenticate? → Sign in with Google (Google social sign-in). Buyers are account holders who are not administrators; no separate password to manage.
- Q: Is the shortlist private or shareable? → Private to each buyer only. Sharing is out of scope and deferred to a later PRD.
- Q: How is "my inquiries" scoped to a buyer? → By matching the buyer's Google-verified account email against the email on each inquiry. This deliberately covers inquiries sent before the account existed and inquiries sent while logged out.
- Q: What is the spoofing edge for email-matched inquiries? → Accepted as low severity. Because inquiry email is unverified free text, a buyer may see an inquiry where someone else typed the buyer's own email; the view never exposes a third party's data. Inquiries are not stamped with a user identifier; matching stays email-based.
- Q: Does the account gate inquiries? → No. Inquiries remain fully open to anonymous visitors; signing in only adds the shortlist and the my-inquiries view. The existing anonymous funnel must not regress.
