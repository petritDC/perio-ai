'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createChart } from '@/lib/actions/charting.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProviderOption {
  id: string
  label: string
}

export default function NewChartForm({
  patientId,
  providers,
  defaultProviderId,
}: {
  patientId: string
  providers: ProviderOption[]
  defaultProviderId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set('patientId', patientId)

    if (!formData.get('providerId') && defaultProviderId) {
      formData.set('providerId', defaultProviderId)
    }

    startTransition(async () => {
      try {
        const result = await createChart(formData)

        if (result?.error) {
          setError(result.error)
          return
        }

        if (result?.success && result.id) {
          router.push(`/charting/${result.id}`)
          router.refresh()
          return
        }

        setError('Could not create chart. Please try again.')
      } catch {
        setError('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      <input type="hidden" name="patientId" value={patientId} />

      <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
        {error ? (
          <p className="text-sm text-[#d4183d] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="chartDate">Chart Date</Label>
          <Input
            id="chartDate"
            name="chartDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Provider</Label>
          <Select name="providerId" defaultValue={defaultProviderId}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.length === 0 ? (
                <SelectItem value="">No provider available</SelectItem>
              ) : null}
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!defaultProviderId && providers.length === 0 ? (
            <p className="text-xs text-[#717182]">
              Add an active dentist, hygienist, or admin before creating a chart.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Optional session notes" />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending || (!defaultProviderId && providers.length === 0)}
        className="bg-[#0D9488] hover:bg-[#0B7C71] text-white"
      >
        {isPending ? 'Creating…' : 'Create Chart'}
      </Button>
    </form>
  )
}
