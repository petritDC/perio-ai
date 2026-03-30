'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertTooth } from '@/lib/actions/charting.actions'
import type { ToothData } from '@/lib/types/charting'

const SITES = ['DB', 'B', 'MB', 'DL', 'L', 'ML'] as const
type Site = (typeof SITES)[number]

function siteKey(prefix: string, site: Site): keyof ToothData {
  const map: Record<string, keyof ToothData> = {
    'pd_DB': 'pdDb', 'pd_B': 'pdB', 'pd_MB': 'pdMb',
    'pd_DL': 'pdDl', 'pd_L': 'pdL', 'pd_ML': 'pdMl',
    'rec_DB': 'recDb', 'rec_B': 'recB', 'rec_MB': 'recMb',
    'rec_DL': 'recDl', 'rec_L': 'recL', 'rec_ML': 'recMl',
    'bop_DB': 'bopDb', 'bop_B': 'bopB', 'bop_MB': 'bopMb',
    'bop_DL': 'bopDl', 'bop_L': 'bopL', 'bop_ML': 'bopMl',
  }
  return map[`${prefix}_${site}`]
}

function emptyTooth(chartId: string, toothNumber: number): ToothData {
  return {
    chartId, toothNumber,
    pdDb: null, pdB: null, pdMb: null, pdDl: null, pdL: null, pdMl: null,
    recDb: null, recB: null, recMb: null, recDl: null, recL: null, recMl: null,
    bopDb: false, bopB: false, bopMb: false, bopDl: false, bopL: false, bopMl: false,
    furcation: 0, mobility: 0, implant: false, missing: false, notes: null,
  }
}

export default function ToothPanel({
  chartId,
  toothNumber,
  existing,
  readOnly = false,
}: {
  chartId: string
  toothNumber: number
  existing?: ToothData
  readOnly?: boolean
}) {
  const [data, setData] = useState<ToothData>(() => existing ?? emptyTooth(chartId, toothNumber))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setDepth(prefix: 'pd' | 'rec', site: Site, val: string) {
    const key = siteKey(prefix, site)
    setData((prev) => ({ ...prev, [key]: val === '' ? null : Number(val) }))
  }

  function toggleBop(site: Site) {
    const key = siteKey('bop', site)
    setData((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const result = await upsertTooth(data)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-4">
      <h3 className="text-sm font-semibold text-[#030213] mb-3">Tooth {toothNumber}</h3>

      {error ? (
        <p className="text-xs text-[#d4183d] mb-2">{error}</p>
      ) : null}

      {/* Pocket depth row */}
      <div className="mb-3">
        <p className="text-xs text-[#717182] mb-1 font-medium">Pocket Depth (mm)</p>
        <div className="grid grid-cols-6 gap-1">
          {SITES.map((site) => (
            <div key={site} className="text-center">
              <div className="text-[9px] text-[#717182] mb-0.5">{site}</div>
              <Input
                type="number"
                min={0}
                max={20}
                disabled={readOnly}
                value={(data[siteKey('pd', site)] as number | null) ?? ''}
                onChange={(e) => setDepth('pd', site, e.target.value)}
                className="h-7 text-xs text-center px-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Recession row */}
      <div className="mb-3">
        <p className="text-xs text-[#717182] mb-1 font-medium">Recession (mm)</p>
        <div className="grid grid-cols-6 gap-1">
          {SITES.map((site) => (
            <div key={site} className="text-center">
              <Input
                type="number"
                min={0}
                max={15}
                disabled={readOnly}
                value={(data[siteKey('rec', site)] as number | null) ?? ''}
                onChange={(e) => setDepth('rec', site, e.target.value)}
                className="h-7 text-xs text-center px-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* BOP row */}
      <div className="mb-3">
        <p className="text-xs text-[#717182] mb-1 font-medium">Bleeding on Probing</p>
        <div className="grid grid-cols-6 gap-1">
          {SITES.map((site) => (
            <div key={site} className="text-center">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => toggleBop(site)}
                className={`w-full h-7 rounded text-xs font-medium transition-colors ${
                  data[siteKey('bop', site)]
                    ? 'bg-red-400 text-white'
                    : 'bg-[#F3F4F6] text-[#717182]'
                }`}
              >
                {data[siteKey('bop', site)] ? '●' : '○'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Furcation, mobility, flags */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
        <div>
          <Label className="text-[10px]">Furcation</Label>
          <Input
            type="number" min={0} max={3} disabled={readOnly}
            value={data.furcation}
            onChange={(e) => setData((p) => ({ ...p, furcation: Number(e.target.value) }))}
            className="h-7 text-xs text-center"
          />
        </div>
        <div>
          <Label className="text-[10px]">Mobility</Label>
          <Input
            type="number" min={0} max={3} disabled={readOnly}
            value={data.mobility}
            onChange={(e) => setData((p) => ({ ...p, mobility: Number(e.target.value) }))}
            className="h-7 text-xs text-center"
          />
        </div>
        <div className="flex flex-col items-center justify-end gap-1">
          <Label className="text-[10px]">Implant</Label>
          <button
            type="button"
            disabled={readOnly}
            onClick={() => setData((p) => ({ ...p, implant: !p.implant }))}
            className={`px-2 py-1 rounded text-[10px] font-medium ${data.implant ? 'bg-blue-100 text-blue-700' : 'bg-[#F3F4F6] text-[#717182]'}`}
          >
            {data.implant ? 'Yes' : 'No'}
          </button>
        </div>
        <div className="flex flex-col items-center justify-end gap-1">
          <Label className="text-[10px]">Missing</Label>
          <button
            type="button"
            disabled={readOnly}
            onClick={() => setData((p) => ({ ...p, missing: !p.missing }))}
            className={`px-2 py-1 rounded text-[10px] font-medium ${data.missing ? 'bg-gray-200 text-gray-600' : 'bg-[#F3F4F6] text-[#717182]'}`}
          >
            {data.missing ? 'Yes' : 'No'}
          </button>
        </div>
      </div>

      {!readOnly ? (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#0D9488] hover:bg-[#0B7C71] text-white text-xs"
          >
            {isPending ? 'Saving…' : 'Save Tooth'}
          </Button>
          {saved ? <span className="text-xs text-[#0D9488]">Saved</span> : null}
        </div>
      ) : null}
    </div>
  )
}
