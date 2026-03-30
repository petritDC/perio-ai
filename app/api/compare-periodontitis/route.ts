import { NextRequest, NextResponse } from 'next/server'
import { determineStage, determineGrade, determineExtent } from '@/lib/services/periodontitis.service'
import type { RiskFactors } from '@/lib/types/patient-intake'
import type { BoneLevelMeasurement } from '@/lib/services/periodontitis.service'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { patientIntake, blData } = body

  const measurements: BoneLevelMeasurement[] = blData?.measurements ?? []
  const riskFactors: RiskFactors = patientIntake?.riskFactors ?? {
    smokingStatus: 'non_smoker',
    cigarettesPerDay: 0,
    diabetesDiagnosed: false,
    hba1c: null,
  }

  const maxBoneLossPct = measurements.length > 0
    ? Math.max(...measurements.map((m) => m.boneLevel_pct))
    : 0

  const stage = determineStage(maxBoneLossPct)
  const { grade, modifiers } = determineGrade(riskFactors)
  const extent = determineExtent(measurements)

  return NextResponse.json({
    result: {
      stage,
      grade,
      extent,
      gradeModifiers: modifiers,
      summary: `${extent} ${stage}, ${grade} Periodontitis`,
      maxBoneLossPct,
    },
  })
}
