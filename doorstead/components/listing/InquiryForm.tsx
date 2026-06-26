'use client'

import { useFormState } from 'react-dom'
import {
  submitInquiry,
  type SubmitInquiryState,
} from '@/lib/inquiries/actions'

const initialState: SubmitInquiryState = { status: 'idle' }

export function InquiryForm({ listingId }: { listingId: string }) {
  const [state, formAction] = useFormState<SubmitInquiryState, FormData>(
    submitInquiry,
    initialState,
  )

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />

      <div>
        <label htmlFor="inquiry-name">Name</label>
        <input id="inquiry-name" name="name" type="text" required />
        {state.status === 'error' && state.fieldErrors.name && (
          <p>{state.fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="inquiry-email">Email</label>
        <input id="inquiry-email" name="email" type="email" required />
        {state.status === 'error' && state.fieldErrors.email && (
          <p>{state.fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="inquiry-phone">Phone</label>
        <input id="inquiry-phone" name="phone" type="tel" required />
        {state.status === 'error' && state.fieldErrors.phone && (
          <p>{state.fieldErrors.phone}</p>
        )}
      </div>

      <button type="submit">Send enquiry</button>

      {state.status === 'success' && (
        <p role="status">Thanks — we&apos;ll be in touch shortly.</p>
      )}
    </form>
  )
}
