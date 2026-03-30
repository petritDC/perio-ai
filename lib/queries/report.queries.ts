import { createClient } from '@/lib/supabase/server'
import type { ChartReport } from '@/lib/types/report'

function mapRow(row: any): ChartReport {
  return {
    id: row.id,
    chartId: row.chart_id,
    patientId: row.patient_id,
    generatedBy: row.generated_by,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    createdAt: row.created_at,
  }
}

export async function getChartReports(chartId: string): Promise<ChartReport[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chart_reports')
    .select('*')
    .eq('chart_id', chartId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRow)
}

export async function getRecentReports(limit = 30): Promise<ChartReport[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chart_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data.map(mapRow)
}
