# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 8 root-cause performance bottlenecks (full table scans, N+1 queries, sequential waterfalls, un-memoized auth) that make every page in the app slow.

**Architecture:** Three layers of fixes applied bottom-up — (1) DB migration adds missing indexes and a stats RPC, (2) query layer consolidates round-trips and projects columns, (3) auth layer memoizes the session so every page stops firing redundant `auth.getUser()` calls.

**Tech Stack:** Supabase (PostgreSQL + pg_trgm), Next.js App Router, React `cache()`, Vitest

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Create | `supabase/migrations/20260331000001_performance_indexes.sql` | GIN trigram indexes, composite index, status index, `get_dashboard_stats` RPC |
| Modify | `lib/auth/session.ts` | Wrap `getSession` with React `cache()` |
| Modify | `lib/queries/charting.queries.ts` | `getChart()` single joined query |
| Create | `__tests__/lib/queries/charting.queries.test.ts` | Tests for new `getChart` shape |
| Modify | `lib/queries/patient.queries.ts` | Add `getPatientWithIntake()` |
| Create | `__tests__/lib/queries/patient.queries.test.ts` | Tests for `getPatientWithIntake` |
| Modify | `app/(dashboard)/patients/[id]/page.tsx` | Remove intake waterfall, use `getPatientWithIntake` |
| Modify | `lib/queries/diagnosis.queries.ts` | Project columns, drop `raw_response` + `findings` from list |
| Create | `__tests__/lib/queries/diagnosis.queries.test.ts` | Tests for column projection |
| Modify | `lib/queries/dashboard.queries.ts` | Use `get_dashboard_stats` RPC |
| Create | `__tests__/lib/queries/dashboard.queries.test.ts` | Tests for RPC-backed stats |

---

## Task 1: Database migration — indexes and RPC

**Files:**
- Create: `supabase/migrations/20260331000001_performance_indexes.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260331000001_performance_indexes.sql

-- Enable trigram extension for fast ilike search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes for patient ilike search
-- These turn `ilike '%x%'` from a full table scan into a ~10ms index lookup
CREATE INDEX IF NOT EXISTS patients_full_name_trgm_idx
  ON patients USING GIN (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS patients_email_trgm_idx
  ON patients USING GIN (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS patients_medical_record_no_trgm_idx
  ON patients USING GIN (medical_record_no gin_trgm_ops);

-- GIN trigram index for radiology patient search on profiles
CREATE INDEX IF NOT EXISTS profiles_full_name_trgm_idx
  ON profiles USING GIN (full_name gin_trgm_ops);

-- Composite index for patient list (status filter + created_at sort)
-- Replaces the two separate single-column indexes for this query pattern
CREATE INDEX IF NOT EXISTS patients_status_created_at_idx
  ON patients (status, created_at DESC);

-- Index on patient_intake_submissions.status for pending intake query
CREATE INDEX IF NOT EXISTS patient_intake_submissions_status_idx
  ON patient_intake_submissions (status)
  WHERE status = 'pending_review';

-- Single RPC that returns all 8 dashboard counts in one round-trip
-- Replaces 8 separate COUNT queries in getDashboardStats()
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_patients',        (SELECT COUNT(*) FROM profiles WHERE role = 'patient'),
    'active_patients',       (SELECT COUNT(*) FROM profiles WHERE role = 'patient' AND status = 'active'),
    'today_appointments',    (SELECT COUNT(*) FROM appointments
                              WHERE start_time >= CURRENT_DATE::timestamptz
                                AND start_time <  (CURRENT_DATE + INTERVAL '1 day')::timestamptz),
    'upcoming_appointments', (SELECT COUNT(*) FROM appointments
                              WHERE start_time > NOW()
                                AND status IN ('scheduled', 'confirmed')),
    'draft_charts',          (SELECT COUNT(*) FROM periodontal_charts WHERE status = 'draft'),
    'finalized_charts',      (SELECT COUNT(*) FROM periodontal_charts WHERE status = 'finalized'),
    'total_diagnoses',       (SELECT COUNT(*) FROM ai_diagnoses),
    'active_staff',          (SELECT COUNT(*) FROM profiles WHERE role != 'patient' AND status = 'active')
  ) INTO result;
  RETURN result;
END;
$$;
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db push
```

Expected: `Applied 1 migration` with no errors. If `pg_trgm` is already enabled you'll see `extension "pg_trgm" already exists, skipping` — that's fine.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260331000001_performance_indexes.sql
git commit -m "feat(db): add GIN trigram indexes and dashboard stats RPC"
```

---

## Task 2: Memoize `getSession()` with React `cache()`

**Files:**
- Modify: `lib/auth/session.ts`

- [ ] **Step 1: Update `lib/auth/session.ts`**

Replace the entire file contents with:

```ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { UserSession, UserRole } from '@/lib/types/auth'

// cache() memoizes per React request — getSession() calls createClient() and
// auth.getUser() exactly once per request, regardless of how many times it is called.
export const getSession = cache(async (): Promise<UserSession | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let role = (user.user_metadata?.role ?? '') as UserRole
  let fullName = user.user_metadata?.full_name ?? null

  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    role = (profile?.role ?? 'patient') as UserRole
    if (!fullName) fullName = profile?.full_name ?? null
  }

  return { id: user.id, email: user.email!, role, fullName }
})

export async function requireSession(): Promise<UserSession> {
  const session = await getSession()
  if (!session) throw new Error('Unauthenticated')
  return session
}

export async function requireRole(allowed: UserRole[]): Promise<UserSession> {
  const session = await requireSession()
  if (!allowed.includes(session.role)) throw new Error('Forbidden')
  return session
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/session.ts
git commit -m "perf: memoize getSession with React cache to reduce auth round-trips"
```

---

## Task 3: Fix `getChart()` — single joined query

**Files:**
- Modify: `lib/queries/charting.queries.ts`
- Create: `__tests__/lib/queries/charting.queries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/queries/charting.queries.test.ts`:

```ts
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
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any)

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
    vi.mocked(createAdminClient).mockReturnValue({ from: mockFrom } as any)

    const result = await getChart('chart-1')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('chart-1')
    expect(result!.teeth).toHaveLength(1)
    expect(result!.teeth[0].toothNumber).toBe(11)
    // Verify only ONE `from` call was made (no second round-trip for teeth)
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
npm run test -- charting.queries.test --run
```

Expected: FAIL — `getChart` currently calls `from` twice so `toHaveBeenCalledTimes(1)` fails.

- [ ] **Step 3: Update `getChart()` in `lib/queries/charting.queries.ts`**

Replace the `getChart` function (leave `getPatientCharts` untouched):

```ts
export async function getChart(chartId: string): Promise<ChartWithTeeth | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('periodontal_charts')
    .select('*, chart_teeth(*)')
    .eq('id', chartId)
    .single()

  if (error || !data) return null

  const mappedTeeth: ToothData[] = ((data as any).chart_teeth ?? []).map((t: any) => ({
    id: t.id,
    chartId: t.chart_id,
    toothNumber: t.tooth_number,
    pdDb: t.pd_db, pdB: t.pd_b, pdMb: t.pd_mb,
    pdDl: t.pd_dl, pdL: t.pd_l, pdMl: t.pd_ml,
    recDb: t.rec_db, recB: t.rec_b, recMb: t.rec_mb,
    recDl: t.rec_dl, recL: t.rec_l, recMl: t.rec_ml,
    bopDb: t.bop_db, bopB: t.bop_b, bopMb: t.bop_mb,
    bopDl: t.bop_dl, bopL: t.bop_l, bopMl: t.bop_ml,
    furcation: t.furcation,
    mobility: t.mobility,
    implant: t.implant,
    missing: t.missing,
    notes: t.notes,
  }))

  return {
    id: data.id,
    patientId: (data as any).patient_id,
    providerId: (data as any).provider_id,
    chartDate: (data as any).chart_date,
    status: (data as any).status,
    notes: (data as any).notes,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
    teeth: mappedTeeth,
  }
}
```

- [ ] **Step 4: Run the tests — verify they pass**

```bash
npm run test -- charting.queries.test --run
```

Expected: PASS.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/queries/charting.queries.ts __tests__/lib/queries/charting.queries.test.ts
git commit -m "perf: consolidate getChart into single joined query, eliminating N+1"
```

---

## Task 4: Add `getPatientWithIntake()` and remove profile page waterfall

**Files:**
- Modify: `lib/queries/patient.queries.ts`
- Modify: `app/(dashboard)/patients/[id]/page.tsx`
- Create: `__tests__/lib/queries/patient.queries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/queries/patient.queries.test.ts`:

```ts
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
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

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
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
npm run test -- patient.queries.test --run
```

Expected: FAIL — `getPatientWithIntake` is not exported.

- [ ] **Step 3: Add `getPatientWithIntake` to `lib/queries/patient.queries.ts`**

Add this type and function. Place it after the existing `getPatient` function. Do not remove any existing functions.

```ts
export interface PatientIntakeData {
  allergies: string[]
  medical_history: unknown[]
  risk_factors: Record<string, unknown>
  current_medications: unknown[]
  emergency_contacts: unknown[]
  x_ray_availability: boolean
  doctor_notes: string | null
  submitted_at: string
  status: string
}

export interface PatientWithIntake extends Patient {
  intake: PatientIntakeData | null
}

export async function getPatientWithIntake(id: string): Promise<PatientWithIntake | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      patient_intake_submissions!intake_submission_id(
        allergies, medical_history, risk_factors, current_medications,
        emergency_contacts, x_ray_availability, doctor_notes, submitted_at, status
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  const row = data as any
  return {
    ...(row as Patient),
    intake: row.patient_intake_submissions ?? null,
  }
}
```

- [ ] **Step 4: Run the tests — verify they pass**

```bash
npm run test -- patient.queries.test --run
```

Expected: PASS all 3 tests.

- [ ] **Step 5: Update `app/(dashboard)/patients/[id]/page.tsx` to remove the waterfall**

Replace lines 1–56 (imports + data fetching) with:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPatientWithIntake } from '@/lib/queries/patient.queries'
import { getPatientDocuments } from '@/lib/queries/patient.queries'
import { getPatientTreatmentPlans } from '@/lib/queries/treatment-plan.queries'
import { getPatientRadiologyImages } from '@/lib/queries/radiology.queries'
import { getPatientDiagnoses } from '@/lib/queries/diagnosis.queries'
import { getPatientCharts } from '@/lib/queries/charting.queries'
import { PatientProfileTabs } from '@/components/patients/PatientProfileTabs'
import { DocumentUpload } from '@/components/patients/DocumentUpload'
import { TreatmentPlansPanel } from '@/components/patients/TreatmentPlansPanel'
import RadiologyViewer from '@/components/radiology/RadiologyViewer'
import { PatientDiagnosisHistory } from '@/components/patients/PatientDiagnosisHistory'
import ChartSummaryCard from '@/components/charting/ChartSummaryCard'
import { Button } from '@/components/ui/button'
import { DeletePatientButton } from '@/components/patients/DeletePatientButton'
import { ChevronLeft, Pencil } from 'lucide-react'
import { BLDiagnosisPanel } from '@/components/patients/BLDiagnosisPanel'
import { AITeethDataPanel } from '@/components/patients/AITeethDataPanel'
import { BLRadiologyOverlay } from '@/components/radiology/BLRadiologyOverlay'
import { computeBLDiagnosis } from '@/lib/services/bl-diagnosis.service'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import blRaw from '@/lib/json/mock_BL.json'
import type { RiskFactors } from '@/lib/types/patient-intake'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PatientProfilePage({ params }: PageProps) {
  const { id } = await params

  // All fetches run in parallel — intake is joined into the patient query (no waterfall)
  const [patientWithIntake, documents, treatmentPlans, radiologyImages, diagnoses, charts, session] = await Promise.all([
    getPatientWithIntake(id),
    getPatientDocuments(id),
    getPatientTreatmentPlans(id),
    getPatientRadiologyImages(id),
    getPatientDiagnoses(id),
    getPatientCharts(id),
    getSession(),
  ])

  if (!patientWithIntake) notFound()

  const { intake, ...patient } = patientWithIntake
  const riskFactors = (intake?.risk_factors as RiskFactors | null) ?? null
  const blDiagnosis = computeBLDiagnosis(blRaw, riskFactors)

  const firstImage = radiologyImages.find((img) => img.mimeType?.startsWith('image/')) ?? null
  let firstImageUrl: string | null = null
  if (firstImage) {
    const supabase = await createClient()
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(firstImage.filePath, 3600)
    firstImageUrl = data?.signedUrl ?? null
  }
```

Then in the JSX, replace all `intake?.` references — the variable name stays `intake` so no other JSX changes are needed.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/queries/patient.queries.ts app/(dashboard)/patients/[id]/page.tsx __tests__/lib/queries/patient.queries.test.ts
git commit -m "perf: eliminate patient profile intake waterfall with joined query"
```

---

## Task 5: Project columns in diagnosis list queries

**Files:**
- Modify: `lib/queries/diagnosis.queries.ts`
- Create: `__tests__/lib/queries/diagnosis.queries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/queries/diagnosis.queries.test.ts`:

```ts
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
    } as any)

    await getPatientDiagnoses('patient-1')

    expect(mockSelect).toHaveBeenCalledWith(LIST_COLUMNS)
  })

  it('returns empty array on error', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as any)

    const result = await getPatientDiagnoses('patient-1')
    expect(result).toEqual([])
  })

  it('maps rows to AIDiagnosis shape without raw_response and findings', async () => {
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
    } as any)

    const result = await getPatientDiagnoses('patient-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('diag-1')
    expect(result[0].stage).toBe('Stage II')
    // raw_response and findings must be absent from the list shape
    expect('rawResponse' in result[0]).toBe(false)
    expect('findings' in result[0]).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
npm run test -- diagnosis.queries.test --run
```

Expected: FAIL — `select` is called with `'*'` not the projected columns.

- [ ] **Step 3: Update `lib/queries/diagnosis.queries.ts`**

Replace the entire file:

```ts
import { createClient } from '@/lib/supabase/server'
import type { AIDiagnosis, DiagnosisFindings } from '@/lib/types/diagnosis'

// Columns needed for list views — excludes raw_response (full AI text) and findings (jsonb blob)
const LIST_COLUMNS = 'id, chart_id, patient_id, generated_by, stage, grade, extent, model_used, created_at'

function mapListRow(row: any): Omit<AIDiagnosis, 'rawResponse' | 'findings'> {
  return {
    id: row.id,
    chartId: row.chart_id,
    patientId: row.patient_id,
    generatedBy: row.generated_by,
    stage: row.stage,
    grade: row.grade,
    extent: row.extent,
    modelUsed: row.model_used,
    createdAt: row.created_at,
  }
}

function mapFullRow(row: any): AIDiagnosis {
  return {
    ...mapListRow(row),
    findings: row.findings as DiagnosisFindings,
    rawResponse: row.raw_response,
  }
}

export async function getChartDiagnoses(chartId: string): Promise<Omit<AIDiagnosis, 'rawResponse' | 'findings'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select(LIST_COLUMNS)
    .eq('chart_id', chartId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapListRow)
}

export async function getPatientDiagnoses(patientId: string): Promise<Omit<AIDiagnosis, 'rawResponse' | 'findings'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select(LIST_COLUMNS)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapListRow)
}

export async function getRecentDiagnoses(limit = 20): Promise<Omit<AIDiagnosis, 'rawResponse' | 'findings'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(mapListRow)
}

// Full detail fetch — use this when rendering a single diagnosis detail view
export async function getDiagnosis(id: string): Promise<AIDiagnosis | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_diagnoses')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return mapFullRow(data)
}
```

- [ ] **Step 4: Run the tests — verify they pass**

```bash
npm run test -- diagnosis.queries.test --run
```

Expected: PASS.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors. If `PatientDiagnosisHistory` or other consumers pass `diagnoses` and hit a type error because `rawResponse`/`findings` are now absent, check those components — they should not reference those fields in list view. If they do, update the prop type to `Omit<AIDiagnosis, 'rawResponse' | 'findings'>[]`.

- [ ] **Step 6: Commit**

```bash
git add lib/queries/diagnosis.queries.ts __tests__/lib/queries/diagnosis.queries.test.ts
git commit -m "perf: project diagnosis list columns, drop raw_response and findings from list queries"
```

---

## Task 6: Replace `getDashboardStats` 8-query pattern with single RPC

**Files:**
- Modify: `lib/queries/dashboard.queries.ts`
- Create: `__tests__/lib/queries/dashboard.queries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/queries/dashboard.queries.test.ts`:

```ts
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
    vi.mocked(createClient).mockResolvedValue({ rpc: mockRpc } as any)

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
    vi.mocked(createClient).mockResolvedValue({ rpc: mockRpc } as any)

    const result = await getDashboardStats()

    expect(result.totalPatients).toBe(0)
    expect(result.activePatients).toBe(0)
    expect(result.todayAppointments).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
npm run test -- dashboard.queries.test --run
```

Expected: FAIL — current implementation does not call `rpc`.

- [ ] **Step 3: Replace `getDashboardStats` in `lib/queries/dashboard.queries.ts`**

Replace only the `getDashboardStats` function (leave `getRecentActivity` untouched):

```ts
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_stats')

  if (error || !data) {
    return {
      totalPatients: 0,
      activePatients: 0,
      todayAppointments: 0,
      upcomingAppointments: 0,
      draftCharts: 0,
      finalizedCharts: 0,
      totalDiagnoses: 0,
      activeStaff: 0,
    }
  }

  return {
    totalPatients: data.total_patients ?? 0,
    activePatients: data.active_patients ?? 0,
    todayAppointments: data.today_appointments ?? 0,
    upcomingAppointments: data.upcoming_appointments ?? 0,
    draftCharts: data.draft_charts ?? 0,
    finalizedCharts: data.finalized_charts ?? 0,
    totalDiagnoses: data.total_diagnoses ?? 0,
    activeStaff: data.active_staff ?? 0,
  }
}
```

- [ ] **Step 4: Run the tests — verify they pass**

```bash
npm run test -- dashboard.queries.test --run
```

Expected: PASS.

- [ ] **Step 5: Run all tests**

```bash
npm run test --run
```

Expected: all existing tests still pass.

- [ ] **Step 6: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/queries/dashboard.queries.ts __tests__/lib/queries/dashboard.queries.test.ts
git commit -m "perf: replace 8 COUNT queries with single get_dashboard_stats RPC"
```

---

## Final Verification

- [ ] **Run the full test suite**

```bash
npm run test --run
```

Expected: all tests pass.

- [ ] **Run dev server and spot-check pages**

```bash
npm run dev
```

Open each page and note TTFB in browser DevTools → Network tab (look at the document request):

| Page | Before target | Expected after |
|------|--------------|----------------|
| `/dashboard` | slow | < 300ms TTFB |
| `/patients` | slow | < 300ms TTFB |
| `/patients/[id]` | slow | < 400ms TTFB |
| `/schedule` | slow | < 300ms TTFB |

- [ ] **Record post-optimization metrics in the design doc**

Open `docs/superpowers/specs/2026-03-31-performance-optimization-design.md` and fill in the "after" column in the Metrics Baseline table with actual measured values.
