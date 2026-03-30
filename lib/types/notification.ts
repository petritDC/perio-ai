export type NotificationType = 'appointment' | 'chart' | 'diagnosis' | 'treatment_plan'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string | null
  entityId: string | null
  entityType: string | null
  isRead: boolean
  createdAt: string
}
