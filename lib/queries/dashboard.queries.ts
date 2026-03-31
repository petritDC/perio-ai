import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  totalPatients: number
  activePatients: number
  todayAppointments: number
  upcomingAppointments: number
  draftCharts: number
  finalizedCharts: number
  totalDiagnoses: number
  activeStaff: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_stats')

  if (error || !data) {
    return {
      totalPatients: 0,
      activePatients: 0,
      todayAppointments: 0,
      upcomingAppointments: 0,
      draftCharts: 0,
      finalizedCharts: 0,
      totalDiagnoses: 0,
      activeStaff: 0,
    }
  }

  return {
    totalPatients: data.total_patients ?? 0,
    activePatients: data.active_patients ?? 0,
    todayAppointments: data.today_appointments ?? 0,
    upcomingAppointments: data.upcoming_appointments ?? 0,
    draftCharts: data.draft_charts ?? 0,
    finalizedCharts: data.finalized_charts ?? 0,
    totalDiagnoses: data.total_diagnoses ?? 0,
    activeStaff: data.active_staff ?? 0,
  }
}

export interface RecentActivity {
  type: 'appointment' | 'chart' | 'diagnosis'
  label: string
  time: string
}

export async function getRecentActivity(limit = 8): Promise<RecentActivity[]> {
  const supabase = await createClient()

  const [apptsRes, chartsRes, diagRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('periodontal_charts')
      .select('id, chart_date, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('ai_diagnoses')
      .select('id, stage, grade, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  const activities: RecentActivity[] = []

  for (const a of apptsRes.data ?? []) {
    activities.push({ type: 'appointment', label: a.title, time: a.created_at })
  }
  for (const c of chartsRes.data ?? []) {
    activities.push({ type: 'chart', label: `Chart ${c.chart_date} (${c.status})`, time: c.created_at })
  }
  for (const d of diagRes.data ?? []) {
    activities.push({ type: 'diagnosis', label: `${d.stage ?? 'Diagnosis'} — ${d.grade ?? ''}`, time: d.created_at })
  }

  return activities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit)
}
