'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSession } from '@/lib/auth/session'

export async function updateProfile(formData: FormData): Promise<{ success: true } | { error: string }> {
  const session = await requireSession()
  const fullName = (formData.get('fullName') as string)?.trim()
  const newPassword = (formData.get('newPassword') as string)?.trim()
  const confirmPassword = (formData.get('confirmPassword') as string)?.trim()

  if (!fullName) return { error: 'Name is required' }

  if (newPassword) {
    if (newPassword.length < 8) return { error: 'Password must be at least 8 characters' }
    if (newPassword !== confirmPassword) return { error: 'Passwords do not match' }
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  // Update full_name in profiles table
  const { error: profileError } = await admin
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', session.id)

  if (profileError) return { error: profileError.message }

  // Update user_metadata so JWT reflects the new name
  const updatePayload: Record<string, unknown> = {
    data: { full_name: fullName, role: session.role },
  }
  if (newPassword) {
    updatePayload.password = newPassword
  }

  const { error: authError } = await admin.auth.admin.updateUserById(session.id, updatePayload)
  if (authError) return { error: authError.message }

  // Also update via user client so the session cookie refreshes the name
  if (newPassword) {
    await supabase.auth.updateUser({ password: newPassword })
  }

  revalidatePath('/settings')
  return { success: true }
}
