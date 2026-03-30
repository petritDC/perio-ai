import { z } from 'zod'

export const createPatientSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  date_of_birth: z.string().nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  insurance_provider: z.string().nullable().optional(),
  blood_type: z.string().nullable().optional(),
  national_id: z.string().nullable().optional(),
  medical_record_no: z.string().nullable().optional(),
  notes: z.string().optional().default(''),
})

export const updatePatientSchema = createPatientSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'archived']).optional(),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
