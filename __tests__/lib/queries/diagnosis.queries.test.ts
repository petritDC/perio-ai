import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { getPatientDiagnoses } from '@/lib/queries/diagnosis.queries'

const LIST_COLUMNS = 'id, chart_id, patient_id, generated_by, stage, grade, extent, model_used, created_at'

describe('getPatientDiagnoses', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does not select raw_response or findings', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    await getPatientDiagnoses('patient-1')

    expect(mockSelect).toHaveBeenCalledWith(LIST_COLUMNS)
  })

  it('returns empty array on error', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getPatientDiagnoses('patient-1')
    expect(result).toEqual([])
  })

  it('maps rows to diagnosis shape without raw_response and findings', async () => {
    const mockRow = {
      id: 'diag-1', chart_id: 'chart-1', patient_id: 'patient-1',
      generated_by: 'user-1', stage: 'Stage II', grade: 'Grade B',
      extent: 'Localized', model_used: 'gpt-4', created_at: '2026-03-31T00:00:00Z',
    }
    const mockOrder = vi.fn().mockResolvedValue({ data: [mockRow], error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await getPatientDiagnoses('patient-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('diag-1')
    expect(result[0].stage).toBe('Stage II')
    // raw_response and findings must be absent from the list shape
    expect('rawResponse' in result[0]).toBe(false)
    expect('findings' in result[0]).toBe(false)
  })
})
