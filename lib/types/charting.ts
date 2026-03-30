export type ChartStatus = 'draft' | 'finalized'

export interface ToothData {
  id?: string
  chartId: string
  toothNumber: number       // FDI: 11-18, 21-28, 31-38, 41-48
  // Pocket depths (6 sites)
  pdDb: number | null; pdB: number | null; pdMb: number | null
  pdDl: number | null; pdL: number | null; pdMl: number | null
  // Recession (6 sites)
  recDb: number | null; recB: number | null; recMb: number | null
  recDl: number | null; recL: number | null; recMl: number | null
  // Bleeding on probing (6 sites)
  bopDb: boolean; bopB: boolean; bopMb: boolean
  bopDl: boolean; bopL: boolean; bopMl: boolean
  furcation: number       // 0-3
  mobility: number        // 0-3
  implant: boolean
  missing: boolean
  notes: string | null
}

export interface PeriodontalChart {
  id: string
  patientId: string
  providerId: string
  chartDate: string       // YYYY-MM-DD
  status: ChartStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ChartWithTeeth extends PeriodontalChart {
  teeth: ToothData[]
}

export interface ChartListItem {
  id: string
  chartDate: string
  status: ChartStatus
  providerName: string | null
  toothCount: number
}

// FDI tooth numbers organized by quadrant
export const FDI_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft:  [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft:  [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
}

export const ALL_FDI_TEETH: number[] = [
  ...FDI_TEETH.upperRight,
  ...FDI_TEETH.upperLeft,
  ...FDI_TEETH.lowerLeft,
  ...FDI_TEETH.lowerRight,
]
