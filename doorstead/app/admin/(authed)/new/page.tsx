import Link from 'next/link'
import { NewListingForm } from '@/components/admin/NewListingForm'

export default function NewListingPage() {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          New listing
        </h1>
        <Link
          href="/admin"
          className="text-sm text-gray-600 underline hover:text-gray-900"
        >
          Cancel
        </Link>
      </div>
      <NewListingForm />
    </section>
  )
}
