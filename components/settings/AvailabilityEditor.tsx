'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { upsertStaffAvailability } from '@/lib/actions/staff.actions'
import type { StaffAvailability } from '@/lib/types/staff'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DEFAULT_ROW = { startTime: '09:00', endTime: '17:00', isAvailable: false }

type RowState = {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

function buildInitialRows(availability: StaffAvailability[]): RowState[] {
  return DAYS.map((_, i) => {
    const existing = availability.find((a) => a.dayOfWeek === i)
    return existing
      ? {
          dayOfWeek: i,
          startTime: existing.startTime,
          endTime: existing.endTime,
          isAvailable: existing.isAvailable,
        }
      : { dayOfWeek: i, ...DEFAULT_ROW }
  })
}

export default function AvailabilityEditor({
  userId,
  availability,
}: {
  userId: string
  availability: StaffAvailability[]
}) {
  const [rows, setRows] = useState<RowState[]>(() => buildInitialRows(availability))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDay(index: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isAvailable: !r.isAvailable } : r))
    )
  }

  function updateTime(index: number, field: 'startTime' | 'endTime', value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    )
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await upsertStaffAvailability(userId, rows)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6">
      <h2 className="text-base font-semibold text-[#030213] mb-4">Weekly Availability</h2>

      {error ? (
        <p className="text-sm text-[#d4183d] bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
              row.isAvailable
                ? 'border-[#0D9488] bg-teal-50/30'
                : 'border-[#E4E7EE] bg-[#FAFBFC]'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-12 text-sm font-medium transition-colors ${
                row.isAvailable ? 'text-[#0D9488]' : 'text-[#717182]'
              }`}
            >
              {DAYS[i]}
            </button>

            <div
              className={`flex-1 flex items-center gap-2 transition-opacity ${
                row.isAvailable ? 'opacity-100' : 'opacity-40 pointer-events-none'
              }`}
            >
              <input
                type="time"
                value={row.startTime}
                onChange={(e) => updateTime(i, 'startTime', e.target.value)}
                className="border border-[#E4E7EE] rounded-md px-2 py-1 text-sm text-[#030213]"
              />
              <span className="text-[#717182] text-sm">to</span>
              <input
                type="time"
                value={row.endTime}
                onChange={(e) => updateTime(i, 'endTime', e.target.value)}
                className="border border-[#E4E7EE] rounded-md px-2 py-1 text-sm text-[#030213]"
              />
            </div>

            <div
              className={`w-2 h-2 rounded-full ${
                row.isAvailable ? 'bg-[#0D9488]' : 'bg-[#E4E7EE]'
              }`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        {saved ? (
          <p className="text-sm text-[#0D9488]">Availability saved.</p>
        ) : null}
        <div className="ml-auto">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#0D9488] hover:bg-[#0B7C71] text-white"
          >
            {isPending ? 'Saving…' : 'Save Availability'}
          </Button>
        </div>
      </div>
    </div>
  )
}
