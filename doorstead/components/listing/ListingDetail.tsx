import Link from 'next/link'
import type { Listing } from '@/lib/listings/contract'
import { PhotoGallery } from './PhotoGallery'
import { InquiryForm } from './InquiryForm'

const formatPrice = (price: number | null): string => {
  if (price === null) return 'Price on request'
  return `£${price.toLocaleString('en-GB')}`
}

const formatArea = (area: number | null): string | null => {
  if (area === null) return null
  return `${area.toLocaleString('en-GB')} sq ft`
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-600">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-brand-900">{value}</dd>
    </div>
  )
}

export function ListingDetail({ listing }: { listing: Listing }) {
  const address = listing.address ?? 'Address available on request'
  const area = formatArea(listing.areaSqft)

  const facts: { label: string; value: string }[] = []
  if (listing.type) facts.push({ label: 'Type', value: listing.type })
  if (listing.beds !== null)
    facts.push({ label: 'Bedrooms', value: String(listing.beds) })
  if (listing.baths !== null)
    facts.push({ label: 'Bathrooms', value: String(listing.baths) })
  if (area) facts.push({ label: 'Area', value: area })

  return (
    <div className="min-h-screen bg-brand-50">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-800"
          >
            <span aria-hidden="true">&larr;</span> Back to all properties
          </Link>
        </div>

        <header className="mb-6">
          {listing.type && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              {listing.type}
            </p>
          )}
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
            {address}
          </h1>
        </header>

        <section className="mb-8">
          <PhotoGallery photoUrls={listing.photoUrls} alt={address} />
        </section>

        <section className="mb-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Guide price
          </p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
            {formatPrice(listing.priceGbp)}
          </p>
          {facts.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-brand-100 pt-6 sm:grid-cols-4">
              {facts.map((fact) => (
                <Fact key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </dl>
          )}
        </section>

        {listing.description && (
          <section className="mb-10 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 font-display text-xl font-semibold text-brand-900">
              About this property
            </h2>
            <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
              {listing.description}
            </div>
          </section>
        )}

        <section>
          <InquiryForm listingId={listing.id} />
        </section>
      </main>
    </div>
  )
}
