import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ListingForm } from '@/components/admin/ListingForm'
import { updateListing } from '@/lib/listings/actions'
import { listingService } from '@/lib/listings/service'

export default async function EditListingPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = await listingService.getById(params.id)
  if (listing === null) {
    notFound()
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Edit listing
        </h1>
        <Link
          href="/admin"
          className="text-sm text-gray-600 underline hover:text-gray-900"
        >
          Cancel
        </Link>
      </div>
      <ListingForm
        action={updateListing}
        mode="update"
        initialStatus={listing.status}
        initialValues={{
          address: listing.address,
          type: listing.type,
          priceGbp: listing.priceGbp,
          beds: listing.beds,
          baths: listing.baths,
          areaSqft: listing.areaSqft,
          description: listing.description,
          photoUrls: listing.photoUrls,
        }}
        hiddenFields={{ id: listing.id }}
      />
    </section>
  )
}
