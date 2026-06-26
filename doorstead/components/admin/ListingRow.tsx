import Link from 'next/link'
import type { Listing } from '@/lib/listings/contract'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDeleteButton } from '@/components/admin/ConfirmDeleteButton'
import { publishListing, unpublishListing } from '@/lib/listings/actions'

const formatPrice = (price: number | null): string => {
  if (price === null) return '—'
  return `£${price.toLocaleString('en-GB')}`
}

const formatUpdatedAt = (iso: string): string => {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function ListingRow({ listing }: { listing: Listing }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 text-sm text-gray-900">
        {listing.address ?? 'Untitled'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {listing.type ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {formatPrice(listing.priceGbp)}
      </td>
      <td className="px-4 py-3 text-sm">
        <StatusBadge status={listing.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatUpdatedAt(listing.updatedAt)}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/admin/${listing.id}/edit`}
            className="text-sm text-gray-700 underline hover:text-gray-900"
          >
            Edit
          </Link>
          {listing.status === 'draft' ? (
            <form action={publishListing} className="inline">
              <input type="hidden" name="id" value={listing.id} />
              <button
                type="submit"
                className="text-sm text-gray-700 underline hover:text-gray-900"
              >
                Publish
              </button>
            </form>
          ) : (
            <form action={unpublishListing} className="inline">
              <input type="hidden" name="id" value={listing.id} />
              <button
                type="submit"
                className="text-sm text-gray-700 underline hover:text-gray-900"
              >
                Unpublish
              </button>
            </form>
          )}
          <ConfirmDeleteButton
            listingId={listing.id}
            address={listing.address}
          />
        </div>
      </td>
    </tr>
  )
}
