import { createAdminClient } from '@/lib/supabase/admin'
import type { ChartListItem, ChartStatus, ChartWithTeeth, ToothData } from '@/lib/types/charting'

export async function getPatientCharts(patientId: string): Promise<ChartListItem[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('periodontal_charts')
    .select(`
      id, chart_date, status,
      provider:profiles!periodontal_charts_provider_id_fkey(full_name),
      tooth_count:chart_teeth(count)
    `)
    .eq('patient_id', patientId)
    .order('chart_date', { ascending: false })

  if (error || !data) return []

  return (data as any[]).map((row) => ({
    id: row.id,
    chartDate: row.chart_date,
    status: row.status,
    providerName: row.provider?.full_name ?? null,
    toothCount: row.tooth_count?.[0]?.count ?? 0,
  }))
}

interface ChartToothRow {
  id: string
  chart_id: string
  tooth_number: number
  pd_db: number | null; pd_b: number | null; pd_mb: number | null
  pd_dl: number | null; pd_l: number | null; pd_ml: number | null
  rec_db: number | null; rec_b: number | null; rec_mb: number | null
  rec_dl: number | null; rec_l: number | null; rec_ml: number | null
  bop_db: boolean; bop_b: boolean; bop_mb: boolean
  bop_dl: boolean; bop_l: boolean; bop_ml: boolean
  furcation: number
  mobility: number
  implant: boolean
  missing: boolean
  notes: string | null
}

interface ChartRow {
  id: string
  patient_id: string
  provider_id: string
  chart_date: string
  status: ChartStatus
  notes: string | null
  created_at: string
  updated_at: string
  chart_teeth: ChartToothRow[]
}

export async function getChart(chartId: string): Promise<ChartWithTeeth | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('periodontal_charts')
    .select('*, chart_teeth(*)')
    .eq('id', chartId)
    .single()

  if (error || !data) return null
  // Relation errors from chart_teeth (previously a separate query) now surface in the
  // parent `error` object and are caught by the guard above.

  const row = data as unknown as ChartRow

  const mappedTeeth: ToothData[] = (row.chart_teeth ?? [])
    .slice()
    .sort((a: ChartToothRow, b: ChartToothRow) => a.tooth_number - b.tooth_number)
    .map((t: ChartToothRow) => ({
      id: t.id,
      chartId: t.chart_id,
      toothNumber: t.tooth_number,
      pdDb: t.pd_db, pdB: t.pd_b, pdMb: t.pd_mb,
      pdDl: t.pd_dl, pdL: t.pd_l, pdMl: t.pd_ml,
      recDb: t.rec_db, recB: t.rec_b, recMb: t.rec_mb,
      recDl: t.rec_dl, recL: t.rec_l, recMl: t.rec_ml,
      bopDb: t.bop_db, bopB: t.bop_b, bopMb: t.bop_mb,
      bopDl: t.bop_dl, bopL: t.bop_l, bopMl: t.bop_ml,
      furcation: t.furcation,
      mobility: t.mobility,
      implant: t.implant,
      missing: t.missing,
      notes: t.notes,
    }))

  return {
    id: row.id,
    patientId: row.patient_id,
    providerId: row.provider_id,
    chartDate: row.chart_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    teeth: mappedTeeth,
  }
}
