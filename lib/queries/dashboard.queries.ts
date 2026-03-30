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
  const today = new Date().toISOString().slice(0, 10)
  const todayStart = today + 'T00:00:00Z'
  const todayEnd = today + 'T23:59:59Z'
  const nowIso = new Date().toISOString()

  const [
    totalPatientsRes,
    activePatientsRes,
    todayApptsRes,
    upcomingApptsRes,
    draftChartsRes,
    finalizedChartsRes,
    diagnosesRes,
    activeStaffRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient').eq('status', 'active'),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('start_time', todayStart).lte('start_time', todayEnd),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('start_time', nowIso).in('status', ['scheduled', 'confirmed']),
    supabase.from('periodontal_charts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('periodontal_charts').select('id', { count: 'exact', head: true }).eq('status', 'finalized'),
    supabase.from('ai_diagnoses').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'patient').eq('status', 'active'),
  ])

  return {
    totalPatients: totalPatientsRes.count ?? 0,
    activePatients: activePatientsRes.count ?? 0,
    todayAppointments: todayApptsRes.count ?? 0,
    upcomingAppointments: upcomingApptsRes.count ?? 0,
    draftCharts: draftChartsRes.count ?? 0,
    finalizedCharts: finalizedChartsRes.count ?? 0,
    totalDiagnoses: diagnosesRes.count ?? 0,
    activeStaff: activeStaffRes.count ?? 0,
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
