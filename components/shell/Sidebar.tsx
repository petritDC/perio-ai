'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSessionStore } from '@/lib/stores/session.store'
import {
  LayoutDashboard, Users, Calendar, Image, FileText,
  Stethoscope, FileCheck, Building2, UserCog, CreditCard, Settings, LogOut,
} from 'lucide-react'

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  sectionLabel?: string
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users, sectionLabel: 'Clinical' },
  { name: 'Appointments', href: '/schedule', icon: Calendar },
  // { name: 'Charting', href: '/charting', icon: Stethoscope },
  // { name: 'Radiology', href: '/radiology', icon: Image },
  // { name: 'Diagnostics', href: '/diagnostics', icon: FileCheck },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Staff', href: '/staff', icon: UserCog, sectionLabel: 'Admin' },
  { name: 'Clinic', href: '/clinic', icon: Building2 },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const session = useSessionStore((s) => s.session)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = session?.fullName || session?.email || 'User'
  const initials = session?.fullName
    ? session.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (session?.email?.[0] ?? 'U').toUpperCase()

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] border-r flex flex-col z-30"
      style={{
        background: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
        boxShadow: '2px 0 8px rgba(0,0,0,0.03)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>PerioAI</div>
          <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">PMS</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <div key={item.name}>
              {item.sectionLabel && (
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-5 pb-2" style={{ fontFamily: 'var(--font-sora)' }}>
                  {item.sectionLabel}
                </div>
              )}
              <Link
                href={item.href}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${isActive
                    ? 'bg-white text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  }`}
                style={isActive ? { boxShadow: 'var(--shadow-card)', fontFamily: 'var(--font-sora)' } : { fontFamily: 'var(--font-sora)' }}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-teal-500 rounded-r-full" />
                )}
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User avatar */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }} ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/60 transition-all text-left"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 truncate" style={{ fontFamily: 'var(--font-sora)' }}>
              {displayName}
            </p>
            {session?.email && session.fullName && (
              <p className="text-[10px] text-slate-400 truncate">{session.email}</p>
            )}
          </div>
        </button>

        {open && (
          <div className="absolute bottom-[60px] left-3 right-3 bg-white rounded-xl shadow-lg border border-[#E4E7EE] py-1 z-50">
            <div className="px-3 py-2 border-b border-[#E4E7EE]">
              <p className="text-[12px] font-semibold text-slate-800 truncate" style={{ fontFamily: 'var(--font-sora)' }}>{displayName}</p>
              {session?.email && <p className="text-[11px] text-slate-400 truncate">{session.email}</p>}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
