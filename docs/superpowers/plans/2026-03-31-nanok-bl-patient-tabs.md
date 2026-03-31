# Nanok BL Patient Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `mock_BL.JSON` bone-level data through the existing periodontitis classification service and display the results in the Diagnostics, Charting, and Radiology tabs of the patient profile page.

**Architecture:** Server component reads `mock_BL.JSON` via a direct JSON import, calls a new pure `computeBLDiagnosis()` function, then passes pre-computed data as props into three new focused display components placed inline in `page.tsx`'s tab JSX. No new API routes. `BLRadiologyOverlay` is the only client component (needs `useState` for the confidence slider and image dimensions).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest + jsdom, Supabase storage (signed URLs generated server-side in `page.tsx`).

---

## File Map

| Status | File | Responsibility |
|--------|------|---------------|
| **Create** | `lib/services/bl-diagnosis.service.ts` | Pure function: BL JSON → Stage/Grade/Extent/fullDiagnosis |
| **Create** | `__tests__/lib/services/bl-diagnosis.service.test.ts` | Unit tests for the above |
| **Create** | `components/patients/BLDiagnosisPanel.tsx` | Server component — Diagnostics tab card |
| **Create** | `components/patients/AITeethDataPanel.tsx` | Server component — Charting tab table |
| **Create** | `components/radiology/BLRadiologyOverlay.tsx` | Client component — Radiology tab image + boxes + slider |
| **Modify** | `app/(dashboard)/patients/[id]/page.tsx` | Import BL data, compute diagnosis, generate signed URL, wire three components |

---

## Task 1: `bl-diagnosis.service.ts` — pure computation function (TDD)

**Files:**
- Create: `lib/services/bl-diagnosis.service.ts`
- Create: `__tests__/lib/services/bl-diagnosis.service.test.ts`

- [ ] **Step 1: Create the test file with failing tests**

Create `__tests__/lib/services/bl-diagnosis.service.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeBLDiagnosis } from '@/lib/services/bl-diagnosis.service'
import type { BLData } from '@/lib/services/bl-diagnosis.service'
import type { RiskFactors } from '@/lib/types/patient-intake'

const mockBL: BLData = {
  input_dicom: 'BW01.dcm',
  pixel_spacing_mm: { row: 0.08, col: 0.08 },
  teeth: [
    {
      tooth_id: 21,
      confidence: 0.92,
      bounding_box: { x1: 360, y1: 280, x2: 520, y2: 460 },
      keypoints: {
        CEJ_left:  { x: 380, y: 310, confidence: 0.91 },
        CEJ_right: { x: 500, y: 312, confidence: 0.89 },
        BL_left:   { x: 385, y: 420, confidence: 0.87 },
        BL_right:  { x: 495, y: 425, confidence: 0.90 },
      },
      measurements_mm: { left: { CEJ_to_BL: 8.84 }, right: { CEJ_to_BL: 9.05 } },
    },
    {
      tooth_id: 22,
      confidence: 0.88,
      bounding_box: { x1: 540, y1: 270, x2: 690, y2: 450 },
      keypoints: {
        CEJ_left:  { x: 560, y: 300, confidence: 0.93 },
        CEJ_right: { x: 670, y: 305, confidence: 0.90 },
        BL_left:   { x: 565, y: 415, confidence: 0.86 },
        BL_right:  { x: 665, y: 418, confidence: 0.88 },
      },
      measurements_mm: { left: { CEJ_to_BL: 9.20 }, right: { CEJ_to_BL: 8.96 } },
    },
  ],
}

const nonSmokerNoDb: RiskFactors = {
  smokingStatus: 'non_smoker',
  cigarettesPerDay: 0,
  diabetesDiagnosed: false,
  hba1c: null,
}

describe('computeBLDiagnosis', () => {
  it('computes maxBoneLossPct as the highest avg CEJ-to-BL across all teeth', () => {
    // tooth 21: (8.84 + 9.05) / 2 = 8.945 → 8.945/13*100 ≈ 68.8%
    // tooth 22: (9.20 + 8.96) / 2 = 9.08  → 9.08/13*100  ≈ 69.8%  ← max
    const result = computeBLDiagnosis(mockBL, nonSmokerNoDb)
    expect(result.maxBoneLossPct).toBeCloseTo(69.8, 0)
  })

  it('returns Stage III when maxBoneLossPct > 33', () => {
    const result = computeBLDiagnosis(mockBL, nonSmokerNoDb)
    expect(result.stage).toBe('Stage III')
  })

  it('returns Stage I when maxBoneLossPct < 15', () => {
    const lowBL: BLData = {
      ...mockBL,
      teeth: [
        {
          ...mockBL.teeth[0],
          measurements_mm: { left: { CEJ_to_BL: 1.0 }, right: { CEJ_to_BL: 1.0 } },
        },
      ],
    }
    const result = computeBLDiagnosis(lowBL, nonSmokerNoDb)
    expect(result.stage).toBe('Stage I')
  })

  it('returns Grade A for non-smoker with no diabetes', () => {
    const result = computeBLDiagnosis(mockBL, nonSmokerNoDb)
    expect(result.grade).toBe('Grade A')
    expect(result.gradeModifiers).toHaveLength(0)
  })

  it('returns Grade C for heavy smoker (≥10 cig/day)', () => {
    const heavySmoker: RiskFactors = {
      smokingStatus: 'current_smoker',
      cigarettesPerDay: 15,
      diabetesDiagnosed: false,
      hba1c: null,
    }
    const result = computeBLDiagnosis(mockBL, heavySmoker)
    expect(result.grade).toBe('Grade C')
    expect(result.gradeModifiers[0]).toMatch(/15 cig\/day/)
  })

  it('returns Grade C for uncontrolled diabetes (HbA1c ≥7.0%)', () => {
    const uncontrolledDiabetes: RiskFactors = {
      smokingStatus: 'non_smoker',
      cigarettesPerDay: 0,
      diabetesDiagnosed: true,
      hba1c: 8.5,
    }
    const result = computeBLDiagnosis(mockBL, uncontrolledDiabetes)
    expect(result.grade).toBe('Grade C')
  })

  it('returns Generalized when ≥30% of teeth have bone loss ≥15%', () => {
    const result = computeBLDiagnosis(mockBL, nonSmokerNoDb)
    expect(result.extent).toBe('Generalized')
  })

  it('composes fullDiagnosis string as "Extent Periodontitis, Stage X, Grade Y"', () => {
    const result = computeBLDiagnosis(mockBL, nonSmokerNoDb)
    expect(result.fullDiagnosis).toBe(
      `${result.extent} Periodontitis, ${result.stage}, ${result.grade}`
    )
  })

  it('falls back to Grade A defaults when riskFactors is null', () => {
    const result = computeBLDiagnosis(mockBL, null)
    expect(result.grade).toBe('Grade A')
  })

  it('returns one measurement entry per tooth in the same order', () => {
    const result = computeBLDiagnosis(mockBL, nonSmokerNoDb)
    expect(result.measurements).toHaveLength(2)
    expect(result.measurements[0].tooth).toBe(21)
    expect(result.measurements[1].tooth).toBe(22)
  })
})
```

- [ ] **Step 2: Run tests — confirm they all fail with "cannot find module"**

```bash
cd /Users/petrithalabaku/work/DCL/DENTAL/FINAL-APPS/perio-ai
npx vitest run __tests__/lib/services/bl-diagnosis.service.test.ts
```

Expected: FAIL — `Error: Cannot find module '@/lib/services/bl-diagnosis.service'`

- [ ] **Step 3: Create the implementation**

Create `lib/services/bl-diagnosis.service.ts`:

```typescript
import type { RiskFactors } from '@/lib/types/patient-intake'
import {
  determineStage,
  determineGrade,
  determineExtent,
  type BoneLevelMeasurement,
} from '@/lib/services/periodontitis.service'

const AVG_ROOT_LENGTH_MM = 13

export interface BLKeypoint {
  x: number
  y: number
  confidence: number
}

export interface BLTooth {
  tooth_id: number
  confidence: number
  bounding_box: { x1: number; y1: number; x2: number; y2: number }
  keypoints: {
    CEJ_left: BLKeypoint
    CEJ_right: BLKeypoint
    BL_left: BLKeypoint
    BL_right: BLKeypoint
  }
  measurements_mm: {
    left: { CEJ_to_BL: number }
    right: { CEJ_to_BL: number }
  }
}

export interface BLData {
  input_dicom: string
  pixel_spacing_mm: { row: number; col: number }
  teeth: BLTooth[]
}

export interface BLDiagnosis {
  stage: string
  grade: string
  gradeModifiers: string[]
  extent: string
  fullDiagnosis: string
  maxBoneLossPct: number
  measurements: BoneLevelMeasurement[]
}

const DEFAULT_RISK_FACTORS: RiskFactors = {
  smokingStatus: 'non_smoker',
  cigarettesPerDay: 0,
  diabetesDiagnosed: false,
  hba1c: null,
}

export function computeBLDiagnosis(
  blData: BLData,
  riskFactors?: RiskFactors | null
): BLDiagnosis {
  const measurements: BoneLevelMeasurement[] = blData.teeth.map((tooth) => {
    const avgCejToBL =
      (tooth.measurements_mm.left.CEJ_to_BL + tooth.measurements_mm.right.CEJ_to_BL) / 2
    const boneLossPct = (avgCejToBL / AVG_ROOT_LENGTH_MM) * 100
    return {
      tooth: tooth.tooth_id,
      boneLevel_mm: avgCejToBL,
      boneLevel_pct: boneLossPct,
    }
  })

  const maxBoneLossPct =
    measurements.length > 0 ? Math.max(...measurements.map((m) => m.boneLevel_pct)) : 0

  const stage = determineStage(maxBoneLossPct)
  const { grade, modifiers: gradeModifiers } = determineGrade(
    riskFactors ?? DEFAULT_RISK_FACTORS
  )
  const extent = determineExtent(measurements)

  return {
    stage,
    grade,
    gradeModifiers,
    extent,
    fullDiagnosis: `${extent} Periodontitis, ${stage}, ${grade}`,
    maxBoneLossPct,
    measurements,
  }
}
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
npx vitest run __tests__/lib/services/bl-diagnosis.service.test.ts
```

Expected: PASS — 9 tests passing

- [ ] **Step 5: Commit**

```bash
cd /Users/petrithalabaku/work/DCL/DENTAL/FINAL-APPS/perio-ai
git add lib/services/bl-diagnosis.service.ts __tests__/lib/services/bl-diagnosis.service.test.ts
git commit -m "feat: add computeBLDiagnosis service — BL JSON to Stage/Grade/Extent"
```

---

## Task 2: `BLDiagnosisPanel` — Diagnostics tab card

**Files:**
- Create: `components/patients/BLDiagnosisPanel.tsx`

- [ ] **Step 1: Create the component**

Create `components/patients/BLDiagnosisPanel.tsx`:

```tsx
import type { BLDiagnosis } from '@/lib/services/bl-diagnosis.service'
import type { BLTooth } from '@/lib/services/bl-diagnosis.service'

function Badge({
  children,
  colorClass,
}: {
  children: React.ReactNode
  colorClass: string
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colorClass}`}
    >
      {children}
    </span>
  )
}

export function BLDiagnosisPanel({
  diagnosis,
  teeth,
}: {
  diagnosis: BLDiagnosis
  teeth: BLTooth[]
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 mb-4"
      style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-[13px] font-semibold text-slate-900"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Nanok AI Diagnosis
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">mock_BL.JSON</span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge colorClass="bg-blue-50 text-blue-700 border-blue-200">{diagnosis.stage}</Badge>
        <Badge colorClass="bg-purple-50 text-purple-700 border-purple-200">{diagnosis.grade}</Badge>
        <Badge colorClass="bg-teal-50 text-teal-700 border-teal-200">{diagnosis.extent}</Badge>
      </div>

      {/* Full diagnosis string */}
      <p
        className="text-[13px] font-medium text-slate-800 mb-2"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        {diagnosis.fullDiagnosis}
      </p>

      {/* Max bone loss */}
      <p className="text-[12px] text-slate-500 mb-3">
        Max bone loss:{' '}
        <span className="font-semibold text-slate-700">
          {diagnosis.maxBoneLossPct.toFixed(1)}%
        </span>
      </p>

      {/* Grade modifiers */}
      {diagnosis.gradeModifiers.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">
            Grade modifiers
          </p>
          <ul className="space-y-0.5">
            {diagnosis.gradeModifiers.map((mod, i) => (
              <li key={i} className="text-[12px] text-slate-600">
                • {mod}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-tooth L/R measurements */}
      <div className="border-t border-slate-100 pt-3">
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-2">
          Per-tooth measurements
        </p>
        <div className="space-y-1">
          {teeth.map((tooth) => (
            <div key={tooth.tooth_id} className="flex justify-between text-[12px]">
              <span className="text-slate-500">Tooth {tooth.tooth_id}</span>
              <span className="text-slate-700 font-medium tabular-nums">
                L {tooth.measurements_mm.left.CEJ_to_BL.toFixed(2)} mm · R{' '}
                {tooth.measurements_mm.right.CEJ_to_BL.toFixed(2)} mm
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/petrithalabaku/work/DCL/DENTAL/FINAL-APPS/perio-ai
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/patients/BLDiagnosisPanel.tsx
git commit -m "feat: add BLDiagnosisPanel component for Diagnostics tab"
```

---

## Task 3: `AITeethDataPanel` — Charting tab table

**Files:**
- Create: `components/patients/AITeethDataPanel.tsx`

- [ ] **Step 1: Create the component**

Create `components/patients/AITeethDataPanel.tsx`:

```tsx
import type { BLTooth } from '@/lib/services/bl-diagnosis.service'

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-600 tabular-nums w-8">{pct}%</span>
    </div>
  )
}

export function AITeethDataPanel({ teeth }: { teeth: BLTooth[] }) {
  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[13px] font-semibold text-slate-900"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          AI Teeth Data
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">mock_BL.JSON</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-[11px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-4">
                Tooth
              </th>
              <th className="text-left text-[11px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-4">
                Confidence
              </th>
              <th className="text-right text-[11px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-4">
                CEJ→BL Left
              </th>
              <th className="text-right text-[11px] text-slate-400 font-medium uppercase tracking-wider pb-2">
                CEJ→BL Right
              </th>
            </tr>
          </thead>
          <tbody>
            {teeth.map((tooth) => (
              <tr key={tooth.tooth_id} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-4 text-slate-800 font-semibold">
                  {tooth.tooth_id}
                </td>
                <td className="py-2.5 pr-4">
                  <ConfidenceBar value={tooth.confidence} />
                </td>
                <td className="py-2.5 pr-4 text-right text-slate-700 tabular-nums">
                  {tooth.measurements_mm.left.CEJ_to_BL.toFixed(2)} mm
                </td>
                <td className="py-2.5 text-right text-slate-700 tabular-nums">
                  {tooth.measurements_mm.right.CEJ_to_BL.toFixed(2)} mm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/petrithalabaku/work/DCL/DENTAL/FINAL-APPS/perio-ai
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/patients/AITeethDataPanel.tsx
git commit -m "feat: add AITeethDataPanel component for Charting tab"
```

---

## Task 4: `BLRadiologyOverlay` — Radiology tab image + bounding boxes + slider

**Files:**
- Create: `components/radiology/BLRadiologyOverlay.tsx`

- [ ] **Step 1: Create the component**

Create `components/radiology/BLRadiologyOverlay.tsx`:

```tsx
'use client'

import { useState, useRef } from 'react'
import type { BLTooth } from '@/lib/services/bl-diagnosis.service'

function toPercent(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(4)}%`
}

export function BLRadiologyOverlay({
  imageUrl,
  teeth,
}: {
  imageUrl: string | null
  teeth: BLTooth[]
}) {
  const [threshold, setThreshold] = useState(0.5)
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  function handleImageLoad() {
    if (imgRef.current) {
      setImgDims({
        w: imgRef.current.naturalWidth,
        h: imgRef.current.naturalHeight,
      })
    }
  }

  const visibleTeeth = teeth.filter((t) => t.confidence >= threshold)

  return (
    <div
      className="bg-white rounded-2xl p-5 mb-4"
      style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[13px] font-semibold text-slate-900"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          AI Bone Level Analysis
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">mock_BL.JSON</span>
      </div>

      {/* Confidence slider */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] text-slate-500 whitespace-nowrap">
          Confidence threshold
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="flex-1 accent-teal-600"
        />
        <span className="text-[12px] font-medium text-slate-700 tabular-nums w-10 text-right">
          {Math.round(threshold * 100)}%
        </span>
      </div>

      {/* Image + overlay */}
      {!imageUrl ? (
        <div className="h-40 flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-[12px] text-slate-400">
            No radiology image uploaded yet — upload one in the Radiology tab
          </p>
        </div>
      ) : (
        <div className="relative inline-block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Dental X-ray"
            onLoad={handleImageLoad}
            className="w-full rounded-xl block"
          />

          {/* Bounding boxes — only rendered once image dimensions are known */}
          {imgDims &&
            visibleTeeth.map((tooth) => {
              const { x1, y1, x2, y2 } = tooth.bounding_box
              return (
                <div
                  key={tooth.tooth_id}
                  className="absolute border-2 border-teal-500 rounded"
                  style={{
                    left: toPercent(x1, imgDims.w),
                    top: toPercent(y1, imgDims.h),
                    width: toPercent(x2 - x1, imgDims.w),
                    height: toPercent(y2 - y1, imgDims.h),
                  }}
                >
                  {/* Label */}
                  <span className="absolute -top-5 left-0 bg-teal-600 text-white text-[9px] font-semibold px-1 py-0.5 rounded whitespace-nowrap">
                    T{tooth.tooth_id} · {Math.round(tooth.confidence * 100)}%
                  </span>

                  {/* CEJ keypoints — teal dots */}
                  {(['CEJ_left', 'CEJ_right'] as const).map((kp) => {
                    const point = tooth.keypoints[kp]
                    if (point.confidence < threshold) return null
                    return (
                      <div
                        key={kp}
                        className="absolute w-2 h-2 rounded-full bg-teal-400 border border-white -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: toPercent(point.x - x1, x2 - x1),
                          top: toPercent(point.y - y1, y2 - y1),
                        }}
                        title={`${kp}: ${(point.confidence * 100).toFixed(0)}%`}
                      />
                    )
                  })}

                  {/* BL keypoints — amber dots */}
                  {(['BL_left', 'BL_right'] as const).map((kp) => {
                    const point = tooth.keypoints[kp]
                    if (point.confidence < threshold) return null
                    return (
                      <div
                        key={kp}
                        className="absolute w-2 h-2 rounded-full bg-amber-400 border border-white -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: toPercent(point.x - x1, x2 - x1),
                          top: toPercent(point.y - y1, y2 - y1),
                        }}
                        title={`${kp}: ${(point.confidence * 100).toFixed(0)}%`}
                      />
                    )
                  })}
                </div>
              )
            })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-teal-400 border border-white ring-1 ring-teal-500" />
          <span className="text-[11px] text-slate-500">CEJ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 border border-white ring-1 ring-amber-500" />
          <span className="text-[11px] text-slate-500">Bone Level</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 border-2 border-teal-500 rounded" />
          <span className="text-[11px] text-slate-500">Tooth bounding box</span>
        </div>
        <span className="ml-auto text-[11px] text-slate-400">
          {visibleTeeth.length} / {teeth.length} teeth shown
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/petrithalabaku/work/DCL/DENTAL/FINAL-APPS/perio-ai
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/radiology/BLRadiologyOverlay.tsx
git commit -m "feat: add BLRadiologyOverlay component with confidence slider and keypoints"
```

---

## Task 5: Wire everything into `page.tsx`

**Files:**
- Modify: `app/(dashboard)/patients/[id]/page.tsx`

- [ ] **Step 1: Update the imports block**

In `app/(dashboard)/patients/[id]/page.tsx`, replace the existing import block with:

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPatient, getPatientDocuments, getPatientIntakeData } from '@/lib/queries/patient.queries'
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
import blRaw from '@/lib/json/mock_BL.JSON'
import type { RiskFactors } from '@/lib/types/patient-intake'
```

- [ ] **Step 2: Add BL computation and signed URL generation after the existing fetches**

Inside `PatientProfilePage`, after `const intake = await getPatientIntakeData(...)` and before `if (!patient) notFound()`, add:

```typescript
  // Derive BL diagnosis from mock data, using patient's risk factors if available
  const riskFactors = intake?.risk_factors as RiskFactors | null ?? null
  const blDiagnosis = computeBLDiagnosis(blRaw, riskFactors)

  // Generate a 1-hour signed URL for the first uploaded radiology image (if any)
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

- [ ] **Step 3: Update the charting tab content**

Replace the `charting:` tab content from:

```tsx
          charting: (
            <div className="space-y-4">
              <ChartSummaryCard patientId={id} charts={charts} />
            </div>
          ),
```

with:

```tsx
          charting: (
            <div className="space-y-4">
              <ChartSummaryCard patientId={id} charts={charts} />
              <AITeethDataPanel teeth={blRaw.teeth} />
            </div>
          ),
```

- [ ] **Step 4: Update the radiology tab content**

Replace the `radiology:` tab content from:

```tsx
          radiology: <RadiologyViewer key="radiology" patientId={id} initialImages={radiologyImages} />,
```

with:

```tsx
          radiology: (
            <div className="space-y-4">
              <BLRadiologyOverlay imageUrl={firstImageUrl} teeth={blRaw.teeth} />
              <RadiologyViewer key="radiology" patientId={id} initialImages={radiologyImages} />
            </div>
          ),
```

- [ ] **Step 5: Update the diagnostics tab content**

Replace the `diagnostics:` tab content from:

```tsx
          diagnostics: <PatientDiagnosisHistory key="diagnostics" diagnoses={diagnoses} />,
```

with:

```tsx
          diagnostics: (
            <div className="space-y-4">
              <BLDiagnosisPanel diagnosis={blDiagnosis} teeth={blRaw.teeth} />
              <PatientDiagnosisHistory key="diagnostics" diagnoses={diagnoses} />
            </div>
          ),
```

- [ ] **Step 6: Verify TypeScript compiles cleanly**

```bash
cd /Users/petrithalabaku/work/DCL/DENTAL/FINAL-APPS/perio-ai
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass (at minimum the 9 tests from Task 1)

- [ ] **Step 8: Commit**

```bash
git add app/\(dashboard\)/patients/\[id\]/page.tsx
git commit -m "feat: wire BL diagnosis, AI teeth data, and radiology overlay into patient page tabs"
```

---

## Verification Checklist

After completing all tasks, open a patient profile page in the browser and verify:

- [ ] **Diagnostics tab:** `BLDiagnosisPanel` card appears above the existing `PatientDiagnosisHistory`. It shows stage/grade/extent badges, the full diagnosis string, max bone loss %, grade modifiers (if any), and L/R per-tooth measurements.
- [ ] **Charting tab:** `AITeethDataPanel` appears below `ChartSummaryCard`. It shows a table with tooth ID, confidence bar, CEJ→BL left mm, and CEJ→BL right mm for each tooth from `mock_BL.JSON`.
- [ ] **Radiology tab (no image uploaded):** `BLRadiologyOverlay` shows the placeholder message "No radiology image uploaded yet". `RadiologyViewer` gallery remains below it.
- [ ] **Radiology tab (image uploaded):** `BLRadiologyOverlay` shows the x-ray with teal bounding boxes for teeth above the confidence threshold, teal CEJ dots, amber BL dots, and a tooth count legend. The confidence slider filters which teeth are visible.
- [ ] **Risk factors from intake:** If the patient has intake data with `risk_factors`, the `BLDiagnosis` grade reflects those factors (e.g. a patient with HbA1c ≥7% should show Grade C with a modifier message).
