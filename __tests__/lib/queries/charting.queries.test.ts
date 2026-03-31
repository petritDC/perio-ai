import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { getChart } from '@/lib/queries/charting.queries'

describe('getChart', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when chart not found', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createAdminClient>)

    const result = await getChart('nonexistent-id')
    expect(result).toBeNull()
  })

  it('returns chart with embedded teeth from a single query', async () => {
    const mockData = {
      id: 'chart-1',
      patient_id: 'patient-1',
      provider_id: 'provider-1',
      chart_date: '2026-03-31',
      status: 'draft',
      notes: null,
      created_at: '2026-03-31T00:00:00Z',
      updated_at: '2026-03-31T00:00:00Z',
      chart_teeth: [
        {
          id: 'tooth-1',
          chart_id: 'chart-1',
          tooth_number: 11,
          pd_db: 2, pd_b: 3, pd_mb: 2,
          pd_dl: 2, pd_l: 2, pd_ml: 2,
          rec_db: 0, rec_b: 0, rec_mb: 0,
          rec_dl: 0, rec_l: 0, rec_ml: 0,
          bop_db: false, bop_b: false, bop_mb: false,
          bop_dl: false, bop_l: false, bop_ml: false,
          furcation: 0, mobility: 0, implant: false, missing: false, notes: null,
        },
      ],
    }
    // Single query — no second `from` call for teeth
    const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createAdminClient>)

    const result = await getChart('chart-1')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('chart-1')
    expect(result!.teeth).toHaveLength(1)
    expect(result!.teeth[0].toothNumber).toBe(11)
    // Verify only ONE `from` call was made (no second round-trip for teeth)
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('returns teeth sorted by tooth_number regardless of DB row order', async () => {
    const mockData = {
      id: 'chart-1',
      patient_id: 'patient-1',
      provider_id: 'provider-1',
      chart_date: '2026-03-31',
      status: 'draft',
      notes: null,
      created_at: '2026-03-31T00:00:00Z',
      updated_at: '2026-03-31T00:00:00Z',
      chart_teeth: [
        { id: 't2', chart_id: 'chart-1', tooth_number: 21, pd_db: 2, pd_b: 2, pd_mb: 2, pd_dl: 2, pd_l: 2, pd_ml: 2, rec_db: 0, rec_b: 0, rec_mb: 0, rec_dl: 0, rec_l: 0, rec_ml: 0, bop_db: false, bop_b: false, bop_mb: false, bop_dl: false, bop_l: false, bop_ml: false, furcation: 0, mobility: 0, implant: false, missing: false, notes: null },
        { id: 't1', chart_id: 'chart-1', tooth_number: 11, pd_db: 3, pd_b: 3, pd_mb: 3, pd_dl: 3, pd_l: 3, pd_ml: 3, rec_db: 0, rec_b: 0, rec_mb: 0, rec_dl: 0, rec_l: 0, rec_ml: 0, bop_db: false, bop_b: false, bop_mb: false, bop_dl: false, bop_l: false, bop_ml: false, furcation: 0, mobility: 0, implant: false, missing: false, notes: null },
      ],
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn().mockReturnValue({ select: mockSelect }) } as unknown as ReturnType<typeof createAdminClient>)

    const result = await getChart('chart-1')

    expect(result!.teeth[0].toothNumber).toBe(11)  // lower number comes first
    expect(result!.teeth[1].toothNumber).toBe(21)
  })
})
