import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const isAdmin = session.role === 'admin'

  return (
    <div className="flex min-h-screen bg-[#F7F9FC]">
      <aside className="w-56 border-r border-[#E4E7EE] bg-[#FAFBFC] p-4 space-y-1">
        <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider px-2 mb-3">
          Settings
        </p>
        <Link
          href="/settings"
          className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[#030213] hover:bg-[#E9EBEF] transition-colors"
        >
          My Profile
        </Link>
        {isAdmin && (
          <>
            <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider px-2 pt-4 pb-1">
              Admin
            </p>
            <Link
              href="/settings/clinic"
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[#030213] hover:bg-[#E9EBEF] transition-colors"
            >
              Clinic Profile
            </Link>
            <Link
              href="/settings/staff"
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[#030213] hover:bg-[#E9EBEF] transition-colors"
            >
              Staff
            </Link>
          </>
        )}
      </aside>
      <main className="flex-1 p-8 max-w-4xl">{children}</main>
    </div>
  )
}
