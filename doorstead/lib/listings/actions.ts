'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import { listingService } from '@/lib/listings/service'
import { mediaService } from '@/lib/media/service'
import {
  type UploadRejectionReason,
  validateUpload,
} from '@/lib/media/validation'
import type { ListingInput, ListingStatus } from './contract'
import { ListingDraftSchema, validateForPublish } from './schema'

// Create no longer redirects: the client stages files, then needs the new id to
// upload them before it navigates. So the action hands the id back instead.
export type CreateListingResult =
  | { ok: true; id: string }
  | { ok: false; fieldErrors: Record<string, string> }

export type UpdateListingState = {
  fieldErrors?: Record<string, string>
}

// The client uploader drives uploads one file at a time and needs the outcome of
// each to decide whether to continue, so upload returns a result rather than
// redirecting the way form-post actions do.
export type UploadResult =
  | { ok: true }
  | { ok: false; error: { reason: UploadRejectionReason | 'invalid'; message: string } }

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

// Photos no longer come through the form: images are uploaded separately to
// listing_media, and legacy photo_urls are preserved from the stored row. So the
// candidate carries only the text/number fields the form still owns.
function buildCandidate(formData: FormData): Record<string, unknown> {
  const candidate: Record<string, unknown> = {}
  const address = readString(formData, 'address')
  if (address) candidate.address = address
  const rawType = readType(formData)
  if (rawType !== null) candidate.type = rawType
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
  return candidate
}

type DraftParse =
  | { ok: true; input: ListingInput }
  | { ok: false; fieldErrors: Record<string, string> }

// Draft parsing keeps the existing photo_urls (defaulting to none for a new
// listing) so a save never wipes legacy photos it no longer renders in the form.
function parseDraft(
  formData: FormData,
  existingPhotoUrls: string[],
): DraftParse {
  const parsed = ListingDraftSchema.safeParse(buildCandidate(formData))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const top = issue.path[0]
      if (typeof top === 'string' && !(top in fieldErrors)) {
        fieldErrors[top] = issue.message
      }
    }
    return { ok: false, fieldErrors }
  }
  return {
    ok: true,
    input: toListingInput({ ...parsed.data, photoUrls: existingPhotoUrls }),
  }
}

export async function createListing(
  formData: FormData,
): Promise<CreateListingResult> {
  await authService.requireAdmin()

  // A new listing always starts as a draft: its images are uploaded after it
  // exists (they need its id), and it is published separately once they land.
  const parsed = parseDraft(formData, [])
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors }

  const listing = await listingService.create(parsed.input, 'draft')

  revalidatePath('/')
  return { ok: true, id: listing.id }
}

export async function updateListing(
  _prev: UpdateListingState,
  formData: FormData,
): Promise<UpdateListingState> {
  await authService.requireAdmin()

  const idRaw = formData.get('id')
  const id = typeof idRaw === 'string' ? idRaw.trim() : ''
  if (!id) {
    redirect('/admin?msg=listing-missing')
  }

  const current = await listingService.getById(id)
  if (current === null) {
    redirect('/admin?msg=listing-missing')
  }

  const intent: ListingStatus =
    formData.get('intent') === 'live' ? 'live' : 'draft'

  let input: ListingInput
  if (intent === 'live') {
    // The publish photo requirement counts uploaded media plus any legacy urls,
    // not a form field. Text/number fields still come from the form.
    const uploadedCount = (await mediaService.listForListing(id, 'admin')).length
    const imageCount = uploadedCount + current.photoUrls.length
    const result = validateForPublish(buildCandidate(formData), imageCount)
    if (!result.ok) {
      const fieldErrors: Record<string, string> = {}
      for (const f of result.missingFields) {
        fieldErrors[f] = humanMessageFor(f)
      }
      return { fieldErrors }
    }
    input = { ...result.value, photoUrls: current.photoUrls }
  } else {
    const parsed = parseDraft(formData, current.photoUrls)
    if (!parsed.ok) return { fieldErrors: parsed.fieldErrors }
    input = parsed.input
  }

  const updated = await listingService.update(id, input, intent)
  if (updated === null) {
    redirect('/admin?msg=listing-missing')
  }

  revalidatePath('/')
  revalidatePath(`/listing/${id}`)
  redirect('/admin')
}

export async function publishListing(formData: FormData): Promise<void> {
  await authService.requireAdmin()

  const idRaw = formData.get('id')
  const id = typeof idRaw === 'string' ? idRaw.trim() : ''
  if (!id) {
    redirect('/admin?msg=listing-missing')
  }

  const current = await listingService.getById(id)
  if (current === null) {
    redirect('/admin?msg=listing-missing')
  }

  const candidate: Record<string, unknown> = {
    photoUrls: current.photoUrls,
  }
  if (current.address) candidate.address = current.address
  if (current.type) candidate.type = current.type
  if (current.priceGbp !== null) candidate.priceGbp = current.priceGbp
  if (current.beds !== null) candidate.beds = current.beds
  if (current.baths !== null) candidate.baths = current.baths
  if (current.areaSqft !== null) candidate.areaSqft = current.areaSqft
  if (current.description) candidate.description = current.description

  const uploadedCount = (await mediaService.listForListing(id, 'admin')).length
  const imageCount = uploadedCount + current.photoUrls.length
  const result = validateForPublish(candidate, imageCount)
  if (!result.ok) {
    const fields = encodeURIComponent(result.missingFields.join(','))
    redirect(`/admin/${id}/edit?msg=missing-fields&fields=${fields}`)
  }

  const updated = await listingService.setStatus(id, 'live')
  if (updated === null) {
    redirect('/admin?msg=listing-missing')
  }

  revalidatePath('/')
  revalidatePath(`/listing/${id}`)
  redirect('/admin')
}

export async function unpublishListing(formData: FormData): Promise<void> {
  await authService.requireAdmin()

  const idRaw = formData.get('id')
  const id = typeof idRaw === 'string' ? idRaw.trim() : ''
  if (!id) {
    redirect('/admin?msg=listing-missing')
  }

  const updated = await listingService.setStatus(id, 'draft')
  if (updated === null) {
    redirect('/admin?msg=listing-missing')
  }

  revalidatePath('/')
  revalidatePath(`/listing/${id}`)
  redirect('/admin')
}

export async function uploadListingImage(
  formData: FormData,
): Promise<UploadResult> {
  await authService.requireAdmin()

  const id = readString(formData, 'id')
  const image = formData.get('image')
  if (!id || !(image instanceof File) || image.size === 0) {
    return {
      ok: false,
      error: {
        reason: 'invalid',
        message: 'A listing id and an image file are required.',
      },
    }
  }

  const currentCount = (await mediaService.listForListing(id, 'admin')).length
  const validation = validateUpload(
    { contentType: image.type, byteLength: image.size },
    currentCount,
  )
  if (!validation.ok) {
    return {
      ok: false,
      error: { reason: validation.reason, message: validation.message },
    }
  }

  const bytes = new Uint8Array(await image.arrayBuffer())
  await mediaService.storeImage(id, {
    bytes,
    contentType: image.type,
    filename: image.name,
  })

  revalidatePath(`/listing/${id}`)
  return { ok: true }
}

export async function reorderListingImages(formData: FormData): Promise<void> {
  await authService.requireAdmin()

  const id = readString(formData, 'id')
  if (!id) {
    redirect('/admin?msg=listing-missing')
  }

  const orderedImageIds = readString(formData, 'orderedImageIds')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '')
  await mediaService.reorder(id, orderedImageIds)

  revalidatePath(`/listing/${id}`)
  redirect(`/admin/${id}/edit`)
}

export async function setListingCover(formData: FormData): Promise<void> {
  await authService.requireAdmin()

  const id = readString(formData, 'id')
  const imageId = readString(formData, 'imageId')
  if (!id || !imageId) {
    redirect('/admin?msg=listing-missing')
  }

  await mediaService.setCover(id, imageId)

  revalidatePath(`/listing/${id}`)
  redirect(`/admin/${id}/edit`)
}

export async function setListingFloorplan(formData: FormData): Promise<void> {
  await authService.requireAdmin()

  const id = readString(formData, 'id')
  const imageId = readString(formData, 'imageId')
  if (!id || !imageId) {
    redirect('/admin?msg=listing-missing')
  }

  await mediaService.setFloorplan(id, imageId)

  revalidatePath(`/listing/${id}`)
  redirect(`/admin/${id}/edit`)
}

export async function removeListingImage(formData: FormData): Promise<void> {
  await authService.requireAdmin()

  const id = readString(formData, 'id')
  const imageId = readString(formData, 'imageId')
  if (!id || !imageId) {
    redirect('/admin?msg=listing-missing')
  }

  await mediaService.removeImage(id, imageId)

  revalidatePath(`/listing/${id}`)
  redirect(`/admin/${id}/edit`)
}

export async function deleteListing(formData: FormData): Promise<void> {
  await authService.requireAdmin()

  const idRaw = formData.get('id')
  const id = typeof idRaw === 'string' ? idRaw.trim() : ''
  if (!id) {
    redirect('/admin?msg=listing-missing')
  }

  await listingService.delete(id)

  revalidatePath('/')
  revalidatePath(`/listing/${id}`)
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
