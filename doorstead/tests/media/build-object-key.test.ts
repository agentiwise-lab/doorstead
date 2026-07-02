import { describe, expect, it, vi } from 'vitest'
import type { UploadFile } from '@/lib/media/contract'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db/anon-client', () => ({ anonClient: {} }))
vi.mock('@/lib/db/server-client', () => ({ createServerClient: () => ({}) }))

const { buildObjectKey } = await import('@/lib/media/service')

function file(contentType: string): UploadFile {
  return { bytes: new Uint8Array([1]), contentType, filename: 'x' }
}

describe('buildObjectKey', () => {
  it('namespaces the key under the listing id so the read policy can join on it', () => {
    const key = buildObjectKey('listing-123', file('image/jpeg'), 'uid-1')
    expect(key).toBe('listing/listing-123/uid-1.jpg')
  })

  it('maps content type to the matching extension', () => {
    expect(buildObjectKey('l', file('image/png'), 'u')).toBe('listing/l/u.png')
    expect(buildObjectKey('l', file('image/webp'), 'u')).toBe(
      'listing/l/u.webp',
    )
  })

  it('falls back to a bin extension for an unknown content type', () => {
    expect(buildObjectKey('l', file('application/octet-stream'), 'u')).toBe(
      'listing/l/u.bin',
    )
  })
})
