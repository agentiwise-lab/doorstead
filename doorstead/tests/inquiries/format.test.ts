import { describe, expect, it } from 'vitest'
import { formatDateTime } from '@/lib/inquiries/format'

describe('formatDateTime', () => {
  it('formats an ISO timestamp as a medium date with a short time', () => {
    const out = formatDateTime('2026-07-02T14:30:00.000Z')
    expect(out).toMatch(/2026/)
    expect(out).toMatch(/\d{1,2}:\d{2}/)
  })
})
