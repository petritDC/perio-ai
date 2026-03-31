'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession, requireRole } from '@/lib/auth/session'
import { createChartSchema, upsertToothSchema } from '@/lib/schemas/charting'
import type { ToothData } from '@/lib/types/charting'
import { createNotification } from '@/lib/actions/notification.actions'

export async function createChart(formData: FormData) {
  await requireRole(['admin', 'dentist', 'hygienist'])
  const session = await getSession()

  const raw = {
    patientId: formData.get('patientId'),
    providerId: formData.get('providerId') || session?.id,
    chartDate: formData.get('chartDate') || new Date().toISOString().slice(0, 10),
    notes: formData.get('notes') || undefined,
  }

  const parsed = createChartSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('periodontal_charts')
    .insert({
      patient_id: parsed.data.patientId,
      provider_id: parsed.data.providerId,
      chart_date: parsed.data.chartDate,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/patients/${parsed.data.patientId}`)
  return { success: true, id: data.id }
}

export async function upsertTooth(toothData: ToothData) {
  await requireRole(['admin', 'dentist', 'hygienist'])

  const parsed = upsertToothSchema.safeParse(toothData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = createAdminClient()

  const row = {
    chart_id: parsed.data.chartId,
    tooth_number: parsed.data.toothNumber,
    pd_db: parsed.data.pdDb, pd_b: parsed.data.pdB, pd_mb: parsed.data.pdMb,
    pd_dl: parsed.data.pdDl, pd_l: parsed.data.pdL, pd_ml: parsed.data.pdMl,
    rec_db: parsed.data.recDb, rec_b: parsed.data.recB, rec_mb: parsed.data.recMb,
    rec_dl: parsed.data.recDl, rec_l: parsed.data.recL, rec_ml: parsed.data.recMl,
    bop_db: parsed.data.bopDb, bop_b: parsed.data.bopB, bop_mb: parsed.data.bopMb,
    bop_dl: parsed.data.bopDl, bop_l: parsed.data.bopL, bop_ml: parsed.data.bopMl,
    furcation: parsed.data.furcation,
    mobility: parsed.data.mobility,
    implant: parsed.data.implant,
    missing: parsed.data.missing,
    notes: parsed.data.notes ?? null,
  }

  const { error } = await supabase
    .from('chart_teeth')
    .upsert(row, { onConflict: 'chart_id,tooth_number' })

  if (error) return { error: error.message }

  revalidatePath(`/charting/${parsed.data.chartId}`)
  return { success: true }
}

export async function finalizeChart(chartId: string) {
  await requireRole(['admin', 'dentist', 'hygienist'])

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('periodontal_charts')
    .update({ status: 'finalized' })
    .eq('id', chartId)
    .eq('status', 'draft')  // safety: only draft→finalized

  if (error) return { error: error.message }

  revalidatePath(`/charting/${chartId}`)
  const session = await getSession()
  if (session?.id) {
    await createNotification({
      userId: session.id,
      type: 'chart',
      title: 'Chart finalized',
      entityId: chartId,
      entityType: 'chart',
    })
  }
  return { success: true }
}
