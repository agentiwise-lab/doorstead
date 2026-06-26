import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeInquiryService } from './fakes'

const fakeInquiryService = new FakeInquiryService()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/inquiries/service', () => ({
  inquiryService: fakeInquiryService,
}))

const { submitInquiry } = await import('@/lib/inquiries/actions')

const LISTING_ID = '11111111-1111-1111-1111-111111111111'

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.append(k, v)
  return fd
}

const validEntries = {
  listingId: LISTING_ID,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+44 7700 900000',
}

beforeEach(() => {
  fakeInquiryService.createCalls = []
  fakeInquiryService.createImpl = async () => {}
})

describe('submitInquiry', () => {
  it('delegates a valid submission to create and returns success with a token', async () => {
    const result = await submitInquiry(
      { status: 'idle' },
      makeFormData(validEntries),
    )

    expect(fakeInquiryService.createCalls.length).toBe(1)
    expect(fakeInquiryService.createCalls[0]).toEqual(validEntries)
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(typeof result.token).toBe('number')
    }
  })

  it('gives each repeat success of identical values a distinct token', async () => {
    const first = await submitInquiry(
      { status: 'idle' },
      makeFormData(validEntries),
    )
    expect(first.status).toBe('success')
    const second = await submitInquiry(first, makeFormData(validEntries))

    expect(second.status).toBe('success')
    if (first.status === 'success' && second.status === 'success') {
      expect(second.token).not.toBe(first.token)
    }
  })

  it('returns an error state and stores nothing for an invalid email', async () => {
    const result = await submitInquiry(
      { status: 'idle' },
      makeFormData({ ...validEntries, email: 'nope' }),
    )

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.fieldErrors.email).toBeTruthy()
    }
    expect(fakeInquiryService.createCalls.length).toBe(0)
  })

  it('returns an error state and stores nothing for an empty name', async () => {
    const result = await submitInquiry(
      { status: 'idle' },
      makeFormData({ ...validEntries, name: '' }),
    )

    expect(result.status).toBe('error')
    expect(fakeInquiryService.createCalls.length).toBe(0)
  })

  it('returns an error state and stores nothing for an over-length phone', async () => {
    const result = await submitInquiry(
      { status: 'idle' },
      makeFormData({ ...validEntries, phone: '0'.repeat(41) }),
    )

    expect(result.status).toBe('error')
    expect(fakeInquiryService.createCalls.length).toBe(0)
  })
})
