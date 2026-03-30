'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession, requireRole } from '@/lib/auth/session'
import { generateDiagnosisSchema } from '@/lib/schemas/diagnosis'
import { getChart } from '@/lib/queries/charting.queries'
import { generateAIDiagnosis } from '@/lib/services/diagnostics.service'
import { createNotification } from '@/lib/actions/notification.actions'

export async function generateDiagnosis(chartId: string, patientId: string) {
  await requireRole(['admin', 'dentist', 'hygienist', 'receptionist'])
  const session = await getSession()

  const parsed = generateDiagnosisSchema.safeParse({ chartId, patientId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Load chart with teeth
  const chart = await getChart(parsed.data.chartId)
  if (!chart) return { error: 'Chart not found' }
  if (chart.teeth.length === 0) return { error: 'No tooth data in this chart' }

  // Call AI service
  let result
  try {
    result = await generateAIDiagnosis(chart)
  } catch (err) {
    return { error: `AI service error: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }

  // Store immutable record
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .insert({
      chart_id: parsed.data.chartId,
      patient_id: parsed.data.patientId,
      generated_by: session?.id ?? null,
      stage: result.stage,
      grade: result.grade,
      extent: result.extent,
      findings: result.findings,
      raw_response: result.rawResponse,
      model_used: result.modelUsed,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (session?.id) {
    await createNotification({
      userId: session.id,
      type: 'diagnosis',
      title: `AI Diagnosis ready${result.stage ? ': ' + result.stage : ''}`,
      body: result.grade ? `Grade ${result.grade}${result.extent ? ' · ' + result.extent : ''}` : undefined,
      entityId: data.id,
      entityType: 'ai_diagnosis',
    })
  }

  revalidatePath(`/charting/${parsed.data.chartId}`)
  revalidatePath(`/patients/${parsed.data.patientId}`)
  return { success: true, id: data.id, diagnosis: result }
}
