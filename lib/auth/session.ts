import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { UserSession, UserRole } from '@/lib/types/auth'

// cache() memoizes per React request — getSession() calls createClient() and
// auth.getUser() exactly once per request, regardless of how many times it is called.
export const getSession = cache(async (): Promise<UserSession | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let role = (user.user_metadata?.role ?? '') as UserRole
  let fullName = user.user_metadata?.full_name ?? null

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
})

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
