import { z } from 'zod'

export const patientIntakeSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    age: z.number().nullable(),
    patientEmail: z.string().email('Invalid email'),
    insurance: z.string(),
    bloodType: z.string(),
    patientNationalId: z.string(),
    medicalRecordNumber: z.string(),
  }),
  allergies: z.array(z.string()),
  medicalHistory: z.array(z.object({
    condition: z.string().min(1),
    diagnosedAt: z.string().min(1),
    notes: z.string(),
  })),
  riskFactors: z.object({
    smokingStatus: z.enum(['non_smoker', 'former_smoker', 'current_smoker']),
    cigarettesPerDay: z.number().min(0),
    diabetesDiagnosed: z.boolean(),
    hba1c: z.number().nullable(),
  }),
  currentMedications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string(),
    frequency: z.string(),
    prescribedBy: z.string(),
  })),
  emergencyContacts: z.array(z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    relationship: z.string(),
  })),
  xRayAvailability: z.object({
    hasXRayToUpload: z.boolean(),
  }),
  doctorNotes: z.string(),
  consents: z.object({
    privacyPolicyAccepted: z.literal(true, { message: 'Privacy policy must be accepted' }),
    treatmentConsent: z.literal(true, { message: 'Treatment consent is required' }),
  }),
})

export type PatientIntakeInput = z.infer<typeof patientIntakeSchema>
