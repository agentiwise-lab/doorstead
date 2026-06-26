import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
        Listing not available
      </h1>
      <p className="mt-3 text-base text-gray-600">
        This property may have been removed or is no longer being listed.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
      >
        Back to all properties
      </Link>
    </main>
  )
}
