'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession, requireRole } from '@/lib/auth/session'
import {
  createPlanSchema,
  updatePlanSchema,
  createItemSchema,
  updateItemSchema,
} from '@/lib/schemas/treatment-plan'
import { createNotification } from '@/lib/actions/notification.actions'

export async function createTreatmentPlan(formData: FormData) {
  await requireRole(['admin', 'dentist'])
  const session = await getSession()

  const raw = {
    patientId: formData.get('patientId'),
    providerId: formData.get('providerId') || session?.id,
    title: formData.get('title'),
    description: formData.get('description') || undefined,
  }

  const parsed = createPlanSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('treatment_plans')
    .insert({
      patient_id: parsed.data.patientId,
      provider_id: parsed.data.providerId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/patients/${parsed.data.patientId}`)
  if (session?.id) {
    await createNotification({
      userId: session.id,
      type: 'treatment_plan',
      title: `Treatment plan created: ${parsed.data.title}`,
      entityId: data.id,
      entityType: 'treatment_plan',
    })
  }
  return { success: true, id: data.id }
}

export async function updateTreatmentPlan(formData: FormData) {
  await requireRole(['admin', 'dentist'])

  const raw = {
    id: formData.get('id'),
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    status: formData.get('status') || undefined,
  }

  const parsed = updatePlanSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const update: Record<string, unknown> = {}
  if (parsed.data.title) update.title = parsed.data.title
  if (parsed.data.description !== undefined) update.description = parsed.data.description
  if (parsed.data.status) update.status = parsed.data.status

  const supabase = await createClient()
  const { error } = await supabase
    .from('treatment_plans')
    .update(update)
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidatePath('/patients')
  return { success: true }
}

export async function addPlanItem(data: {
  planId: string
  description: string
  toothNumber?: number
  procedureCode?: string
  priority?: number
  estimatedCost?: number
  notes?: string
}) {
  await requireRole(['admin', 'dentist'])

  const parsed = createItemSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('treatment_plan_items').insert({
    plan_id: parsed.data.planId,
    description: parsed.data.description,
    tooth_number: parsed.data.toothNumber ?? null,
    procedure_code: parsed.data.procedureCode ?? null,
    status: parsed.data.status ?? 'pending',
    priority: parsed.data.priority ?? 1,
    estimated_cost: parsed.data.estimatedCost ?? null,
    notes: parsed.data.notes ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/patients')
  return { success: true }
}

export async function updatePlanItem(id: string, updates: {
  status?: string
  description?: string
  priority?: number
  estimatedCost?: number
  notes?: string
}) {
  await requireRole(['admin', 'dentist'])

  const parsed = updateItemSchema.safeParse({ id, ...updates })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const update: Record<string, unknown> = {}
  if (parsed.data.status) update.status = parsed.data.status
  if (parsed.data.description) update.description = parsed.data.description
  if (parsed.data.priority) update.priority = parsed.data.priority
  if (parsed.data.estimatedCost !== undefined) update.estimated_cost = parsed.data.estimatedCost
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes

  const supabase = await createClient()
  const { error } = await supabase
    .from('treatment_plan_items')
    .update(update)
    .eq('id', parsed.data.id)

  if (error) return { error: error.message }

  revalidatePath('/patients')
  return { success: true }
}

export async function deletePlanItem(id: string) {
  await requireRole(['admin', 'dentist'])

  const supabase = await createClient()
  const { error } = await supabase
    .from('treatment_plan_items')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/patients')
  return { success: true }
}
