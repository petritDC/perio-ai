'use client'

import { useSessionStore } from '@/lib/stores/session.store'
import NotificationBell from '@/components/shell/NotificationBell'
import type { Notification } from '@/lib/types/notification'

interface TopBarProps {
  initialUnreadCount: number
  initialNotifications: Notification[]
}

export default function TopBar({ initialUnreadCount, initialNotifications }: TopBarProps) {
  const session = useSessionStore((s) => s.session)

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-6"
      style={{ borderColor: 'var(--sidebar-border)', background: '#fff' }}
    >
      <div className="text-[14px] text-slate-600">
        {session?.fullName && (
          <span style={{ fontFamily: 'var(--font-sora)' }}>
            Welcome, <span className="font-semibold text-slate-900">{session.fullName}</span>
          </span>
        )}
      </div>
      <div className="relative flex items-center gap-2">
        <NotificationBell initialUnreadCount={initialUnreadCount} initialNotifications={initialNotifications} />
      </div>
    </header>
  )
}
