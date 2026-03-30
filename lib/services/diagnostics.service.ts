import Anthropic from '@anthropic-ai/sdk'
import type { ChartWithTeeth, ToothData } from '@/lib/types/charting'
import type { DiagnosisFindings } from '@/lib/types/diagnosis'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function maxPD(tooth: ToothData): number {
  const vals = [tooth.pdDb, tooth.pdB, tooth.pdMb, tooth.pdDl, tooth.pdL, tooth.pdMl]
  return Math.max(...vals.filter((v): v is number => v !== null), 0)
}

function bopSites(tooth: ToothData): number {
  return [tooth.bopDb, tooth.bopB, tooth.bopMb, tooth.bopDl, tooth.bopL, tooth.bopMl]
    .filter(Boolean).length
}

function buildPrompt(chart: ChartWithTeeth): string {
  const teeth = chart.teeth.filter((t) => !t.missing)
  const totalSites = teeth.length * 6
  const bopTotal = teeth.reduce((sum, t) => sum + bopSites(t), 0)
  const bopPct = totalSites > 0 ? Math.round((bopTotal / totalSites) * 100) : 0
  const maxPDs = teeth.map(maxPD).filter((v) => v > 0)
  const meanMaxPD = maxPDs.length > 0
    ? Math.round((maxPDs.reduce((a, b) => a + b, 0) / maxPDs.length) * 10) / 10
    : 0
  const teethWithPD4Plus = teeth.filter((t) => maxPD(t) >= 4).length
  const teethWithPD6Plus = teeth.filter((t) => maxPD(t) >= 6).length

  const toothSummary = teeth
    .filter((t) => maxPD(t) > 0)
    .map((t) => `Tooth ${t.toothNumber}: max PD ${maxPD(t)}mm, BOP ${bopSites(t)}/6, furcation ${t.furcation}, mobility ${t.mobility}`)
    .join('\n')

  return `You are a periodontal AI assistant. Analyze the following periodontal chart data and provide a structured clinical assessment using the AAP/EFP 2017 classification system.

CHART DATA:
Date: ${chart.chartDate}
Total teeth examined: ${teeth.length}
BOP%: ${bopPct}%
Mean max PD: ${meanMaxPD}mm
Teeth with PD ≥4mm: ${teethWithPD4Plus}
Teeth with PD ≥6mm: ${teethWithPD6Plus}

TOOTH DETAILS:
${toothSummary || 'No pocket depth data recorded.'}

Please provide your assessment in the following JSON format (no markdown, pure JSON):
{
  "stage": "Stage I|II|III|IV",
  "grade": "Grade A|B|C",
  "extent": "Localized|Generalized|Molar-Incisor Pattern",
  "findings": {
    "maxBoneLossPct": <number or null>,
    "affectedTeethCount": <number>,
    "meanMaxPD": ${meanMaxPD},
    "bopPercent": ${bopPct},
    "riskFactors": ["<factor1>", ...],
    "recommendations": ["<rec1>", ...],
    "treatmentPriority": "low|medium|high|urgent"
  },
  "clinicalSummary": "<2-3 sentence summary>"
}`
}

export interface DiagnosticsResult {
  stage: string
  grade: string
  extent: string
  findings: DiagnosisFindings
  rawResponse: string
  modelUsed: string
}

export async function generateAIDiagnosis(chart: ChartWithTeeth): Promise<DiagnosticsResult> {
  const prompt = buildPrompt(chart)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawResponse = message.content[0].type === 'text' ? message.content[0].text : ''

  // Parse JSON from response — handle potential markdown wrapping
  let parsed: any
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse)
  } catch {
    // Fallback if AI doesn't return valid JSON
    parsed = {
      stage: 'Stage II',
      grade: 'Grade B',
      extent: 'Generalized',
      findings: {
        maxBoneLossPct: null,
        affectedTeethCount: chart.teeth.filter((t) => !t.missing).length,
        meanMaxPD: 0,
        bopPercent: 0,
        riskFactors: ['Unable to parse AI response'],
        recommendations: ['Manual clinical review recommended'],
        treatmentPriority: 'medium',
      },
      clinicalSummary: rawResponse.slice(0, 200),
    }
  }

  return {
    stage: parsed.stage ?? 'Stage II',
    grade: parsed.grade ?? 'Grade B',
    extent: parsed.extent ?? 'Generalized',
    findings: {
      maxBoneLossPct: parsed.findings?.maxBoneLossPct ?? null,
      affectedTeethCount: parsed.findings?.affectedTeethCount ?? 0,
      meanMaxPD: parsed.findings?.meanMaxPD ?? 0,
      bopPercent: parsed.findings?.bopPercent ?? 0,
      riskFactors: parsed.findings?.riskFactors ?? [],
      recommendations: parsed.findings?.recommendations ?? [],
      treatmentPriority: parsed.findings?.treatmentPriority ?? 'medium',
    },
    rawResponse,
    modelUsed: 'claude-sonnet-4-6',
  }
}
