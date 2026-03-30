'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { markAsRead, markAllRead } from '@/lib/actions/notification.actions'
import type { Notification } from '@/lib/types/notification'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface Props {
  initialUnreadCount: number
  initialNotifications: Notification[]
}

export default function NotificationBell({ initialUnreadCount, initialNotifications }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUnreadCount(initialUnreadCount)
    setNotifications(initialNotifications)
  }, [initialUnreadCount, initialNotifications])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleMarkAsRead(id: string) {
    await markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    router.refresh()
  }

  async function handleMarkAllRead() {
    await markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    router.refresh()
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-[#E4E7EE] rounded-xl shadow-[var(--shadow-card)] w-80 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-[13px] text-[#717182] italic">
              No notifications
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => { if (!n.isRead) handleMarkAsRead(n.id) }}
                  className={`px-4 py-3 cursor-pointer border-b border-[#E4E7EE] last:border-b-0 transition-colors hover:brightness-95 ${
                    n.isRead ? 'bg-white' : 'bg-teal-50'
                  }`}
                >
                  <p className="text-[13px] font-semibold text-[#030213] leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="text-[12px] text-[#717182] mt-0.5 leading-snug">{n.body}</p>
                  )}
                  <p className="text-[11px] text-[#717182] mt-1">{timeAgo(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}

          {unreadCount > 0 && (
            <div className="px-4 py-3 border-t border-[#E4E7EE]">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="w-full text-center text-[12px] font-medium text-[#0D9488] hover:text-teal-700 transition-colors"
              >
                Mark all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
