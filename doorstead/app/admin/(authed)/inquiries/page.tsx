import { inquiryService } from '@/lib/inquiries/service'
import { formatDateTime } from '@/lib/inquiries/format'

export const dynamic = 'force-dynamic'

export default async function AdminInquiriesPage() {
  const inquiries = await inquiryService.listAll()

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Inquiries
        </h1>
      </div>

      {inquiries.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-600">No inquiries yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Phone', 'Property', 'Received'].map(
                  (label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {inquiry.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {inquiry.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {inquiry.phone}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {inquiry.listingAddress ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDateTime(inquiry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
