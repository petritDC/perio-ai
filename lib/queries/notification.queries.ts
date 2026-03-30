import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import type { Notification } from '@/lib/types/notification'

function mapRow(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as Notification['type'],
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    entityId: (row.entity_id as string | null) ?? null,
    entityType: (row.entity_type as string | null) ?? null,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  }
}

export async function getMyNotifications(): Promise<Notification[]> {
  const session = await getSession()
  if (!session) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) return []

  return data.map(mapRow)
}

export async function getUnreadCount(): Promise<number> {
  const session = await getSession()
  if (!session) return 0

  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.id)
    .eq('is_read', false)

  if (error) return 0

  return count ?? 0
}
