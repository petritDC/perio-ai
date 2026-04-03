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

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Normalize PostgREST / JSON return shapes (object, JSON string, or single-row array). */
function normalizeDashboardStatsPayload(data: unknown): Record<string, unknown> | null {
  if (data == null) return null
  if (typeof data === 'string') {
    try {
      return normalizeDashboardStatsPayload(JSON.parse(data) as unknown)
    } catch {
      return null
    }
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return null
    return normalizeDashboardStatsPayload(data[0])
  }
  if (typeof data === 'object') return data as Record<string, unknown>
  return null
}

function mapRowToStats(row: Record<string, unknown>): DashboardStats {
  return {
    totalPatients: num(row.total_patients),
    activePatients: num(row.active_patients),
    todayAppointments: num(row.today_appointments),
    upcomingAppointments: num(row.upcoming_appointments),
    draftCharts: num(row.draft_charts),
    finalizedCharts: num(row.finalized_charts),
    totalDiagnoses: num(row.total_diagnoses),
    activeStaff: num(row.active_staff),
  }
}

/** PostgREST: function not in schema (migration not applied yet, or schema cache stale). */
function isDashboardStatsRpcMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error?.message) return false
  if (error.code === 'PGRST202') return true
  const msg = error.message
  return msg.includes('Could not find the function') && msg.includes('get_dashboard_stats')
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

/**
 * Parallel COUNTs with RLS (used when RPC is missing or errors in dev / old deployments).
 * "Today" uses the Node process local calendar day to approximate CURRENT_DATE on the DB.
 */
async function getDashboardStatsFromTables(supabase: SupabaseServer): Promise<DashboardStats> {
  const nowIso = new Date().toISOString()
  const startLocal = new Date()
  startLocal.setHours(0, 0, 0, 0)
  const endLocal = new Date(startLocal)
  endLocal.setDate(endLocal.getDate() + 1)
  const startIso = startLocal.toISOString()
  const endIso = endLocal.toISOString()

  const [
    totalPatientsRes,
    activePatientsRes,
    todayApptsRes,
    upcomingApptsRes,
    draftsRes,
    finalizedRes,
    diagnosesRes,
    staffRes,
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', startIso)
      .lt('start_time', endIso),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gt('start_time', nowIso)
      .in('status', ['scheduled', 'confirmed']),
    supabase.from('periodontal_charts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('periodontal_charts').select('*', { count: 'exact', head: true }).eq('status', 'finalized'),
    supabase.from('ai_diagnoses').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'patient')
      .eq('status', 'active'),
  ])

  const errs = [
    totalPatientsRes.error,
    activePatientsRes.error,
    todayApptsRes.error,
    upcomingApptsRes.error,
    draftsRes.error,
    finalizedRes.error,
    diagnosesRes.error,
    staffRes.error,
  ].filter(Boolean)
  if (errs.length > 0) {
    console.error('[getDashboardStats] table count errors:', errs.map((e) => e?.message).join('; '))
  }

  return {
    totalPatients: totalPatientsRes.count ?? 0,
    activePatients: activePatientsRes.count ?? 0,
    todayAppointments: todayApptsRes.count ?? 0,
    upcomingAppointments: upcomingApptsRes.count ?? 0,
    draftCharts: draftsRes.count ?? 0,
    finalizedCharts: finalizedRes.count ?? 0,
    totalDiagnoses: diagnosesRes.count ?? 0,
    activeStaff: staffRes.count ?? 0,
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  const row = normalizeDashboardStatsPayload(data)

  if (!error && row) {
    return mapRowToStats(row)
  }

  if (error && !isDashboardStatsRpcMissing(error)) {
    console.error('[getDashboardStats] get_dashboard_stats RPC failed, using table counts:', error.message)
  }

  return getDashboardStatsFromTables(supabase)
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
