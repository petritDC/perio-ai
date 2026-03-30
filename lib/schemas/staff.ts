import { z } from 'zod'

export const inviteStaffSchema = z.object({
  email: z.string().email('Valid email required'),
  fullName: z.string().min(2, 'Full name required'),
  role: z.enum(['admin', 'dentist', 'hygienist', 'receptionist']),
})

export const updateStaffSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['admin', 'dentist', 'hygienist', 'receptionist']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  fullName: z.string().min(2).optional(),
})

export const availabilityRowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format required'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format required'),
  isAvailable: z.boolean(),
})

export const upsertAvailabilitySchema = z.object({
  userId: z.string().uuid(),
  rows: z.array(availabilityRowSchema),
})

export const updateClinicSchema = z.object({
  name: z.string().min(2, 'Clinic name required').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  timezone: z.string().optional(),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  slotDurationMinutes: z.number().int().min(10).max(120).optional(),
})
