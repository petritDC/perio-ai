import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StaffMember } from '@/lib/types/staff'

export interface RosterStats {
  total: number
  byRole: Record<string, number>
  byStatus: Record<string, number>
}

export interface PendingInvite {
  id: string
  email: string
  createdAt: string
  role: string | null
}

export async function getStaffRosterStats(): Promise<RosterStats> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('role, status')
    .neq('role', 'patient')

  if (error || !data) return { total: 0, byRole: {}, byStatus: {} }

  const byRole: Record<string, number> = {}
  const byStatus: Record<string, number> = {}

  for (const row of data) {
    byRole[row.role] = (byRole[row.role] ?? 0) + 1
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
  }

  return { total: data.length, byRole, byStatus }
}

export async function getPendingInvites(): Promise<PendingInvite[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers()

  if (error || !data) return []

  // Pending invites: users with email_confirmed_at = null
  return data.users
    .filter((u) => !u.email_confirmed_at && u.email)
    .map((u) => ({
      id: u.id,
      email: u.email!,
      createdAt: u.created_at,
      role: (u.user_metadata?.role as string) ?? null,
    }))
}
