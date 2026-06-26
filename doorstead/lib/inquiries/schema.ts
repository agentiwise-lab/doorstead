import { z } from 'zod'
import type { InquiryInput } from './contract'

const InquirySchema = z.object({
  listingId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(1).max(40),
})

export type ParseInquiryResult =
  | { ok: true; value: InquiryInput }
  | { ok: false; fieldErrors: Record<string, string> }

export function parseInquiry(input: unknown): ParseInquiryResult {
  const parsed = InquirySchema.safeParse(input)
  if (parsed.success) {
    return { ok: true, value: parsed.data satisfies InquiryInput }
  }
  const fieldErrors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const top = issue.path[0]
    if (typeof top === 'string' && !(top in fieldErrors)) {
      fieldErrors[top] = issue.message
    }
  }
  return { ok: false, fieldErrors }
}
