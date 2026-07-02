import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Listing } from '@/lib/listings/contract'

const formatPrice = (price: number | null): string => {
  if (price === null) return 'Price on request'
  return `£${price.toLocaleString('en-GB')}`
}

export function ListingCard({
  listing,
  saveControl,
}: {
  listing: Listing
  saveControl?: ReactNode
}) {
  const firstPhoto = listing.photoUrls[0]
  const beds = listing.beds
  const baths = listing.baths
  const area = listing.areaSqft

  return (
    <div className="group relative h-full">
      {saveControl && (
        <div className="absolute right-3 top-3 z-10">{saveControl}</div>
      )}
      <Link
        href={`/listing/${listing.id}`}
        className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg">
          <div className="relative aspect-[4/3] overflow-hidden bg-brand-50">
            {firstPhoto ? (
              <img
                src={firstPhoto}
                alt={listing.address ?? 'Property photo'}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-brand-600/60">
                No photo available
              </div>
            )}
            {listing.type && (
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800 shadow-sm">
                {listing.type}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col p-5">
            <p className="font-display text-2xl font-semibold tracking-tight text-brand-900">
              {formatPrice(listing.priceGbp)}
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-gray-600">
              {listing.address ?? 'Address available on request'}
            </p>

            <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-brand-100 pt-4 text-sm text-gray-700">
              {beds !== null && (
                <div className="flex items-center gap-1.5">
                  <dt className="font-semibold text-brand-900">{beds}</dt>
                  <dd className="text-gray-600">
                    bed{beds === 1 ? '' : 's'}
                  </dd>
                </div>
              )}
              {baths !== null && (
                <div className="flex items-center gap-1.5">
                  <dt className="font-semibold text-brand-900">{baths}</dt>
                  <dd className="text-gray-600">
                    bath{baths === 1 ? '' : 's'}
                  </dd>
                </div>
              )}
              {area !== null && (
                <div className="flex items-center gap-1.5">
                  <dt className="font-semibold text-brand-900">
                    {area.toLocaleString('en-GB')}
                  </dt>
                  <dd className="text-gray-600">sq ft</dd>
                </div>
              )}
              {beds === null && baths === null && area === null && (
                <span className="text-gray-400">Details on request</span>
              )}
            </dl>
          </div>
        </article>
      </Link>
    </div>
  )
}
