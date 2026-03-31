import type { RiskFactors } from '@/lib/types/patient-intake'
import {
  determineStage,
  determineGrade,
  determineExtent,
  type BoneLevelMeasurement,
} from '@/lib/services/periodontitis.service'

// Average root length used as denominator for radiographic bone loss %.
// Simplified single value per AAP/EFP 2017 classification framework.
// Real implementations should use a tooth-ID-specific lookup table.
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
    const avgCejToBL = Math.max(
      0,
      (tooth.measurements_mm.left.CEJ_to_BL + tooth.measurements_mm.right.CEJ_to_BL) / 2
    )
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
