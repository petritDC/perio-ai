import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/queries/dashboard.queries'

function createThenableBuilder(result: { count: number; error: null }) {
  const b: Record<string, unknown> = {}
  const self = b as {
    select: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    neq: ReturnType<typeof vi.fn>
    gt: ReturnType<typeof vi.fn>
    gte: ReturnType<typeof vi.fn>
    lt: ReturnType<typeof vi.fn>
    in: ReturnType<typeof vi.fn>
    then: (onFulfilled: (v: unknown) => unknown) => Promise<unknown>
  }
  self.select = vi.fn(() => self)
  self.eq = vi.fn(() => self)
  self.neq = vi.fn(() => self)
  self.gt = vi.fn(() => self)
  self.gte = vi.fn(() => self)
  self.lt = vi.fn(() => self)
  self.in = vi.fn(() => self)
  self.then = (onFulfilled: (v: unknown) => unknown) => Promise.resolve(result).then(onFulfilled)
  return self
}

describe('getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
    vi.mocked(createClient).mockResolvedValue({ rpc: mockRpc } as unknown as Awaited<ReturnType<typeof createClient>>)

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

  it('maps RPC result when payload is a JSON string', async () => {
    const rpcData = {
      total_patients: 3,
      active_patients: 2,
      today_appointments: 0,
      upcoming_appointments: 0,
      draft_charts: 0,
      finalized_charts: 0,
      total_diagnoses: 0,
      active_staff: 1,
    }
    const mockRpc = vi.fn().mockResolvedValue({ data: JSON.stringify(rpcData), error: null })
    vi.mocked(createClient).mockResolvedValue({ rpc: mockRpc } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getDashboardStats()
    expect(result.totalPatients).toBe(3)
    expect(result.activePatients).toBe(2)
    expect(result.activeStaff).toBe(1)
  })

  it('falls back to table counts when RPC errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const counts = [11, 9, 2, 4, 1, 5, 3, 7]
    let idx = 0
    const mockFrom = vi.fn(() => createThenableBuilder({ count: counts[idx++] ?? 0, error: null }))
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'rpc error' } })
    vi.mocked(createClient).mockResolvedValue({
      rpc: mockRpc,
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getDashboardStats()

    expect(mockFrom).toHaveBeenCalledTimes(8)
    expect(errorSpy).toHaveBeenCalled()
    expect(result).toEqual({
      totalPatients: 11,
      activePatients: 9,
      todayAppointments: 2,
      upcomingAppointments: 4,
      draftCharts: 1,
      finalizedCharts: 5,
      totalDiagnoses: 3,
      activeStaff: 7,
    })
    errorSpy.mockRestore()
  })

  it('falls back without console.error when RPC is not in schema (PGRST202)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const counts = [3, 2, 0, 0, 0, 0, 0, 1]
    let idx = 0
    const mockFrom = vi.fn(() => createThenableBuilder({ count: counts[idx++] ?? 0, error: null }))
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST202',
        message:
          'Could not find the function public.get_dashboard_stats without parameters in the schema cache',
      },
    })
    vi.mocked(createClient).mockResolvedValue({
      rpc: mockRpc,
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getDashboardStats()

    expect(errorSpy).not.toHaveBeenCalled()
    expect(result.totalPatients).toBe(3)
    expect(result.activePatients).toBe(2)
    expect(result.activeStaff).toBe(1)
    errorSpy.mockRestore()
  })
})
