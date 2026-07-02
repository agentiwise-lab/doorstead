import { saveListing } from '@/lib/buyers/actions'

export function SaveListingButton({ listingId }: { listingId: string }) {
  return (
    <form action={saveListing}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        className="inline-flex items-center rounded-md border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Save to shortlist
      </button>
    </form>
  )
}
