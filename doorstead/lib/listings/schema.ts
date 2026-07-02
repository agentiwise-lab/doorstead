import { z } from 'zod'
import type { ListingInput, ListingType } from './contract'

const LISTING_TYPES = [
  'House',
  'Flat',
  'Bungalow',
  'Maisonette',
  'Land',
  'Other',
] as const satisfies readonly ListingType[]

const photoUrlSchema = z
  .string()
  .url()
  .refine(
    (u) => {
      try {
        return /^https?:$/.test(new URL(u).protocol)
      } catch {
        return false
      }
    },
    { message: 'must be http or https' },
  )

const optionalNonNegInt = z.coerce.number().int().nonnegative().optional()

const requiredNonNegInt = z.coerce.number().int().nonnegative()

const optionalNonEmptyString = z
  .string()
  .trim()
  .min(1)
  .optional()

const requiredNonEmptyString = z.string().trim().min(1)

const optionalListingType = z.enum(LISTING_TYPES).optional()

const requiredListingType = z.enum(LISTING_TYPES)

export const ListingDraftSchema = z.object({
  address: optionalNonEmptyString,
  type: optionalListingType,
  priceGbp: optionalNonNegInt,
  beds: optionalNonNegInt,
  baths: optionalNonNegInt,
  areaSqft: optionalNonNegInt,
  description: optionalNonEmptyString,
  photoUrls: z.array(photoUrlSchema).optional().default([]),
})

export const ListingLiveSchema = z.object({
  address: requiredNonEmptyString,
  type: requiredListingType,
  priceGbp: requiredNonNegInt,
  beds: requiredNonNegInt,
  baths: requiredNonNegInt,
  areaSqft: requiredNonNegInt,
  description: requiredNonEmptyString,
  photoUrls: z.array(photoUrlSchema).optional().default([]),
})

export type ListingDraftInput = z.infer<typeof ListingDraftSchema>
export type ListingLiveInput = z.infer<typeof ListingLiveSchema>

export type ValidateForPublishResult =
  | { ok: true; value: ListingInput }
  | { ok: false; missingFields: string[] }

// imageCount is the effective photo count for the listing: uploaded media plus
// legacy photo URLs. A listing may publish with a photo from either source, so
// the photo requirement is enforced here rather than as photoUrls.min(1).
export function validateForPublish(
  input: unknown,
  imageCount: number,
): ValidateForPublishResult {
  const parsed = ListingLiveSchema.safeParse(input)
  const seen = new Set<string>()
  const missingFields: string[] = []
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const top = issue.path[0]
      if (typeof top === 'string' && !seen.has(top)) {
        seen.add(top)
        missingFields.push(top)
      }
    }
  }
  if (imageCount < 1 && !seen.has('photoUrls')) {
    missingFields.push('photoUrls')
  }
  if (!parsed.success || missingFields.length > 0) {
    return { ok: false, missingFields }
  }
  return { ok: true, value: parsed.data satisfies ListingInput }
}
