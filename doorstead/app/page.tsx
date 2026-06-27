import { listingService } from '@/lib/listings/service'
import { ListingCard } from '@/components/listing/ListingCard'
import { PublicHeader } from '@/components/ui/PublicHeader'

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const listings = await listingService.listLive()

  return (
    <div className="min-h-screen bg-brand-50">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold text-brand-900">
              No properties listed right now
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
              Our portfolio updates regularly. Please check back soon for new
              listings.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
