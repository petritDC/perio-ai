import { z } from 'zod'

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Patient required'),
  providerId: z.string().uuid('Provider required'),
  title: z.string().min(2, 'Title required'),
  appointmentType: z.enum([
    'consultation',
    'cleaning',
    'periodontal_treatment',
    'follow_up',
    'emergency',
    'other',
  ]),
  startTime: z.string().min(1, 'Start time required'),
  endTime: z.string().min(1, 'End time required'),
  notes: z.string().optional(),
})

export const updateAppointmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).optional(),
  appointmentType: z
    .enum([
      'consultation',
      'cleaning',
      'periodontal_treatment',
      'follow_up',
      'emergency',
      'other',
    ])
    .optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z
    .enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
    .optional(),
  notes: z.string().optional(),
})
