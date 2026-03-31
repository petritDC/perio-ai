import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/queries/dashboard.queries'

describe('getDashboardStats', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls get_dashboard_stats RPC and maps result to camelCase', async () => {
    const rpcData = {
      total_patients: 42,
      active_patients: 38,
      today_appointments: 5,
      upcoming_appointments: 12,
      draft_charts: 3,
      finalized_charts: 10,
      total_diagnoses: 7,
      active_staff: 6,
    }
    const mockRpc = vi.fn().mockResolvedValue({ data: rpcData, error: null })
    vi.mocked(createClient).mockResolvedValue({ rpc: mockRpc } as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    const result = await getDashboardStats()

    expect(mockRpc).toHaveBeenCalledWith('get_dashboard_stats')
    expect(result.totalPatients).toBe(42)
    expect(result.activePatients).toBe(38)
    expect(result.todayAppointments).toBe(5)
    expect(result.upcomingAppointments).toBe(12)
    expect(result.draftCharts).toBe(3)
    expect(result.finalizedCharts).toBe(10)
    expect(result.totalDiagnoses).toBe(7)
    expect(result.activeStaff).toBe(6)
  })

  it('returns all zeros when RPC errors', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'rpc error' } })
    vi.mocked(createClient).mockResolvedValue({ rpc: mockRpc } as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    const result = await getDashboardStats()

    expect(result.totalPatients).toBe(0)
    expect(result.activePatients).toBe(0)
    expect(result.todayAppointments).toBe(0)
    expect(result.upcomingAppointments).toBe(0)
    expect(result.draftCharts).toBe(0)
    expect(result.finalizedCharts).toBe(0)
    expect(result.totalDiagnoses).toBe(0)
    expect(result.activeStaff).toBe(0)
  })
})
