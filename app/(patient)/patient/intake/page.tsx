import { createClient } from '@/lib/supabase/server'
import { getPatientIntake } from '@/lib/queries/patient-intake.queries'
import { PatientIntakeForm } from '@/components/patient/PatientIntakeForm'
import type { PatientIntakePayload } from '@/lib/types/patient-intake'

export default async function PatientIntakePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialData: PatientIntakePayload | undefined
  if (user) {
    const existing = await getPatientIntake(user.id)
    if (existing) {
      initialData = {
        submittedAt: existing.submitted_at,
        formVersion: existing.form_version,
        personalInfo: existing.personal_info,
        allergies: existing.allergies ?? [],
        medicalHistory: existing.medical_history ?? [],
        riskFactors: existing.risk_factors,
        currentMedications: existing.current_medications ?? [],
        emergencyContacts: existing.emergency_contacts ?? [],
        xRayAvailability: existing.x_ray_availability,
        doctorNotes: existing.doctor_notes ?? '',
        consents: existing.consents,
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-12 px-4">
      <PatientIntakeForm initialData={initialData} />
    </div>
  )
}
