import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import { inquiryService } from '@/lib/inquiries/service'
import { PublicHeader } from '@/components/ui/PublicHeader'

export const dynamic = 'force-dynamic'

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export default async function MyInquiriesPage() {
  let email: string
  try {
    const session = await authService.requireBuyer()
    email = session.email
  } catch {
    redirect('/sign-in?next=%2Fmy-inquiries')
  }

  const inquiries = await inquiryService.listForBuyer(email)

  return (
    <div className="min-h-screen bg-brand-50">
      <PublicHeader contextLabel="My inquiries" />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {inquiries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-16 text-center">
            <h2 className="font-display text-xl font-semibold text-brand-900">
              No inquiries yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
              Inquire about a property from its listing page and it will show
              up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {inquiries.map((inquiry) => (
              <li
                key={inquiry.id}
                className="rounded-2xl border border-brand-100 bg-white px-5 py-4 shadow-sm"
              >
                <p className="font-display text-base font-semibold text-brand-900">
                  {inquiry.listingAddress ?? 'Property no longer listed'}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Sent {formatDateTime(inquiry.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
