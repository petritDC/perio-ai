'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/session'
import { createPatientSchema, updatePatientSchema } from '@/lib/schemas/patient'
import type { CreatePatientInput, UpdatePatientInput } from '@/lib/schemas/patient'

export async function createPatient(input: CreatePatientInput): Promise<{ id: string } | { error: string }> {
  await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
  const parsed = createPatientSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...parsed.data, email: parsed.data.email || null })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/patients')
  return { id: data.id }
}

export async function updatePatient(id: string, input: UpdatePatientInput): Promise<{ success: true } | { error: string }> {
  await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
  const parsed = updatePatientSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('patients')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/patients')
  revalidatePath(`/patients/${id}`)
  return { success: true }
}

export async function deletePatient(id: string): Promise<{ success: true } | { error: string }> {
  await requireRole(['admin'])
  const admin = createAdminClient()
  const { error } = await admin.from('patients').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/patients')
  return { success: true }
}

export async function bulkDeletePatients(ids: string[]): Promise<{ success: true } | { error: string }> {
  await requireRole(['admin'])
  if (!ids.length) return { success: true }
  const admin = createAdminClient()
  const { error } = await admin.from('patients').delete().in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/patients')
  return { success: true }
}

export async function admitPatient(submissionId: string): Promise<{ patientId: string } | { error: string }> {
  await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
  // Use admin client to bypass RLS — authorization is already enforced by requireRole above
  const admin = createAdminClient()

  // Fetch the submission
  const { data: submission, error: fetchError } = await admin
    .from('patient_intake_submissions')
    .select('id, personal_info, doctor_notes')
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) return { error: fetchError?.message ?? 'Submission not found' }

  const p = submission.personal_info as Record<string, string>

  // Upsert patient record
  const { data: patient, error: patientError } = await admin
    .from('patients')
    .upsert(
      {
        full_name: p.fullName ?? 'Unknown',
        date_of_birth: p.dateOfBirth || null,
        email: p.patientEmail || null,
        insurance_provider: p.insurance || null,
        blood_type: p.bloodType || null,
        national_id: p.patientNationalId || null,
        medical_record_no: p.medicalRecordNumber || null,
        intake_submission_id: submission.id,
        status: 'active',
        notes: submission.doctor_notes || null,
      },
      { onConflict: 'intake_submission_id' }
    )
    .select('id')
    .single()

  if (patientError || !patient) return { error: patientError?.message ?? 'Failed to create patient' }

  // Mark submission as reviewed
  const { error: updateError } = await admin
    .from('patient_intake_submissions')
    .update({ status: 'reviewed' })
    .eq('id', submissionId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/patients')
  return { patientId: patient.id }
}

export async function addDocumentMetadata(input: {
  patient_id: string
  name: string
  category: string
  storage_path: string
  mime_type?: string
  size_bytes?: number
}): Promise<{ id: string } | { error: string }> {
  const session = await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patient_documents')
    .insert({
      patient_id: input.patient_id,
      file_name: input.name,
      category: input.category,
      file_path: input.storage_path,
      mime_type: input.mime_type,
      file_size: input.size_bytes,
      uploaded_by: session.id,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath(`/patients/${input.patient_id}`)
  return { id: data.id }
}

export async function deleteDocument(id: string, patientId: string): Promise<{ success: true } | { error: string }> {
  await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
  const supabase = await createClient()
  const { error } = await supabase.from('patient_documents').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}
