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

  it('returns Grade A when diabetesDiagnosed is true but hba1c is null', () => {
    const diabeticNoHba1c: RiskFactors = {
      smokingStatus: 'non_smoker',
      cigarettesPerDay: 0,
      diabetesDiagnosed: true,
      hba1c: null,
    }
    const result = computeBLDiagnosis(mockBL, diabeticNoHba1c)
    // determineGrade only upgrades grade when hba1c !== null, so Grade A here
    expect(result.grade).toBe('Grade A')
  })

  it('returns Generalized when ≥30% of teeth have bone loss ≥15%', () => {
    const result = computeBLDiagnosis(mockBL, nonSmokerNoDb)
    expect(result.extent).toBe('Generalized')
  })

  it('composes fullDiagnosis string as "Extent Periodontitis, Stage X, Grade Y"', () => {
    const result = computeBLDiagnosis(mockBL, nonSmokerNoDb)
    expect(result.fullDiagnosis).toBe('Generalized Periodontitis, Stage III, Grade A')
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
