import { saveListing, unsaveListing } from '@/lib/buyers/actions'

export function SaveListingButton({
  listingId,
  isSaved,
  redirectTo,
}: {
  listingId: string
  isSaved: boolean
  redirectTo?: string
}) {
  const action = isSaved ? unsaveListing : saveListing
  const className = isSaved
    ? 'inline-flex items-center rounded-md border border-brand-600 bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:border-brand-700 hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
    : 'inline-flex items-center rounded-md border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

  return (
    <form action={action}>
      <input type="hidden" name="listingId" value={listingId} />
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
      <button type="submit" className={className}>
        {isSaved ? 'Saved' : 'Save to shortlist'}
      </button>
    </form>
  )
}
