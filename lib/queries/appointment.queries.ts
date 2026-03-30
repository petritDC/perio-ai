import { createClient } from '@/lib/supabase/server'
import type { AppointmentWithNames, WeekSlot } from '@/lib/types/appointment'

export async function getWeekAppointments(weekStart: string): Promise<WeekSlot[]> {
  const supabase = await createClient()

  const days: string[] = []
  const base = new Date(weekStart + 'T00:00:00Z')
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }

  const rangeStart = weekStart + 'T00:00:00Z'
  const rangeEnd = days[6] + 'T23:59:59Z'

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, patient_id, provider_id, title, appointment_type, status,
      start_time, end_time, notes, created_by, created_at, updated_at,
      patient:profiles!appointments_patient_id_fkey(full_name),
      provider:profiles!appointments_provider_id_fkey(full_name)
    `)
    .gte('start_time', rangeStart)
    .lte('start_time', rangeEnd)
    .order('start_time')

  if (error || !data) return days.map((date) => ({ date, appointments: [] }))

  const mapped: AppointmentWithNames[] = (data as any[]).map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    providerId: row.provider_id,
    title: row.title,
    appointmentType: row.appointment_type,
    status: row.status,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patientName: row.patient?.full_name ?? null,
    providerName: row.provider?.full_name ?? null,
  }))

  return days.map((date) => ({
    date,
    appointments: mapped.filter((a) => a.startTime.slice(0, 10) === date),
  }))
}

export async function getAppointment(id: string): Promise<AppointmentWithNames | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, patient_id, provider_id, title, appointment_type, status,
      start_time, end_time, notes, created_by, created_at, updated_at,
      patient:profiles!appointments_patient_id_fkey(full_name),
      provider:profiles!appointments_provider_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    patientId: (data as any).patient_id,
    providerId: (data as any).provider_id,
    title: (data as any).title,
    appointmentType: (data as any).appointment_type,
    status: (data as any).status,
    startTime: (data as any).start_time,
    endTime: (data as any).end_time,
    notes: (data as any).notes,
    createdBy: (data as any).created_by,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
    patientName: (data as any).patient?.full_name ?? null,
    providerName: (data as any).provider?.full_name ?? null,
  }
}
