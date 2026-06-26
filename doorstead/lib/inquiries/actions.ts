'use server'

import { inquiryService } from '@/lib/inquiries/service'
import { parseInquiry } from './schema'

export type SubmitInquiryState =
  | { status: 'idle' }
  | { status: 'success'; token: number }
  | { status: 'error'; fieldErrors: Record<string, string> }

function readString(formData: FormData, name: string): string {
  const v = formData.get(name)
  return typeof v === 'string' ? v.trim() : ''
}

function nextToken(prev: SubmitInquiryState): number {
  // A distinct identity per success so a repeat submit of identical values
  // still re-renders the confirmation (useActionState dedupes on referential
  // equality of the returned state).
  const base = prev.status === 'success' ? prev.token : Date.now()
  return base + 1
}

export async function submitInquiry(
  prev: SubmitInquiryState,
  formData: FormData,
): Promise<SubmitInquiryState> {
  const candidate = {
    listingId: readString(formData, 'listingId'),
    name: readString(formData, 'name'),
    email: readString(formData, 'email'),
    phone: readString(formData, 'phone'),
  }

  const parsed = parseInquiry(candidate)
  if (!parsed.ok) {
    return { status: 'error', fieldErrors: parsed.fieldErrors }
  }

  await inquiryService.create(parsed.value)

  return { status: 'success', token: nextToken(prev) }
}
