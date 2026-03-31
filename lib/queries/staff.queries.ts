import { createClient } from '@/lib/supabase/server'
import type { StaffMember, StaffAvailability, ClinicProfile } from '@/lib/types/staff'

export async function getClinicProfile(): Promise<ClinicProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinic_profile')
    .select('*')
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    phone: data.phone,
    email: data.email,
    website: data.website,
    logoPath: data.logo_path,
    timezone: data.timezone,
    workingHoursStart: data.working_hours_start,
    workingHoursEnd: data.working_hours_end,
    slotDurationMinutes: data.slot_duration_minutes,
  }
}

export const STAFF_LIST_PAGE_SIZE = 10

export async function getStaffMembers(): Promise<StaffMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, status, created_at')
    .neq('role', 'patient')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // Get emails from auth.users — profiles don't store email directly
  // We join via admin client in actions; here we return what we have
  return data.map((row) => ({
    id: row.id,
    email: '',  // filled by caller if needed
    fullName: row.full_name,
    role: row.role as StaffMember['role'],
    status: row.status as StaffMember['status'],
    createdAt: row.created_at,
  }))
}

export async function getStaffMembersPaginated(options: {
  search?: string
  page: number
  limit?: number
}): Promise<{ data: StaffMember[]; count: number }> {
  const supabase = await createClient()
  const limit = options.limit ?? STAFF_LIST_PAGE_SIZE
  const page = Math.max(1, Number.isFinite(options.page) ? options.page : 1)
  const from = (page - 1) * limit
  const to = from + limit - 1
  const search = options.search?.trim()

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, status, created_at', { count: 'exact' })
    .neq('role', 'patient')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('full_name', `%${search}%`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error || !data) return { data: [], count: 0 }

  return {
    data: data.map((row) => ({
      id: row.id,
      email: '',
      fullName: row.full_name,
      role: row.role as StaffMember['role'],
      status: row.status as StaffMember['status'],
      createdAt: row.created_at,
    })),
    count: count ?? 0,
  }
}

export async function getStaffMember(userId: string): Promise<StaffMember | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, status, created_at')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    email: '',
    fullName: data.full_name,
    role: data.role as StaffMember['role'],
    status: data.status as StaffMember['status'],
    createdAt: data.created_at,
  }
}

export async function getStaffAvailability(userId: string): Promise<StaffAvailability[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_availability')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week')

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    isAvailable: row.is_available,
  }))
}
