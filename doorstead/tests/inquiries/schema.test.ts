import { describe, expect, it } from 'vitest'
import { parseInquiry } from '@/lib/inquiries/schema'

const LISTING_ID = '11111111-1111-1111-1111-111111111111'

const validInput = {
  listingId: LISTING_ID,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+44 7700 900000',
}

describe('parseInquiry', () => {
  it('returns ok:true with a trimmed value for a valid input', () => {
    const r = parseInquiry({ ...validInput, name: '  Jane Doe  ' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toEqual({
        listingId: LISTING_ID,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+44 7700 900000',
      })
    }
  })

  it('rejects an invalid email', () => {
    const r = parseInquiry({ ...validInput, email: 'not-an-email' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors.email).toBeTruthy()
  })

  it('rejects an empty name', () => {
    const r = parseInquiry({ ...validInput, name: '   ' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors.name).toBeTruthy()
  })

  it('rejects an over-length name', () => {
    const r = parseInquiry({ ...validInput, name: 'a'.repeat(201) })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors.name).toBeTruthy()
  })

  it('rejects an over-length email', () => {
    const longLocal = 'a'.repeat(320)
    const r = parseInquiry({ ...validInput, email: `${longLocal}@example.com` })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors.email).toBeTruthy()
  })

  it('rejects an empty phone', () => {
    const r = parseInquiry({ ...validInput, phone: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors.phone).toBeTruthy()
  })

  it('rejects an over-length phone', () => {
    const r = parseInquiry({ ...validInput, phone: '0'.repeat(41) })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors.phone).toBeTruthy()
  })

  it('rejects a non-uuid listingId', () => {
    const r = parseInquiry({ ...validInput, listingId: 'nope' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors.listingId).toBeTruthy()
  })
})
