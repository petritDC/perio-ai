import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/shell/Sidebar'
import TopBar from '@/components/shell/TopBar'
import SessionProvider from '@/components/shell/SessionProvider'
import { getMyNotifications, getUnreadCount } from '@/lib/queries/notification.queries'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const [notifications, unreadCount] = await Promise.all([
    getMyNotifications(),
    getUnreadCount(),
  ])

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <SessionProvider session={session} />
      <Sidebar />
      <div className="ml-[220px]">
        <TopBar initialUnreadCount={unreadCount} initialNotifications={notifications} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
