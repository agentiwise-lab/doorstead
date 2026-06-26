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

  it('rejects empty photoUrls', () => {
    const r = ListingLiveSchema.safeParse({ ...validLiveInput, photoUrls: [] })
    expect(r.success).toBe(false)
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
  it('returns {ok:false, missingFields:["description"]} when description missing', () => {
    const { description: _omit, ...rest } = validLiveInput
    const r = validateForPublish(rest)
    expect(r).toEqual({ ok: false, missingFields: ['description'] })
  })

  it('returns {ok:false, missingFields:["photoUrls"]} when photoUrls empty', () => {
    const r = validateForPublish({ ...validLiveInput, photoUrls: [] })
    expect(r).toEqual({ ok: false, missingFields: ['photoUrls'] })
  })

  it('returns {ok:true, value} when complete', () => {
    const r = validateForPublish(validLiveInput)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.address).toBe('12 Baker Street, London')
      expect(r.value.photoUrls).toEqual(['https://example.com/x.jpg'])
    }
  })
})
