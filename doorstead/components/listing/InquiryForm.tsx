'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  submitInquiry,
  type SubmitInquiryState,
} from '@/lib/inquiries/actions'

const initialState: SubmitInquiryState = { status: 'idle' }

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? 'Sending…' : 'Send enquiry'}
    </button>
  )
}

const inputClass =
  'mt-1 block w-full rounded border border-gray-300 px-3 py-2.5 text-base shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm'
const labelClass = 'block text-sm font-medium text-gray-700'

export function InquiryForm({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useFormState<SubmitInquiryState, FormData>(
    submitInquiry,
    initialState,
  )

  const fieldErrors =
    state.status === 'error' ? state.fieldErrors : undefined

  if (!open) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
        <p className="text-base font-semibold text-gray-900">
          Interested in this property?
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Leave your details and we&apos;ll be in touch shortly.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 sm:w-auto"
        >
          Enquire about this property
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
      <p className="text-base font-semibold text-gray-900">
        Interested in this property?
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="listingId" value={listingId} />

        <div>
          <label htmlFor="inquiry-name" className={labelClass}>
            Name
          </label>
          <input
            id="inquiry-name"
            name="name"
            type="text"
            autoComplete="name"
            className={inputClass}
          />
          <FieldError message={fieldErrors?.name} />
        </div>

        <div>
          <label htmlFor="inquiry-email" className={labelClass}>
            Email
          </label>
          <input
            id="inquiry-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputClass}
          />
          <FieldError message={fieldErrors?.email} />
        </div>

        <div>
          <label htmlFor="inquiry-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="inquiry-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={inputClass}
          />
          <FieldError message={fieldErrors?.phone} />
        </div>

        {state.status === 'success' && (
          <p
            key={state.token}
            role="status"
            className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            Thanks — we&apos;ll be in touch shortly.
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  )
}
