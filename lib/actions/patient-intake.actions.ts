'use server'

import { createClient } from '@/lib/supabase/server'
import { patientIntakeSchema } from '@/lib/schemas/patient-intake.schema'
import type { PatientIntakePayload } from '@/lib/types/patient-intake'

export async function submitIntakeForm(
  payload: PatientIntakePayload
): Promise<{ success: boolean; error?: string }> {
  const parsed = patientIntakeSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const d = parsed.data

  // 1. Upsert the intake submission
  const { data: submission, error: intakeError } = await supabase
    .from('patient_intake_submissions')
    .upsert(
      {
        user_id: user.id,
        form_version: 'patient_intake_v3',
        submitted_at: new Date().toISOString(),
        personal_info: d.personalInfo,
        allergies: d.allergies,
        medical_history: d.medicalHistory,
        risk_factors: d.riskFactors,
        current_medications: d.currentMedications,
        emergency_contacts: d.emergencyContacts,
        x_ray_availability: d.xRayAvailability,
        doctor_notes: d.doctorNotes,
        consents: d.consents,
        status: 'pending_review',
      },
      { onConflict: 'user_id' }
    )
    .select('id')
    .single()

  if (intakeError || !submission) {
    return { success: false, error: intakeError?.message ?? 'Failed to save intake' }
  }

  // 2. Upsert the patients record from personal_info, linked to the submission
  const p = d.personalInfo
  const { error: patientError } = await supabase
    .from('patients')
    .upsert(
      {
        full_name: p.fullName,
        date_of_birth: p.dateOfBirth || null,
        email: p.patientEmail || null,
        insurance_provider: p.insurance || null,
        blood_type: p.bloodType || null,
        national_id: p.patientNationalId || null,
        medical_record_no: p.medicalRecordNumber || null,
        intake_submission_id: submission.id,
        status: 'active',
        notes: d.doctorNotes,
      },
      { onConflict: 'intake_submission_id' }
    )

  if (patientError) {
    // Non-fatal: intake was saved; patient record can be created manually
    console.error('[intake] patient upsert error:', patientError.message)
  }

  return { success: true }
}
