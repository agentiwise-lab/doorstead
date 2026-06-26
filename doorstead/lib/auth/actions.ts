'use server'

import { redirect } from 'next/navigation'
import { authService } from './service'

export type LoginActionResult = { error: 'invalid_credentials' } | undefined

export async function login(
  _prev: LoginActionResult,
  formData: FormData,
): Promise<LoginActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'invalid_credentials' }
  }

  const result = await authService.signIn(email, password)
  if (!result.ok) {
    return { error: 'invalid_credentials' }
  }

  redirect('/admin')
}

export async function logout(): Promise<void> {
  await authService.signOut()
  redirect('/admin/login')
}
