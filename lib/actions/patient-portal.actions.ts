'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestAppointment(input: {
  preferredDate: string // YYYY-MM-DD
  preferredTime: string // HH:MM
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const startTime = new Date(`${input.preferredDate}T${input.preferredTime}:00`)
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000) // +30 min

  const { error } = await supabase.from('appointments').insert({
    patient_id: user.id,
    provider_id: null,
    title: input.reason,
    appointment_type: 'periodontal_eval',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    status: 'requested',
    notes: null,
    created_by: user.id,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getPatientAppointments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('appointments')
    .select('id, title, start_time, end_time, status, appointment_type')
    .eq('patient_id', user.id)
    .order('start_time', { ascending: true })

  return data ?? []
}
