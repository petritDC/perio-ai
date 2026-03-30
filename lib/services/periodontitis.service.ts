import type { RiskFactors } from '@/lib/types/patient-intake'

export interface BoneLevelMeasurement {
  tooth: number
  boneLevel_mm: number
  boneLevel_pct: number
}

export function determineStage(maxBoneLossPct: number): string {
  if (maxBoneLossPct < 15) return 'Stage I'
  if (maxBoneLossPct <= 33) return 'Stage II'
  return 'Stage III'
}

export function determineGrade(
  riskFactors: RiskFactors
): { grade: string; modifiers: string[] } {
  const modifiers: string[] = []
  let grade = 'Grade A'

  if (riskFactors.smokingStatus === 'current_smoker') {
    if (riskFactors.cigarettesPerDay >= 10) {
      grade = 'Grade C'
      modifiers.push(`Current smoker — ${riskFactors.cigarettesPerDay} cig/day (≥10 threshold)`)
    } else {
      if (grade === 'Grade A') grade = 'Grade B'
      modifiers.push(`Current smoker — ${riskFactors.cigarettesPerDay} cig/day (<10)`)
    }
  } else if (riskFactors.smokingStatus === 'former_smoker') {
    if (grade === 'Grade A') grade = 'Grade B'
    modifiers.push('Former smoker')
  }

  if (riskFactors.diabetesDiagnosed && riskFactors.hba1c !== null) {
    if (riskFactors.hba1c >= 7.0) {
      grade = 'Grade C'
      modifiers.push(`Uncontrolled diabetes — HbA1c ${riskFactors.hba1c}% (≥7.0 threshold)`)
    } else {
      if (grade === 'Grade A') grade = 'Grade B'
      modifiers.push(`Controlled diabetes — HbA1c ${riskFactors.hba1c}%`)
    }
  }

  return { grade, modifiers }
}

export function determineExtent(measurements: BoneLevelMeasurement[]): string {
  if (measurements.length === 0) return 'Localized'
  const affected = measurements.filter((m) => m.boneLevel_pct >= 15).length
  return affected / measurements.length >= 0.3 ? 'Generalized' : 'Localized'
}
