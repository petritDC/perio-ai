import { createClient } from '@/lib/supabase/server'
import type { UserSession, UserRole } from '@/lib/types/auth'

export async function getSession(): Promise<UserSession | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let role = (user.user_metadata?.role ?? '') as UserRole
  let fullName = user.user_metadata?.full_name ?? null

  // Fall back to profiles table if metadata role is missing
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    role = (profile?.role ?? 'patient') as UserRole
    if (!fullName) fullName = profile?.full_name ?? null
  }

  return { id: user.id, email: user.email!, role, fullName }
}

export async function requireSession(): Promise<UserSession> {
  const session = await getSession()
  if (!session) throw new Error('Unauthenticated')
  return session
}

export async function requireRole(allowed: UserRole[]): Promise<UserSession> {
  const session = await requireSession()
  if (!allowed.includes(session.role)) throw new Error('Forbidden')
  return session
}
