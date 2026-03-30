'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession, requireRole } from '@/lib/auth/session'
import { createAppointmentSchema, updateAppointmentSchema } from '@/lib/schemas/appointment'
import { getStaffAvailability } from '@/lib/queries/staff.queries'
import { createNotification } from '@/lib/actions/notification.actions'

export async function createAppointment(formData: FormData) {
  await requireRole(['admin', 'receptionist'])
  const session = await getSession()

  const raw = {
    patientId: formData.get('patientId'),
    providerId: formData.get('providerId'),
    title: formData.get('title'),
    appointmentType: formData.get('appointmentType'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    notes: formData.get('notes') || undefined,
  }

  const parsed = createAppointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Soft availability warning
  const dayOfWeek = new Date(parsed.data.startTime).getUTCDay()
  const availability = await getStaffAvailability(parsed.data.providerId)
  const daySlot = availability.find((a) => a.dayOfWeek === dayOfWeek)
  const availabilityWarning =
    !daySlot || !daySlot.isAvailable ? 'Provider may not be available on this day.' : null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: parsed.data.patientId,
      provider_id: parsed.data.providerId,
      title: parsed.data.title,
      appointment_type: parsed.data.appointmentType,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      notes: parsed.data.notes ?? null,
      created_by: session?.id ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/schedule')
  if (session?.id) {
    await createNotification({
      userId: session.id,
      type: 'appointment',
      title: `New appointment: ${parsed.data.title}`,
      entityId: data.id,
      entityType: 'appointment',
    })
  }
  return { success: true, id: data.id, availabilityWarning }
}

export async function updateAppointment(formData: FormData) {
  await requireRole(['admin', 'receptionist'])

  const raw = {
    id: formData.get('id'),
    title: formData.get('title') || undefined,
    appointmentType: formData.get('appointmentType') || undefined,
    startTime: formData.get('startTime') || undefined,
    endTime: formData.get('endTime') || undefined,
    status: formData.get('status') || undefined,
    notes: formData.get('notes') || undefined,
  }

  const parsed = updateAppointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const update: Record<string, unknown> = {}
  if (parsed.data.title) update.title = parsed.data.title
  if (parsed.data.appointmentType) update.appointment_type = parsed.data.appointmentType
  if (parsed.data.startTime) update.start_time = parsed.data.startTime
  if (parsed.data.endTime) update.end_time = parsed.data.endTime
  if (parsed.data.status) update.status = parsed.data.status
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidatePath('/schedule')
  revalidatePath(`/schedule/${parsed.data.id}/edit`)
  return { success: true }
}

export async function cancelAppointment(id: string) {
  await requireRole(['admin', 'receptionist'])

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/schedule')
  return { success: true }
}
