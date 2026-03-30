import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/actions/notification.actions'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayStart = new Date(tomorrow)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(tomorrow)
  dayEnd.setHours(23, 59, 59, 999)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, provider_id, title, patient_id')
    .gte('start_time', dayStart.toISOString())
    .lte('start_time', dayEnd.toISOString())
    .eq('status', 'scheduled')

  let notified = 0
  for (const appt of appointments ?? []) {
    if (appt.provider_id) {
      await createNotification({
        userId: appt.provider_id,
        type: 'appointment',
        title: 'Reminder: appointment tomorrow',
        body: appt.title ?? undefined,
        entityId: appt.id,
        entityType: 'appointment',
      })
      notified++
    }
  }

  return NextResponse.json({ notified })
}
