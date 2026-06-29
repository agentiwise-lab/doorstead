# PRD: Listing image uploads

## Problem Statement

Today an admin cannot put a real photo on a listing. The form only accepts a URL the admin has pasted from somewhere else, so before they can use Doorstead at all they must already have each image hosted on a public URL: upload it to Imgur, an S3 bucket, a Dropbox public link, or hotlink from another site. That is a second tool, a second login, and a step that happens entirely outside the product.

The consequences are felt by everyone downstream of that paste. The admin has no way to upload a photo from their phone or laptop. They cannot reorder beyond nudging a row up or down one slot at a time, they cannot say "this floorplan is a floorplan, not a room", and the only way to set the cover image is to make it the first row. The viewer on the public listing page sees whatever the external host decides to serve: a full-resolution original on a phone, an image that 404s because the host rotated it, or a hotlink that was taken down. Doorstead does not own the pixels, so it cannot guarantee they load, cannot size them for the device, and cannot stop a broken link from reaching a live listing. The business has its core media sitting on hosts it does not control, with no validation that what was pasted is even an image, no size ceiling, and no count ceiling.

The admin wants to add the actual photos of the actual property, from the device the photos are on, and trust that they will show up fast and correctly for a buyer. The product cannot do that.

## Solution

The admin uploads real image files directly in the listing form, the same way they would attach photos to an email. They pick files, or drag them in, watch each one upload with progress, and the images appear as a grid of thumbnails they can arrange.

From the admin's point of view they can now upload many images at once by selecting multiple files or dragging a batch onto the form, with no external host and no pasted URL. They can drag thumbnails into the exact order the photos should appear on the public listing, instead of bumping one row up or down at a time. They can mark one image as the cover that leads the public gallery and represents the listing in the dashboard and on the homepage card, and tag one image as the floorplan so a buyer can tell the floorplan apart from the rooms. They can remove an image they no longer want. They can trust that bad files are rejected at upload time with a clear reason: a PDF, a 40 MB original, or the 21st image when the cap is 20, never silently becomes part of a listing, while the valid files in the same batch still go through.

For the viewer, every image Doorstead shows is one Doorstead stored and processed itself. The gallery loads a web-optimised version sized for the page, the thumbnail strip loads small thumbnails, and the cover and floorplan are presented as what they are. Because Doorstead owns the file, the image cannot 404 because someone else took it down. Behind that, every uploaded file is kept in its original form and also stored as a web-optimised copy and a thumbnail, so the product can serve the right size for the right place without ever re-fetching from a third party.

This adds an upload workflow alongside the existing data. The publish rule, that a listing needs at least one image to go live, is unchanged; it now counts uploaded images. A listing that only ever had pasted URLs keeps working and keeps showing those photos.

## User Stories

1. As an admin, I want to select one or more image files from my device in the listing form, so that I can add the property's real photos without first hosting them somewhere else.
2. As an admin, I want to drag a batch of image files directly onto the form, so that adding photos is as fast as attaching them to an email.
3. As an admin, I want to see each file's upload progress and a clear success or failure state, so that I know which photos made it and which did not.
4. As an admin, I want a file that is not an accepted image type to be rejected with a reason, so that I do not accidentally attach a PDF or a document.
5. As an admin, I want a file over the size limit to be rejected with a reason that states the limit, so that I know to resize it rather than guess why it failed.
6. As an admin, I want to be stopped from exceeding the per-listing image cap, with a message stating the cap, so that a listing does not grow unbounded.
7. As an admin, I want the valid files in a batch to upload even when some files in the same batch are rejected, so that one bad file does not block the rest.
8. As an admin, I want to drag thumbnails to reorder them, so that I can arrange the gallery exactly as a buyer will see it.
9. As an admin, I want to mark one image as the cover, so that the listing leads with the photo I choose rather than whichever happened to be first.
10. As an admin, I want to tag an image as the floorplan, so that a buyer can distinguish the floorplan from the rooms.
11. As an admin, I want to remove an uploaded image, so that I can drop a photo I no longer want on the listing.
12. As an admin, I want my uploaded images, their order, the cover, and the floorplan tag to persist when I save the listing and to reload correctly when I edit it again, so that my arrangement is not lost.
13. As an admin, I want to be prevented from publishing a listing with zero images, with the same publish guard as today, so that no live listing is photoless.
14. As a viewer, I want the public gallery to load images sized for the page rather than full-resolution originals, so that the listing loads quickly on my phone.
15. As a viewer, I want the cover image to lead the gallery and represent the listing on the homepage and dashboard, so that the listing presents its best photo first.
16. As a viewer, I want to recognise the floorplan as a floorplan, so that I can find the layout among the room photos.
17. As an admin, I want existing listings that were created with pasted URLs to keep displaying their current photos after this ships, so that nothing that was live goes blank.

## Acceptance Criteria

- [ ] An admin can select multiple image files at once in the listing form and each begins uploading immediately.
- [ ] An admin can drag a batch of image files onto the form's photo area and they upload, equivalent to selecting them.
- [ ] Each uploading file shows progress and resolves to a visible success (thumbnail) or a per-file error with a reason.
- [ ] A file whose type is not PNG, JPG, or JPEG is rejected before it is stored, and the admin sees a message naming the rejection reason; WebP and HEIC are rejected on this rule.
- [ ] A file larger than 10 MB is rejected before it is stored, and the message states the 10 MB limit.
- [ ] Adding images that would take the listing above 20 is rejected, and the message states the cap of 20; images already added are unaffected, and images up to the 20th in the same batch are still accepted.
- [ ] When a batch contains both valid and rejected files, every valid file uploads and every rejected file reports its own reason; no valid file is dropped because a sibling was rejected.
- [ ] Validation of type, size, and count is enforced on the server, not only in the browser; a request that bypasses the client and submits a disallowed file is rejected with the same reasons.
- [ ] Each successfully stored upload is kept as three same-format artifacts: the unmodified original, a web-optimised copy, and a thumbnail; no upload changes a file's format, so a JPG stays a JPG and a PNG stays a PNG.
- [ ] An admin can drag a thumbnail to a new position and the new order is what saves and what the public gallery renders after a reload.
- [ ] Exactly one image is the cover at any time; marking a new cover clears the previous one; if no image is explicitly marked cover, the first image in order is treated as the cover.
- [ ] At most one image per listing can carry the floorplan tag; tagging a second floorplan clears the first; the floorplan tag is independent of cover, so an image can be both, neither, or one.
- [ ] An admin can remove an uploaded image; it disappears from the form and is not part of the saved listing or the public page.
- [ ] On save, the set of images, their order, the cover, and the floorplan tag persist; reopening the listing for edit shows the same set, order, cover, and tag.
- [ ] The public listing gallery renders the web-optimised variant for the main image and thumbnails for the strip, not the original, leading with the cover, and serves them from Doorstead's own storage rather than a third-party host.
- [ ] An image tagged as floorplan carries a visible "Floorplan" badge in the gallery.
- [ ] A listing that has uploaded images shows only those images on the public page; a listing with no uploaded media and a non-empty legacy set of pasted URLs shows those URLs adapted into the gallery's image shape at read, through the same single render path, so no second rendering path exists.
- [ ] Publishing a listing with zero images is blocked with the existing publish guard; the guard counts uploaded images, and a listing with neither uploaded media nor legacy URLs cannot be published.
- [ ] An upload that fails partway (network drop, server error) does not attach a half-stored image to the listing and surfaces an error the admin can retry from.
- [ ] Only an authenticated admin can upload, reorder, retag, or remove images; an unauthenticated request to do so is rejected.

## Out of Scope

- WebP and HEIC uploads, and any upload-time conversion between formats. The three stored artifacts per upload are same-format resizes only.
- Editing images in-app (crop, rotate, filters, redaction). Doorstead stores what was uploaded.
- Migrating old pasted-URL images into stored uploads. Old URLs are kept and keep displaying through the same gallery path; a backfill that turns them into stored files is a separate future deliverable.
- Video, 3D tours, or any non-image media.
- AI tagging, auto-cover selection, duplicate detection, or any automatic classification of which photo is which room.
- A separate media library reusable across listings. Images belong to one listing.
- A public CDN strategy or signed-URL expiry policy beyond what storage provides by default.
- Alt-text authoring per image; the gallery keeps deriving alt text from the listing.
- More than one floorplan per listing, or floorplan rendering beyond a distinguishing badge.
- Changing the publish rule itself; only the thing it counts changes.
