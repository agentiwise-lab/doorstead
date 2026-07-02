import { uploadListingImage } from '@/lib/listings/actions'

// The tracer form needs a void-returning action; uploadListingImage returns a
// typed rejection state (Unit 2). Surfacing that message in the UI is Unit 7's
// uploader; here the tracer just triggers the server-side enforcement.
async function uploadImageAction(formData: FormData): Promise<void> {
  'use server'
  await uploadListingImage(formData)
}

// Tracer uploader: one file, its own <form> posting straight to the server
// action. It lives outside ListingForm because a file upload needs a distinct
// form submission from the listing-details save. Reorder/cover/remove and the
// richer uploader come in later units.
export function ImageUpload({
  listingId,
  imageUrls,
}: {
  listingId: string
  imageUrls: string[]
}) {
  return (
    <section className="mt-8 rounded border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700">Photos</h2>

      {imageUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt="Listing photo"
              className="aspect-[4/3] w-full rounded object-cover"
            />
          ))}
        </div>
      )}

      <form action={uploadImageAction} className="mt-4 flex items-center gap-3">
        <input type="hidden" name="id" value={listingId} />
        <input
          type="file"
          name="image"
          accept="image/*"
          className="block text-sm text-gray-700"
        />
        <button
          type="submit"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Upload
        </button>
      </form>
    </section>
  )
}
