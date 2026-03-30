import { create } from 'zustand'
import type { UserSession } from '@/lib/types/auth'

interface SessionStore {
  session: UserSession | null
  setSession: (session: UserSession | null) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
}))
