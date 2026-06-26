import Link from 'next/link'
import type { Listing } from '@/lib/listings/contract'
import { PhotoGallery } from './PhotoGallery'
import { ContactFormEmbed } from './ContactFormEmbed'

const formatPrice = (price: number | null): string => {
  if (price === null) return 'Price on request'
  return `£${price.toLocaleString('en-GB')}`
}

const formatArea = (area: number | null): string | null => {
  if (area === null) return null
  return `${area.toLocaleString('en-GB')} sq ft`
}

export function ListingDetail({ listing }: { listing: Listing }) {
  const address = listing.address ?? 'Address unavailable'
  const area = formatArea(listing.areaSqft)

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Back to all properties
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {address}
        </h1>
      </header>

      <section className="mb-8">
        <PhotoGallery photoUrls={listing.photoUrls} alt={address} />
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
        <p className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          {formatPrice(listing.priceGbp)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          {listing.type && (
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="mt-1 font-medium text-gray-900">{listing.type}</dd>
            </div>
          )}
          {listing.beds !== null && (
            <div>
              <dt className="text-gray-500">Bedrooms</dt>
              <dd className="mt-1 font-medium text-gray-900">{listing.beds}</dd>
            </div>
          )}
          {listing.baths !== null && (
            <div>
              <dt className="text-gray-500">Bathrooms</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {listing.baths}
              </dd>
            </div>
          )}
          {area && (
            <div>
              <dt className="text-gray-500">Area</dt>
              <dd className="mt-1 font-medium text-gray-900">{area}</dd>
            </div>
          )}
        </dl>
      </section>

      {listing.description && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            About this property
          </h2>
          <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
            {listing.description}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Enquire about this property
        </h2>
        <ContactFormEmbed />
      </section>
    </main>
  )
}
