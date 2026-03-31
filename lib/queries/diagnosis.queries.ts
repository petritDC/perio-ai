import { createClient } from '@/lib/supabase/server'
import type { AIDiagnosis, DiagnosisFindings } from '@/lib/types/diagnosis'

// Columns needed for list views — excludes raw_response (full AI text) and findings (jsonb blob)
const LIST_COLUMNS = 'id, chart_id, patient_id, generated_by, stage, grade, extent, model_used, created_at'

function mapListRow(row: any): Omit<AIDiagnosis, 'rawResponse' | 'findings'> {
  return {
    id: row.id,
    chartId: row.chart_id,
    patientId: row.patient_id,
    generatedBy: row.generated_by,
    stage: row.stage,
    grade: row.grade,
    extent: row.extent,
    modelUsed: row.model_used,
    createdAt: row.created_at,
  }
}

function mapFullRow(row: any): AIDiagnosis {
  return {
    ...mapListRow(row),
    findings: row.findings as DiagnosisFindings,
    rawResponse: row.raw_response,
  }
}

export async function getChartDiagnoses(chartId: string): Promise<Omit<AIDiagnosis, 'rawResponse' | 'findings'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select(LIST_COLUMNS)
    .eq('chart_id', chartId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapListRow)
}

export async function getPatientDiagnoses(patientId: string): Promise<Omit<AIDiagnosis, 'rawResponse' | 'findings'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select(LIST_COLUMNS)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapListRow)
}

export async function getRecentDiagnoses(limit = 20): Promise<Omit<AIDiagnosis, 'rawResponse' | 'findings'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(mapListRow)
}

// Full-detail list fetch — use when rendering all diagnoses for a patient (profile page)
export async function getPatientDiagnosesFull(patientId: string): Promise<AIDiagnosis[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapFullRow)
}

// Full detail fetch — use this when rendering a single diagnosis detail view
export async function getDiagnosis(id: string): Promise<AIDiagnosis | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return mapFullRow(data)
}
