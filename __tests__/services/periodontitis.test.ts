import { describe, it, expect } from 'vitest'
import { determineStage, determineGrade, determineExtent } from '@/lib/services/periodontitis.service'

describe('determineStage', () => {
  it('returns Stage I for bone loss < 15%', () => {
    expect(determineStage(10)).toBe('Stage I')
  })
  it('returns Stage II for bone loss 15-33%', () => {
    expect(determineStage(22)).toBe('Stage II')
    expect(determineStage(33)).toBe('Stage II')
  })
  it('returns Stage III for bone loss > 33%', () => {
    expect(determineStage(50)).toBe('Stage III')
  })
})

describe('determineGrade', () => {
  it('returns Grade A for non-smoker without diabetes', () => {
    const { grade } = determineGrade({ smokingStatus: 'non_smoker', cigarettesPerDay: 0, diabetesDiagnosed: false, hba1c: null })
    expect(grade).toBe('Grade A')
  })
  it('returns Grade C for current smoker >= 10/day', () => {
    const { grade } = determineGrade({ smokingStatus: 'current_smoker', cigarettesPerDay: 15, diabetesDiagnosed: false, hba1c: null })
    expect(grade).toBe('Grade C')
  })
  it('returns Grade C for uncontrolled diabetes (HbA1c >= 7)', () => {
    const { grade } = determineGrade({ smokingStatus: 'non_smoker', cigarettesPerDay: 0, diabetesDiagnosed: true, hba1c: 7.4 })
    expect(grade).toBe('Grade C')
  })
  it('returns Grade B for controlled diabetes (HbA1c < 7)', () => {
    const { grade } = determineGrade({ smokingStatus: 'non_smoker', cigarettesPerDay: 0, diabetesDiagnosed: true, hba1c: 6.5 })
    expect(grade).toBe('Grade B')
  })
  it('returns Grade B for light smoker < 10/day', () => {
    const { grade } = determineGrade({ smokingStatus: 'current_smoker', cigarettesPerDay: 8, diabetesDiagnosed: false, hba1c: null })
    expect(grade).toBe('Grade B')
  })
})

describe('determineExtent', () => {
  it('returns Generalized when >= 30% of measurements affected', () => {
    const measurements = [
      { tooth: 11, boneLevel_mm: 3, boneLevel_pct: 20 },
      { tooth: 21, boneLevel_mm: 3, boneLevel_pct: 20 },
      { tooth: 31, boneLevel_mm: 1, boneLevel_pct: 8 },
    ]
    expect(determineExtent(measurements)).toBe('Generalized')
  })
  it('returns Localized when < 30% affected', () => {
    const measurements = [
      { tooth: 11, boneLevel_mm: 3, boneLevel_pct: 20 },
      { tooth: 21, boneLevel_mm: 1, boneLevel_pct: 5 },
      { tooth: 31, boneLevel_mm: 1, boneLevel_pct: 5 },
      { tooth: 41, boneLevel_mm: 1, boneLevel_pct: 5 },
    ]
    expect(determineExtent(measurements)).toBe('Localized')
  })
})
