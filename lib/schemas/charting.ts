import { z } from 'zod'

export const createChartSchema = z.object({
  patientId: z.string().uuid('Patient required'),
  providerId: z.string().uuid('Provider required'),
  chartDate: z.string().min(1, 'Date required'),
  notes: z.string().optional(),
})

const depthField = z.number().int().min(0).max(20).nullable()
const boolField = z.boolean()

export const upsertToothSchema = z.object({
  chartId: z.string().uuid(),
  toothNumber: z.number().int().min(11).max(48),
  pdDb: depthField.optional().default(null),
  pdB: depthField.optional().default(null),
  pdMb: depthField.optional().default(null),
  pdDl: depthField.optional().default(null),
  pdL: depthField.optional().default(null),
  pdMl: depthField.optional().default(null),
  recDb: depthField.optional().default(null),
  recB: depthField.optional().default(null),
  recMb: depthField.optional().default(null),
  recDl: depthField.optional().default(null),
  recL: depthField.optional().default(null),
  recMl: depthField.optional().default(null),
  bopDb: boolField.optional().default(false),
  bopB: boolField.optional().default(false),
  bopMb: boolField.optional().default(false),
  bopDl: boolField.optional().default(false),
  bopL: boolField.optional().default(false),
  bopMl: boolField.optional().default(false),
  furcation: z.number().int().min(0).max(3).optional().default(0),
  mobility: z.number().int().min(0).max(3).optional().default(0),
  implant: boolField.optional().default(false),
  missing: boolField.optional().default(false),
  notes: z.string().nullable().optional().default(null),
})
