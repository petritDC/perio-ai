'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import type { NotificationType } from '@/lib/types/notification'

export async function createNotification(data: {
  userId: string
  type: NotificationType
  title: string
  body?: string
  entityId?: string
  entityType?: string
}): Promise<void> {
  const supabase = await createClient()

  await supabase.from('notifications').insert({
    user_id: data.userId,
    type: data.type,
    title: data.title,
    body: data.body ?? null,
    entity_id: data.entityId ?? null,
    entity_type: data.entityType ?? null,
  })
}

export async function markAsRead(notificationId: string): Promise<void> {
  const session = await getSession()
  if (!session) return

  const supabase = await createClient()

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', session.id)

  revalidatePath('/dashboard')
}

export async function markAllRead(): Promise<void> {
  const session = await getSession()
  if (!session) return

  const supabase = await createClient()

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', session.id)
    .eq('is_read', false)

  revalidatePath('/dashboard')
}
