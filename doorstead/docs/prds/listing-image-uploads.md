# PRD: Listing image uploads

## Problem Statement

Today an admin cannot put a real photo on a listing. The form only accepts a URL the admin has pasted from somewhere else, so before they can use Doorstead at all they must already have each image hosted on a public URL: upload it to Imgur, an S3 bucket, a Dropbox public link, or steal a hotlink from another site. That is a second tool, a second login, and a step that happens entirely outside the product.

The consequences are felt by everyone downstream of that paste:

- **The admin** has no way to upload a photo from their phone or laptop. They cannot reorder beyond nudging a row up or down one slot at a time, they cannot say "this floorplan is a floorplan, not a room", and the only way to set the cover image is to make it the first row.
- **The viewer** on the public listing page sees whatever the external host decides to serve: a full-resolution 8MB original on a phone, an image that 404s because the external host rotated it, or a hotlink that was taken down. Doorstead does not own the pixels, so it cannot guarantee they load, cannot size them for the device, and cannot stop a broken link from reaching a live listing.
- **The business** has its core media sitting on hosts it does not control, with no validation that what was pasted is even an image, no size ceiling, and no count ceiling.

The admin wants to add the actual photos of the actual property, from the device the photos are on, and trust that they will show up fast and correctly for a buyer. The product cannot do that.

## Solution

The admin uploads real image files directly in the listing form, the same way they would attach photos to an email. They pick files (or drag them in), watch each one upload with progress, and the images appear as a grid of thumbnails they can arrange.

From the admin's point of view they can now:

- **Upload many images at once** by selecting multiple files or dragging a batch onto the form. No external host, no pasted URL.
- **Drag thumbnails into the exact order** the photos should appear on the public listing, instead of bumping one row up or down at a time.
- **Mark one image as the cover** that leads the public gallery and represents the listing in the dashboard and on the homepage card.
- **Tag an image as the floorplan**, so a buyer can tell the floorplan apart from the rooms.
- **Remove an image** they no longer want.
- **Trust that bad files are rejected at upload time** with a clear reason: a PDF, a 40MB original, or the 31st image when the cap is 30, never silently becomes part of a listing.

For the viewer, every image Doorstead shows is one Doorstead stored and processed itself. The gallery loads a web-optimised version sized for the page, the thumbnail strip loads small thumbnails, and the cover and floorplan are presented as what they are. Because Doorstead owns the file, the image cannot 404 because someone else took it down.

Behind that, every uploaded file is kept in its original form and also stored as a web-optimised copy and a thumbnail, so the product can serve the right size for the right place without ever re-fetching from a third party.

This replaces the pasted-URL workflow. Listings created or edited after this ships hold uploaded images; the publish rule (a listing needs at least one image to go live) is unchanged, it now counts uploaded images instead of pasted URLs.

## User Stories

1. As an admin, I want to select one or more image files from my device in the listing form, so that I can add the property's real photos without first hosting them somewhere else.
2. As an admin, I want to drag a batch of image files directly onto the form, so that adding photos is as fast as attaching them to an email.
3. As an admin, I want to see each file's upload progress and a clear success or failure state, so that I know which photos made it and which did not.
4. As an admin, I want a file that is not an accepted image type to be rejected with a reason, so that I do not accidentally attach a PDF or a document.
5. As an admin, I want a file over the size limit to be rejected with a reason that states the limit, so that I know to resize it rather than guess why it failed.
6. As an admin, I want to be stopped from exceeding the per-listing image cap, with a message stating the cap, so that a listing does not grow unbounded.
7. As an admin, I want to drag thumbnails to reorder them, so that I can arrange the gallery exactly as a buyer will see it.
8. As an admin, I want to mark one image as the cover, so that the listing leads with the photo I choose rather than whichever happened to be first.
9. As an admin, I want to tag an image as the floorplan, so that a buyer can distinguish the floorplan from the rooms.
10. As an admin, I want to remove an uploaded image, so that I can drop a photo I no longer want on the listing.
11. As an admin, I want my uploaded images, their order, the cover, and the floorplan tag to persist when I save the listing and to reload correctly when I edit it again, so that my arrangement is not lost.
12. As an admin, I want to be prevented from publishing a listing with zero images, with the same publish guard as today, so that no live listing is photoless.
13. As a viewer, I want the public gallery to load images sized for the page rather than full-resolution originals, so that the listing loads quickly on my phone.
14. As a viewer, I want the cover image to lead the gallery and represent the listing on the homepage and dashboard, so that the listing presents its best photo first.
15. As a viewer, I want to recognise the floorplan as a floorplan, so that I can find the layout among the room photos.
16. As an admin, I want existing listings that were created with pasted URLs to keep displaying their current photos after this ships, so that nothing that was live goes blank.

## Acceptance Criteria

- [ ] An admin can select multiple image files at once in the listing form and each begins uploading immediately.
- [ ] An admin can drag a batch of image files onto the form's photo area and they upload, equivalent to selecting them.
- [ ] Each uploading file shows progress and resolves to a visible success (thumbnail) or a per-file error with a reason.
- [ ] A file whose type is not in the accepted set is rejected before it is stored, and the admin sees a message naming the rejection reason.
- [ ] A file larger than the per-file size limit is rejected before it is stored, and the message states the limit.
- [ ] Attempting to add images beyond the per-listing cap is rejected, and the message states the cap; images already added are unaffected.
- [ ] Validation of type, size, and count is enforced on the server, not only in the browser; a request that bypasses the client and submits a disallowed file is rejected.
- [ ] An admin can drag a thumbnail to a new position and the new order is what saves and what the public gallery renders.
- [ ] Exactly one image is the cover at any time; marking a new cover clears the previous one.
- [ ] If no image is explicitly marked cover, the first image in order is treated as the cover.
- [ ] At most one image per listing can carry the floorplan tag; the floorplan tag is independent of cover (an image can be both, neither, or one).
- [ ] An admin can remove an uploaded image; it disappears from the form and is not part of the saved listing.
- [ ] On save, the set of images, their order, the cover, and the floorplan tag persist; reopening the listing for edit shows the same set, order, cover, and tag.
- [ ] For every successfully stored image, a web-optimised copy and a thumbnail exist in addition to the retained original.
- [ ] The public listing gallery renders the web-optimised variant for the main image and thumbnails for the strip, not the original.
- [ ] The cover image leads the public gallery and is the image shown for the listing on the homepage and admin dashboard.
- [ ] An image tagged as floorplan is visually distinguishable as the floorplan on the public listing.
- [ ] Publishing a listing with zero images is blocked with the existing publish guard; the guard counts uploaded images.
- [ ] A listing created before this feature, holding external pasted URLs, still displays those images on its public page after this ships (no live listing goes blank).
- [ ] An upload that fails partway (network drop, server error) does not attach a half-stored image to the listing and surfaces an error the admin can retry from.
- [ ] Only an authenticated admin can upload, reorder, retag, or remove images; an unauthenticated request to do so is rejected.

## Out of Scope

- Editing images in-app (crop, rotate, filters, redaction). Doorstead stores what was uploaded.
- Bulk import of an existing image library, or migrating old pasted-URL images into stored uploads. Old URLs keep rendering as-is; they are not converted.
- Video, 3D tours, or any non-image media.
- AI tagging, auto-cover selection, duplicate detection, or any automatic classification of which photo is which room.
- A separate media library reusable across listings. Images belong to one listing.
- A public CDN strategy or signed-URL expiry policy beyond what storage provides by default.
- Alt-text authoring per image (the gallery keeps deriving alt text from the listing).
- More than one floorplan per listing, or floorplan-specific rendering beyond a distinguishing label.
- Changing the publish rule itself; only the thing it counts changes.

## Open questions

Each is a real decision the product needs but cannot be settled here without the client. The recommendation is the grounded default the plan will build against unless the client overrides it.

1. **Accepted formats.** Question: exactly which image formats does the client want to allow? Recommendation: JPG, PNG, WebP, and HEIC (iPhone photos arrive as HEIC). Confirm with client; HEIC in particular needs a deliberate yes because browsers cannot render HEIC directly and it must be converted to a web format for the optimised/thumbnail variants. If HEIC is dropped, the client must accept that iPhone photos shared as HEIC will be rejected.
2. **Per-file size limit.** Question: what is the largest single image to accept? Recommendation: 10MB. Covers a high-quality phone photo with headroom; large enough that legitimate uploads rarely hit it, small enough to bound storage and processing cost.
3. **Per-listing image cap.** Question: how many images may one listing hold? Recommendation: 30. Generous for a residential listing (rooms, exterior, floorplan) while bounding the gallery and storage. Set to 20 if the client wants tighter galleries.
4. **What happens to the original.** Question: keep the uploaded original indefinitely, or discard it once variants are made? Recommendation: keep the original. Storage is cheap relative to the cost of having thrown away the only full-resolution copy if the client later wants larger renders or print.
5. **Floorplan rendering treatment.** Question: how prominently should a floorplan be presented (inline label, separate section, badge)? Recommendation: a clear label/badge on the image within the existing gallery for V1; defer a dedicated floorplan section. This is a presentation choice the client should see before it is finalised.
6. **Fate of legacy pasted URLs over time.** Question: leave old external URLs rendering forever, or run a one-off migration to pull them into stored uploads later? Recommendation: leave them rendering for now (in scope: they must not break); treat a migration as a separate future deliverable, not part of this PRD.
