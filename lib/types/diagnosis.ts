export interface DiagnosisFindings {
  maxBoneLossPct: number | null
  affectedTeethCount: number
  meanMaxPD: number
  bopPercent: number
  riskFactors: string[]
  recommendations: string[]
  treatmentPriority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface AIDiagnosis {
  id: string
  chartId: string
  patientId: string
  generatedBy: string | null
  stage: string | null       // Stage I, II, III, IV
  grade: string | null       // Grade A, B, C
  extent: string | null      // Localized, Generalized, Molar-Incisor Pattern
  findings: DiagnosisFindings
  rawResponse: string | null
  modelUsed: string | null
  createdAt: string
}
