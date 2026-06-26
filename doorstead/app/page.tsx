import { listingService } from '@/lib/listings/service'
import { ListingCard } from '@/components/listing/ListingCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const listings = await listingService.listLive()

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Properties for sale
        </h1>
        <p className="mt-1 text-sm text-gray-600">Marlowe &amp; Hart</p>
      </header>

      {listings.length === 0 ? (
        <p className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No properties are currently listed. Please check back soon.
        </p>
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
  )
}
