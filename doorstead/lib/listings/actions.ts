'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import { listingService } from '@/lib/listings/service'
import type { ListingInput, ListingStatus } from './contract'
import { parsePhotoUrls } from './photo-urls'
import { ListingDraftSchema, validateForPublish } from './schema'

export type CreateListingState = {
  fieldErrors?: Record<string, string>
}

function readString(formData: FormData, name: string): string {
  const v = formData.get(name)
  return typeof v === 'string' ? v.trim() : ''
}

function readNumberOrNull(formData: FormData, name: string): number | string | null {
  const v = formData.get(name)
  if (typeof v !== 'string' || v.trim() === '') return null
  return v.trim()
}

function readType(formData: FormData): string | null {
  const v = formData.get('type')
  if (typeof v !== 'string' || v.trim() === '') return null
  return v.trim()
}

type DraftLike = {
  address?: string
  type?: ListingInput['type']
  priceGbp?: number
  beds?: number
  baths?: number
  areaSqft?: number
  description?: string
  photoUrls?: string[]
}

function toListingInput(value: DraftLike): ListingInput {
  return {
    address: value.address ?? null,
    type: value.type ?? null,
    priceGbp: value.priceGbp ?? null,
    beds: value.beds ?? null,
    baths: value.baths ?? null,
    areaSqft: value.areaSqft ?? null,
    description: value.description ?? null,
    photoUrls: value.photoUrls ?? [],
  }
}

export async function createListing(
  _prev: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  await authService.requireAdmin()

  const intentRaw = formData.get('intent')
  const intent: ListingStatus = intentRaw === 'live' ? 'live' : 'draft'

  const photoUrls = parsePhotoUrls(
    typeof formData.get('photoUrls') === 'string'
      ? (formData.get('photoUrls') as string)
      : '',
  )

  const rawType = readType(formData)
  const typeForSchema: string | undefined = rawType === null ? undefined : rawType

  const candidate: Record<string, unknown> = {
    photoUrls,
  }
  const address = readString(formData, 'address')
  if (address) candidate.address = address
  if (typeForSchema !== undefined) candidate.type = typeForSchema
  const priceGbp = readNumberOrNull(formData, 'priceGbp')
  if (priceGbp !== null) candidate.priceGbp = priceGbp
  const beds = readNumberOrNull(formData, 'beds')
  if (beds !== null) candidate.beds = beds
  const baths = readNumberOrNull(formData, 'baths')
  if (baths !== null) candidate.baths = baths
  const areaSqft = readNumberOrNull(formData, 'areaSqft')
  if (areaSqft !== null) candidate.areaSqft = areaSqft
  const description = readString(formData, 'description')
  if (description) candidate.description = description

  if (intent === 'live') {
    const result = validateForPublish(candidate)
    if (!result.ok) {
      const fieldErrors: Record<string, string> = {}
      for (const f of result.missingFields) {
        fieldErrors[f] = humanMessageFor(f)
      }
      return { fieldErrors }
    }
    await listingService.create(result.value, 'live')
  } else {
    const parsed = ListingDraftSchema.safeParse(candidate)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const top = issue.path[0]
        if (typeof top === 'string' && !(top in fieldErrors)) {
          fieldErrors[top] = issue.message
        }
      }
      return { fieldErrors }
    }
    await listingService.create(toListingInput(parsed.data), 'draft')
  }

  revalidatePath('/')
  redirect('/admin')
}

function humanMessageFor(field: string): string {
  switch (field) {
    case 'address':
      return 'Address is required to publish.'
    case 'type':
      return 'Type is required to publish.'
    case 'priceGbp':
      return 'Price is required to publish.'
    case 'beds':
      return 'Beds is required to publish.'
    case 'baths':
      return 'Baths is required to publish.'
    case 'areaSqft':
      return 'Area is required to publish.'
    case 'description':
      return 'Description is required to publish.'
    case 'photoUrls':
      return 'At least one valid photo URL is required to publish.'
    default:
      return `${field} is required to publish.`
  }
}
