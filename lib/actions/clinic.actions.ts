'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { updateClinicSchema } from '@/lib/schemas/staff'

const CLINIC_ID = '00000000-0000-0000-0000-000000000001'

export async function updateClinicProfile(formData: FormData) {
  await requireRole(['admin'])
  const supabase = await createClient()

  const raw = {
    name: formData.get('name') || undefined,
    address: formData.get('address') || undefined,
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    website: formData.get('website') || undefined,
    timezone: formData.get('timezone') || undefined,
    workingHoursStart: formData.get('workingHoursStart') || undefined,
    workingHoursEnd: formData.get('workingHoursEnd') || undefined,
    slotDurationMinutes: formData.get('slotDurationMinutes')
      ? Number(formData.get('slotDurationMinutes'))
      : undefined,
  }

  const parsed = updateClinicSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const update: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) update.name = parsed.data.name
  if (parsed.data.address !== undefined) update.address = parsed.data.address
  if (parsed.data.phone !== undefined) update.phone = parsed.data.phone
  if (parsed.data.email !== undefined) update.email = parsed.data.email || null
  if (parsed.data.website !== undefined) update.website = parsed.data.website || null
  if (parsed.data.timezone !== undefined) update.timezone = parsed.data.timezone
  if (parsed.data.workingHoursStart !== undefined) update.working_hours_start = parsed.data.workingHoursStart
  if (parsed.data.workingHoursEnd !== undefined) update.working_hours_end = parsed.data.workingHoursEnd
  if (parsed.data.slotDurationMinutes !== undefined) update.slot_duration_minutes = parsed.data.slotDurationMinutes

  const { error } = await supabase
    .from('clinic_profile')
    .update(update)
    .eq('id', CLINIC_ID)

  if (error) return { error: error.message }

  revalidatePath('/settings/clinic')
  return { success: true }
}

export async function updateClinicLogo(logoPath: string) {
  await requireRole(['admin'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('clinic_profile')
    .update({ logo_path: logoPath })
    .eq('id', CLINIC_ID)

  if (error) return { error: error.message }

  revalidatePath('/settings/clinic')
  return { success: true }
}
