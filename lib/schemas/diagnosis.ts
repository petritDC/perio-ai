import { z } from 'zod'

export const generateDiagnosisSchema = z.object({
  chartId: z.string().uuid('Chart ID required'),
  patientId: z.string().uuid('Patient ID required'),
})

export const diagnosisFindingsSchema = z.object({
  maxBoneLossPct: z.number().nullable(),
  affectedTeethCount: z.number().int().min(0),
  meanMaxPD: z.number().min(0),
  bopPercent: z.number().min(0).max(100),
  riskFactors: z.array(z.string()),
  recommendations: z.array(z.string()),
  treatmentPriority: z.enum(['low', 'medium', 'high', 'urgent']),
})
