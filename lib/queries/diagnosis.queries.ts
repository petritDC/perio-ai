import { createClient } from '@/lib/supabase/server'
import type { AIDiagnosis, DiagnosisFindings } from '@/lib/types/diagnosis'

function mapRow(row: any): AIDiagnosis {
  return {
    id: row.id,
    chartId: row.chart_id,
    patientId: row.patient_id,
    generatedBy: row.generated_by,
    stage: row.stage,
    grade: row.grade,
    extent: row.extent,
    findings: row.findings as DiagnosisFindings,
    rawResponse: row.raw_response,
    modelUsed: row.model_used,
    createdAt: row.created_at,
  }
}

export async function getChartDiagnoses(chartId: string): Promise<AIDiagnosis[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select('*')
    .eq('chart_id', chartId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRow)
}

export async function getPatientDiagnoses(patientId: string): Promise<AIDiagnosis[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRow)
}

export async function getRecentDiagnoses(limit = 20): Promise<AIDiagnosis[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data.map(mapRow)
}
