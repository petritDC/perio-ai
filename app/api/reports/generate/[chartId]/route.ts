import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole, getSession } from '@/lib/auth/session'
import { getChart } from '@/lib/queries/charting.queries'
import { getChartDiagnoses } from '@/lib/queries/diagnosis.queries'
import { generateReportPDF, uploadReportToStorage } from '@/lib/services/report.service'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ chartId: string }> }
) {
  try {
    await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
    const session = await getSession()
    const { chartId } = await params

    const chart = await getChart(chartId)
    if (!chart) {
      return NextResponse.json({ error: 'Chart not found' }, { status: 404 })
    }

    // Get latest diagnosis (if any)
    const diagnoses = await getChartDiagnoses(chartId)
    const latestDiagnosis = diagnoses[0] ?? null

    // Get patient/provider names from profiles
    const supabase = await createClient()
    const [patientProfile, providerProfile] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', chart.patientId).single(),
      supabase.from('profiles').select('full_name').eq('id', chart.providerId).single(),
    ])
    const patientName = patientProfile.data?.full_name ?? 'Unknown Patient'
    const providerName = providerProfile.data?.full_name ?? 'Unknown Provider'

    // Generate PDF
    const buffer = await generateReportPDF(chart, patientName, providerName, latestDiagnosis)

    // Upload to storage
    const uploadResult = await uploadReportToStorage(supabase, buffer, chartId, chart.patientId)

    // Insert record
    const { data, error } = await supabase
      .from('chart_reports')
      .insert({
        chart_id: chartId,
        patient_id: chart.patientId,
        generated_by: session?.id ?? null,
        storage_path: uploadResult.storagePath,
        file_name: uploadResult.fileName,
        file_size_bytes: uploadResult.fileSizeBytes,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id, fileName: uploadResult.fileName })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
