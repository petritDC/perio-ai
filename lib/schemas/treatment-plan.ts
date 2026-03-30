import { z } from 'zod'

export const createPlanSchema = z.object({
  patientId: z.string().uuid('Patient required'),
  providerId: z.string().uuid('Provider required'),
  title: z.string().min(2, 'Title required'),
  description: z.string().optional(),
})

export const updatePlanSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
})

export const createItemSchema = z.object({
  planId: z.string().uuid('Plan required'),
  description: z.string().min(2, 'Description required'),
  toothNumber: z.number().int().min(11).max(48).optional(),
  procedureCode: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  estimatedCost: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const updateItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(2).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  estimatedCost: z.number().min(0).optional(),
  notes: z.string().optional(),
})
