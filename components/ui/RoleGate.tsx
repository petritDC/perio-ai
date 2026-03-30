'use client'

import { useSessionStore } from '@/lib/stores/session.store'
import type { UserRole } from '@/lib/types/auth'

export default function RoleGate({ allowed, children }: { allowed: UserRole[]; children: React.ReactNode }) {
  const session = useSessionStore((s) => s.session)
  if (!session || !allowed.includes(session.role)) return null
  return <>{children}</>
}
