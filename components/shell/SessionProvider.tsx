'use client'

import { useEffect } from 'react'
import { useSessionStore } from '@/lib/stores/session.store'
import type { UserSession } from '@/lib/types/auth'

export default function SessionProvider({ session }: { session: UserSession | null }) {
  const setSession = useSessionStore((s) => s.setSession)

  useEffect(() => {
    setSession(session)
  }, [session, setSession])

  return null
}
