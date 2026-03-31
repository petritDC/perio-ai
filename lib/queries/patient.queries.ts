import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Patient, PatientListItem, PatientDocument } from '@/lib/types/patient'
import type { RiskFactors } from '@/lib/types/patient-intake'

export interface PatientListParams {
  search?: string
  status?: string
  sort?: string
  page?: number
  limit?: number
}

export async function getPatients(params: PatientListParams = {}): Promise<{ data: PatientListItem[]; count: number }> {
  const admin = createAdminClient()
  const { search, status, sort = 'created_at:desc', page = 1, limit = 20 } = params
  const offset = (page - 1) * limit

  let query = admin
    .from('patients')
    .select('id, full_name, date_of_birth, email, phone, status, created_at, medical_record_no', { count: 'exact' })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,medical_record_no.ilike.%${search}%`)
  }
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const [col, dir] = sort.split(':')
  query = query.order(col ?? 'created_at', { ascending: dir === 'asc' })

  const { data, count } = await query.range(offset, offset + limit - 1)

  return { data: (data ?? []) as PatientListItem[], count: count ?? 0 }
}

export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Patient
}

/** @deprecated Use getPatientWithIntake instead */
export async function getPatientIntakeData(intakeSubmissionId: string | null) {
  if (!intakeSubmissionId) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('patient_intake_submissions')
    .select('allergies, medical_history, risk_factors, current_medications, emergency_contacts, x_ray_availability, doctor_notes, submitted_at, status')
    .eq('id', intakeSubmissionId)
    .single()
  return data
}

export interface PatientIntakeData {
  allergies: string[]
  medical_history: unknown[]
  risk_factors: RiskFactors | null
  current_medications: unknown[]
  emergency_contacts: unknown[]
  x_ray_availability: boolean
  doctor_notes: string | null
  submitted_at: string
  status: string
}

export interface PatientWithIntake extends Patient {
  intake: PatientIntakeData | null
}

export async function getPatientWithIntake(id: string): Promise<PatientWithIntake | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      patient_intake_submissions!intake_submission_id(
        allergies, medical_history, risk_factors, current_medications,
        emergency_contacts, x_ray_availability, doctor_notes, submitted_at, status
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  const row = data as Patient & { patient_intake_submissions: PatientIntakeData | null }
  return {
    ...row,
    intake: row.patient_intake_submissions ?? null,
  }
}

export async function getPendingIntakeSubmissions() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('patient_intake_submissions')
    .select('id, submitted_at, personal_info, allergies, risk_factors')
    .eq('status', 'pending_review')
    .order('submitted_at', { ascending: false })
  return data ?? []
}

export async function getPatientDocuments(patientId: string): Promise<PatientDocument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patient_documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as PatientDocument[]
}
