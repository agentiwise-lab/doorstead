import Link from 'next/link'
import type { Listing } from '@/lib/listings/contract'

const formatPrice = (price: number | null): string => {
  if (price === null) return 'Price on request'
  return `£${price.toLocaleString('en-GB')}`
}

export function ListingCard({ listing }: { listing: Listing }) {
  const firstPhoto = listing.photoUrls[0]

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-lg"
    >
      <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="aspect-[4/3] bg-gray-100">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={listing.address ?? 'Property photo'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No photo
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-lg font-semibold text-gray-900">
          {formatPrice(listing.priceGbp)}
        </p>
        <p className="mt-1 text-sm text-gray-700">
          {listing.address ?? 'Address unavailable'}
        </p>
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          {listing.type && (
            <div>
              <dt className="sr-only">Type</dt>
              <dd>{listing.type}</dd>
            </div>
          )}
          {listing.beds !== null && (
            <div>
              <dt className="sr-only">Bedrooms</dt>
              <dd>
                {listing.beds} bed{listing.beds === 1 ? '' : 's'}
              </dd>
            </div>
          )}
          {listing.baths !== null && (
            <div>
              <dt className="sr-only">Bathrooms</dt>
              <dd>
                {listing.baths} bath{listing.baths === 1 ? '' : 's'}
              </dd>
            </div>
          )}
        </dl>
      </div>
      </article>
    </Link>
  )
}
