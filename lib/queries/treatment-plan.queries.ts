import { createClient } from '@/lib/supabase/server'
import type { TreatmentPlanWithItems, TreatmentPlanItem } from '@/lib/types/treatment-plan'

export async function getPatientTreatmentPlans(patientId: string): Promise<TreatmentPlanWithItems[]> {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error || !plans) return []

  const planIds = plans.map((p) => p.id)
  if (planIds.length === 0) return []

  const { data: items, error: itemsError } = await supabase
    .from('treatment_plan_items')
    .select('*')
    .in('plan_id', planIds)
    .order('priority')

  const itemsByPlan = new Map<string, TreatmentPlanItem[]>()
  for (const item of items ?? []) {
    const list = itemsByPlan.get(item.plan_id) ?? []
    list.push({
      id: item.id,
      planId: item.plan_id,
      toothNumber: item.tooth_number,
      procedureCode: item.procedure_code,
      description: item.description,
      status: item.status,
      priority: item.priority,
      estimatedCost: item.estimated_cost,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })
    itemsByPlan.set(item.plan_id, list)
  }

  return plans.map((p) => ({
    id: p.id,
    patientId: p.patient_id,
    providerId: p.provider_id,
    title: p.title,
    description: p.description,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    items: itemsByPlan.get(p.id) ?? [],
  }))
}
