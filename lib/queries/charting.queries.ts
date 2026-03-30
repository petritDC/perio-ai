import { createAdminClient } from '@/lib/supabase/admin'
import type { ChartListItem, ChartWithTeeth, ToothData } from '@/lib/types/charting'

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

export async function getChart(chartId: string): Promise<ChartWithTeeth | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('periodontal_charts')
    .select('*')
    .eq('id', chartId)
    .single()

  if (error || !data) return null

  const { data: teeth, error: teethError } = await supabase
    .from('chart_teeth')
    .select('*')
    .eq('chart_id', chartId)
    .order('tooth_number')

  if (teethError) return null

  const mappedTeeth: ToothData[] = (teeth ?? []).map((t: any) => ({
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
    id: data.id,
    patientId: data.patient_id,
    providerId: data.provider_id,
    chartDate: data.chart_date,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    teeth: mappedTeeth,
  }
}
