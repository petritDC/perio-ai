export type PlanStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type ItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface TreatmentPlanItem {
  id: string
  planId: string
  toothNumber: number | null
  procedureCode: string | null
  description: string
  status: ItemStatus
  priority: number
  estimatedCost: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TreatmentPlan {
  id: string
  patientId: string
  providerId: string
  title: string
  description: string | null
  status: PlanStatus
  createdAt: string
  updatedAt: string
}

export interface TreatmentPlanWithItems extends TreatmentPlan {
  items: TreatmentPlanItem[]
}
