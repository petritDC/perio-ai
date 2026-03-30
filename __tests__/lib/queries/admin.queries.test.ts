import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffRosterStats, getPendingInvites } from '@/lib/queries/admin.queries'

describe('getStaffRosterStats', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns zeros when no staff exist', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const result = await getStaffRosterStats()
    expect(result.total).toBe(0)
    expect(result.byRole).toEqual({})
    expect(result.byStatus).toEqual({})
  })

  it('counts staff by role and status', async () => {
    const mockData = [
      { role: 'dentist', status: 'active' },
      { role: 'dentist', status: 'active' },
      { role: 'admin', status: 'active' },
      { role: 'hygienist', status: 'inactive' },
    ]
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const result = await getStaffRosterStats()
    expect(result.total).toBe(4)
    expect(result.byRole.dentist).toBe(2)
    expect(result.byRole.admin).toBe(1)
    expect(result.byRole.hygienist).toBe(1)
    expect(result.byStatus.active).toBe(3)
    expect(result.byStatus.inactive).toBe(1)
  })
})

describe('getPendingInvites', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns only unconfirmed users', async () => {
    const mockUsers = [
      { id: 'u1', email: 'a@test.com', email_confirmed_at: null, created_at: '2026-01-01T00:00:00Z', user_metadata: { role: 'dentist' } },
      { id: 'u2', email: 'b@test.com', email_confirmed_at: '2026-01-02T00:00:00Z', created_at: '2026-01-01T00:00:00Z', user_metadata: {} },
    ]
    const mockAdmin = {
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({ data: { users: mockUsers }, error: null }),
        },
      },
    }
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin as any)

    const result = await getPendingInvites()
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('a@test.com')
    expect(result[0].role).toBe('dentist')
  })
})
