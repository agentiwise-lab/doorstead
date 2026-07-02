'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import type { Session } from '@/lib/auth/contract'
import { buyerService } from '@/lib/buyers/service'
import { isSafeRelativePath } from '@/lib/auth/next-path'

function readString(formData: FormData, name: string): string {
  const v = formData.get(name)
  return typeof v === 'string' ? v.trim() : ''
}

// The redirectTo field arrives from client-controlled form data, so it's an
// open-redirect footgun unless verified as a same-origin relative path.
// Reuses the same check `sanitizeNextPath` (lib/auth/next-path.ts) applies to
// sign-in's `next` param, rather than a weaker ad hoc prefix check.
function resolveRedirect(formData: FormData, fallback: string): string {
  const redirectTo = readString(formData, 'redirectTo')
  return redirectTo && isSafeRelativePath(redirectTo) ? redirectTo : fallback
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
  revalidatePath('/')
  revalidatePath(`/listing/${listingId}`)
  redirect(resolveRedirect(formData, `/listing/${listingId}`))
}

export async function unsaveListing(formData: FormData): Promise<void> {
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

  await buyerService.unsaveListing(session.userId, listingId)

  revalidatePath('/shortlist')
  revalidatePath('/')
  revalidatePath(`/listing/${listingId}`)
  redirect(resolveRedirect(formData, `/listing/${listingId}`))
}
