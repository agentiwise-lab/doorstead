# PRD: Listing image uploads

Source: docs/briefs/listing-image-uploads.md (client proposal, Marlowe & Hart)
Feature key: listing-image-uploads

## Problem Statement

Admins add listing photos by pasting image URLs into the listing form. This puts the burden of hosting somewhere else: the admin has to upload each photo to a third-party host first, copy the link, and paste it back. Those links are outside Doorstead's control, so a photo can silently break when the external host expires the file, changes the path, or goes down, and a listing that looked complete yesterday shows a broken image today. There is also no first-class notion of a cover photo (it is implicitly "whichever URL is first") and no way to mark which image is the floorplan.

Admins want to select image files from their own machine and have Doorstead take care of the rest: store the images, keep them available, and let them arrange which one leads and which one is the floorplan.

## Solution

From the admin's point of view, the "Photo URLs" section of the listing form becomes an image uploader. The admin picks one or more image files at once (or drags them onto the form), sees each upload appear as a thumbnail, and the images are now hosted by Doorstead itself, not linked from elsewhere. Within the form the admin can:

- reorder images, where the first image is the cover/hero used on the public card and at the top of the listing page,
- explicitly mark any one image as the cover (independent of its position, if they prefer),
- mark any one image as the floorplan,
- remove images.

Doorstead stores the original file it was given plus a web-optimised copy and a small thumbnail, and serves them over private, time-limited links so the underlying files are never publicly guessable. The public site keeps rendering exactly as before: the card grid shows each listing's cover, and the listing detail page shows the full gallery, now backed by uploaded images instead of pasted URLs.

Listings created before this feature, whose photos are external pasted URLs, keep working untouched. Their photos still display on the card and gallery. An admin editing such a listing can leave the existing images as-is or add uploaded images alongside them.

## User Stories

1. As an admin, I want to select multiple image files from my computer in one action and have them attached to the listing, so that I do not upload photos to a third-party host and paste links one at a time.
2. As an admin, I want to drag image files onto the uploader and drop them, so that attaching photos feels direct.
3. As an admin, I want each uploaded image to appear as a thumbnail as soon as it is stored, so that I can confirm the right files were attached.
4. As an admin, I want to reorder the images, so that I control the sequence buyers see.
5. As an admin, I want the first image to be the cover/hero shown on the card and at the top of the listing page, so that the strongest photo leads.
6. As an admin, I want to mark any one image as the cover regardless of its position, so that I can choose the hero without reordering everything.
7. As an admin, I want to mark any one image as the floorplan, so that it is identified as the floorplan rather than a room photo.
8. As an admin, I want to remove an uploaded image from a listing, so that I can drop photos I no longer want.
9. As an admin, I want Doorstead to reject files that are not images or are too large, with a clear message, so that I know why a file did not attach and what to do.
10. As an admin, I want a limit on how many images a listing can hold, with a clear message when I hit it, so that listings stay reasonable and the page stays fast.
11. As an admin, I want my existing listings that use pasted URLs to keep displaying their photos, so that switching to uploads does not break what already works.
12. As an admin editing a legacy pasted-URL listing, I want to add uploaded images to it, so that I can migrate it gradually without re-doing everything at once.
13. As an admin, I want to publish a listing only when it has at least one image (uploaded or legacy), so that no live listing goes out with no photo.
14. As a prospective buyer, I want the listing card to show the cover photo, so that I recognise the property at a glance.
15. As a prospective buyer, I want the listing detail page to show every photo in the intended order, so that I can browse the property fully.
16. As a prospective buyer, I want photos to load quickly and stay available, so that browsing is smooth and images do not break.
17. As a site operator, I want the stored image files to be private and served over links that expire, so that the raw files are not publicly enumerable.

## Decisions (open items in the brief, resolved here)

These were left to "your call" in the brief. They are resolved as product decisions, not deferred:

- **Doorstead stores and serves the bytes itself.** Uploaded images live in Doorstead's own private storage. The public site never links to a third-party host for uploaded images; it serves them through private, time-limited links. This is the whole point of the feature: control the hosting.
- **Allowed file types:** JPEG, PNG, and WebP. Other types (HEIC, GIF, TIFF, SVG, PDF, non-image files) are rejected with a clear message. Rationale: these three cover what estate-agent photography produces and what every browser renders natively; SVG is excluded for safety, HEIC because browsers do not render it.
- **Max file size:** 10 MB per image. Files above the limit are rejected with a clear message naming the limit. Rationale: comfortably fits a high-resolution estate photo while bounding storage and upload time.
- **Max images per listing:** 30. Attempting to exceed it is blocked with a clear message. Rationale: enough for a large property plus floorplan; keeps the gallery and page load sane.
- **Image variants:** for every uploaded image Doorstead keeps the original file, a web-optimised copy (used for the gallery), and a thumbnail (used for the card and the gallery filmstrip). The original is retained so a higher-quality copy can be regenerated later if needed.
- **Cover and floorplan are per-listing roles.** At most one cover and at most one floorplan per listing. The cover defaults to the first image if none is explicitly marked. Marking an image as floorplan does not change ordering.
- **Legacy pasted-URL listings keep working with no migration.** Existing listings whose photos are external URLs continue to render through the same public path as uploaded images. They are read-only as far as the new uploader is concerned (the admin can remove them or add uploads alongside them, but the feature does not re-host them automatically).

## Acceptance Criteria

- [ ] An admin can select two or more image files in a single file-picker action and, after saving, the listing holds all of them.
- [ ] An admin can drag image files onto the uploader area and drop them to attach them.
- [ ] Each successfully stored image shows as a thumbnail in the form before the listing is saved.
- [ ] Uploaded images are stored by Doorstead; the public site serves them from Doorstead's own storage over links that expire, not from a third-party host.
- [ ] For each uploaded image, Doorstead retains the original, a web-optimised copy, and a thumbnail.
- [ ] A file whose type is not JPEG, PNG, or WebP is rejected, the listing is not modified with it, and the admin sees a message naming the allowed types. This is enforced on the server, not only in the browser.
- [ ] A file larger than 10 MB is rejected with a message naming the 10 MB limit. This is enforced on the server, not only in the browser.
- [ ] Attempting to attach images that would take a listing over 30 total is blocked with a message naming the 30-image limit. This is enforced on the server.
- [ ] An admin can reorder images, and the new order persists after saving and reloading the edit form.
- [ ] The first image in order is used as the cover on the public card and as the hero on the listing detail page, unless a different image is explicitly marked as cover.
- [ ] An admin can mark exactly one image as the cover; marking a second image as cover clears the mark on the previous one.
- [ ] An admin can mark exactly one image as the floorplan; marking a second clears the previous one.
- [ ] An admin can remove an image, and after saving it no longer appears in the form or on the public pages.
- [ ] Publishing a listing that has zero images (no uploads and no legacy URLs) is blocked with a clear message; publishing a listing with at least one image succeeds.
- [ ] A listing created before this feature, holding pasted external URLs, still renders its cover on the card and its full gallery on the detail page after this feature ships, with no manual migration.
- [ ] An admin editing a legacy pasted-URL listing can add uploaded images to it and save; both the legacy URLs and the new uploads render together in order.
- [ ] The public card grid and the listing detail gallery render uploaded images and legacy URLs through one consistent path, so a mixed listing shows both without visual difference in behaviour.
- [ ] All image upload, reorder, cover, floorplan, and removal actions are available only to an authenticated admin; an unauthenticated request to perform them is refused.
- [ ] The raw stored image files are not retrievable via a stable public URL; access is via time-limited links only.

## Out of Scope

- Editing or cropping images in-app (rotate, crop, adjust) beyond generating the fixed variants.
- Automatic re-hosting of existing pasted URLs into Doorstead storage (legacy URLs stay as links unless an admin replaces them).
- Bulk operations across multiple listings (e.g. copy a gallery from one listing to another).
- Alt-text authoring per image; existing alt behaviour (address-based) is retained.
- Video or non-image media.
- A public-facing full-screen lightbox or zoom beyond the current gallery behaviour.
- CDN configuration, background re-encoding jobs, or storage-cost dashboards.
- Reordering or cover/floorplan controls on the public site (these are admin-only).
