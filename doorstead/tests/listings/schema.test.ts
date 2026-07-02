import { describe, expect, it } from 'vitest'
import {
  ListingDraftSchema,
  ListingLiveSchema,
  validateForPublish,
} from '@/lib/listings/schema'

const validLiveInput = {
  address: '12 Baker Street, London',
  type: 'House' as const,
  priceGbp: 500000,
  beds: 3,
  baths: 2,
  areaSqft: 1200,
  description: 'A lovely home.',
  photoUrls: ['https://example.com/x.jpg'],
}

describe('ListingDraftSchema', () => {
  it('accepts empty input', () => {
    const r = ListingDraftSchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it('rejects negative priceGbp', () => {
    const r = ListingDraftSchema.safeParse({ priceGbp: -1 })
    expect(r.success).toBe(false)
  })

  it('rejects javascript: photoUrl', () => {
    const r = ListingDraftSchema.safeParse({
      photoUrls: ['javascript:alert(1)'],
    })
    expect(r.success).toBe(false)
  })

  it('rejects data:text/html photoUrl', () => {
    const r = ListingDraftSchema.safeParse({
      photoUrls: ['data:text/html,<script>alert(1)</script>'],
    })
    expect(r.success).toBe(false)
  })

  it('accepts https photoUrl', () => {
    const r = ListingDraftSchema.safeParse({
      photoUrls: ['https://example.com/x.jpg'],
    })
    expect(r.success).toBe(true)
  })
})

describe('ListingLiveSchema', () => {
  it('rejects missing address', () => {
    const { address: _omit, ...rest } = validLiveInput
    const r = ListingLiveSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it('accepts empty photoUrls (photo requirement is enforced by validateForPublish)', () => {
    const r = ListingLiveSchema.safeParse({ ...validLiveInput, photoUrls: [] })
    expect(r.success).toBe(true)
  })

  it('rejects unknown type', () => {
    const r = ListingLiveSchema.safeParse({
      ...validLiveInput,
      type: 'Castle',
    })
    expect(r.success).toBe(false)
  })

  it('accepts a fully populated valid input', () => {
    const r = ListingLiveSchema.safeParse(validLiveInput)
    expect(r.success).toBe(true)
  })
})

describe('validateForPublish', () => {
  const noPhotoInput = { ...validLiveInput, photoUrls: [] }

  it('returns {ok:false, missingFields:["description"]} when description missing', () => {
    const { description: _omit, ...rest } = validLiveInput
    const r = validateForPublish(rest, 1)
    expect(r).toEqual({ ok: false, missingFields: ['description'] })
  })

  it('blocks on photoUrls when there are 0 uploads and 0 legacy urls', () => {
    const r = validateForPublish(noPhotoInput, 0)
    expect(r).toEqual({ ok: false, missingFields: ['photoUrls'] })
  })

  it('passes with an uploaded image and no legacy urls', () => {
    const r = validateForPublish(noPhotoInput, 1)
    expect(r.ok).toBe(true)
  })

  it('passes with a legacy url and no uploaded images', () => {
    const r = validateForPublish(validLiveInput, 1)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.address).toBe('12 Baker Street, London')
      expect(r.value.photoUrls).toEqual(['https://example.com/x.jpg'])
    }
  })

  it('passes with both an uploaded image and a legacy url', () => {
    const r = validateForPublish(validLiveInput, 2)
    expect(r.ok).toBe(true)
  })
})
