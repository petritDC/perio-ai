import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPatientWithIntake } from '@/lib/queries/patient.queries'

describe('getPatientWithIntake', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when patient not found', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)

    const result = await getPatientWithIntake('nonexistent')
    expect(result).toBeNull()
  })

  it('returns patient with intake data embedded', async () => {
    const mockData = {
      id: 'patient-1',
      full_name: 'Jane Doe',
      date_of_birth: '1980-01-01',
      email: 'jane@example.com',
      phone: null,
      address: null,
      insurance_provider: null,
      blood_type: null,
      national_id: null,
      medical_record_no: 'MRN001',
      status: 'active',
      intake_submission_id: 'intake-1',
      notes: '',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      patient_intake_submissions: {
        allergies: ['penicillin'],
        medical_history: [],
        risk_factors: { smokingStatus: 'non_smoker', diabetesDiagnosed: false, hba1c: null },
        current_medications: [],
        emergency_contacts: [],
        x_ray_availability: false,
        doctor_notes: null,
        submitted_at: '2026-01-01T00:00:00Z',
        status: 'reviewed',
      },
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as any)

    const result = await getPatientWithIntake('patient-1')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('patient-1')
    expect(result!.intake).not.toBeNull()
    expect(result!.intake!.allergies).toEqual(['penicillin'])
    // Single query — one `from` call
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('returns patient with null intake when no intake submission', async () => {
    const mockData = {
      id: 'patient-2',
      full_name: 'John Doe',
      date_of_birth: null,
      email: null,
      phone: null,
      address: null,
      insurance_provider: null,
      blood_type: null,
      national_id: null,
      medical_record_no: null,
      status: 'active',
      intake_submission_id: null,
      notes: '',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      patient_intake_submissions: null,
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn().mockReturnValue({ select: mockSelect }) } as any)

    const result = await getPatientWithIntake('patient-2')
    expect(result!.intake).toBeNull()
  })
})
