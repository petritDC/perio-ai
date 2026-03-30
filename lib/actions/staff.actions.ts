'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/session'
import {
  inviteStaffSchema,
  updateStaffSchema,
  upsertAvailabilitySchema,
} from '@/lib/schemas/staff'

export async function inviteStaff(formData: FormData) {
  await requireRole(['admin'])

  const raw = {
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
  }

  const parsed = inviteStaffSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: {
      full_name: parsed.data.fullName,
      role: parsed.data.role,
    },
  })

  if (error) return { error: error.message }

  revalidatePath('/settings/staff')
  return { success: true }
}

export async function updateStaffMember(formData: FormData) {
  await requireRole(['admin'])

  const raw = {
    id: formData.get('id'),
    role: formData.get('role') || undefined,
    status: formData.get('status') || undefined,
    fullName: formData.get('fullName') || undefined,
  }

  const parsed = updateStaffSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const update: Record<string, unknown> = {}
  if (parsed.data.role) update.role = parsed.data.role
  if (parsed.data.status) update.status = parsed.data.status
  if (parsed.data.fullName) update.full_name = parsed.data.fullName

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidatePath('/settings/staff')
  revalidatePath(`/settings/staff/${parsed.data.id}`)
  return { success: true }
}

export async function upsertStaffAvailability(
  userId: string,
  rows: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    isAvailable: boolean
  }>
) {
  await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])

  const parsed = upsertAvailabilitySchema.safeParse({ userId, rows })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const upsertRows = parsed.data.rows.map((row) => ({
    user_id: parsed.data.userId,
    day_of_week: row.dayOfWeek,
    start_time: row.startTime,
    end_time: row.endTime,
    is_available: row.isAvailable,
  }))

  const { error } = await supabase
    .from('staff_availability')
    .upsert(upsertRows, { onConflict: 'user_id,day_of_week' })

  if (error) return { error: error.message }

  revalidatePath(`/settings/staff/${userId}`)
  return { success: true }
}

export async function revokeInvite(userId: string) {
  await requireRole(['admin'])

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
