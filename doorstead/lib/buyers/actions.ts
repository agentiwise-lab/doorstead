'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import type { Session } from '@/lib/auth/contract'
import { buyerService } from '@/lib/buyers/service'

function readString(formData: FormData, name: string): string {
  const v = formData.get(name)
  return typeof v === 'string' ? v.trim() : ''
}

export async function saveListing(formData: FormData): Promise<void> {
  const listingId = readString(formData, 'listingId')

  let session: Session
  try {
    session = await authService.requireBuyer()
  } catch {
    redirect(
      `/sign-in?next=${encodeURIComponent(listingId ? `/listing/${listingId}` : '/')}`,
    )
  }

  if (!listingId) {
    redirect('/')
  }

  await buyerService.saveListing(session.userId, listingId)

  revalidatePath('/shortlist')
  redirect(`/listing/${listingId}`)
}
