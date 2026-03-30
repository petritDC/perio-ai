import { describe, it, expect } from 'vitest'
import { patientIntakeSchema } from '@/lib/schemas/patient-intake.schema'

const minimalValid = {
  personalInfo: {
    fullName: 'Test Patient',
    dateOfBirth: '1990-01-01',
    age: 35,
    patientEmail: 'test@example.com',
    insurance: '',
    bloodType: '',
    patientNationalId: '',
    medicalRecordNumber: '',
  },
  allergies: [],
  medicalHistory: [],
  riskFactors: { smokingStatus: 'non_smoker', cigarettesPerDay: 0, diabetesDiagnosed: false, hba1c: null },
  currentMedications: [],
  emergencyContacts: [],
  xRayAvailability: { hasXRayToUpload: false, status: 'pending' },
  doctorNotes: '',
  consents: { privacyPolicyAccepted: true, treatmentConsent: true },
}

describe('patientIntakeSchema', () => {
  it('accepts valid minimal intake', () => {
    const result = patientIntakeSchema.safeParse(minimalValid)
    expect(result.success).toBe(true)
  })

  it('rejects missing fullName', () => {
    const result = patientIntakeSchema.safeParse({
      ...minimalValid,
      personalInfo: { ...minimalValid.personalInfo, fullName: '' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects consents not accepted', () => {
    const result = patientIntakeSchema.safeParse({
      ...minimalValid,
      consents: { privacyPolicyAccepted: false, treatmentConsent: false },
    })
    expect(result.success).toBe(false)
  })
})
