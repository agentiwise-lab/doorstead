import Link from 'next/link'
import { listingService } from '@/lib/listings/service'
import { ListingRow } from '@/components/admin/ListingRow'

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams?: { msg?: string }
}) {
  const listings = await listingService.listAll()
  const showMissingBanner = searchParams?.msg === 'listing-missing'

  return (
    <section>
      {showMissingBanner && (
        <div
          role="status"
          className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          That listing no longer exists. It may have been deleted in another
          tab.
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Listings
        </h1>
        <Link
          href="/admin/new"
          className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
        >
          New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-600">
            No listings yet. Click &quot;New listing&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Address
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Last updated
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
