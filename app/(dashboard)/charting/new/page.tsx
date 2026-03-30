import { notFound } from 'next/navigation'
import { getStaffMembers } from '@/lib/queries/staff.queries'
import { getSession } from '@/lib/auth/session'
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
import { redirect } from 'next/navigation'

export default async function NewChartPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const { patientId } = await searchParams
  if (!patientId) notFound()

  const [staff, session] = await Promise.all([getStaffMembers(), getSession()])
  const providers = staff.filter((s) => ['dentist', 'hygienist', 'admin'].includes(s.role))

  async function handleCreate(formData: FormData) {
    'use server'
    formData.set('patientId', patientId!)
    const result = await createChart(formData)
    if (result?.success && result.id) {
      redirect(`/charting/${result.id}`)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213] mb-6">
        New Periodontal Chart
      </h1>

      <form action={handleCreate} className="space-y-4 max-w-md">
        <div className="bg-white rounded-xl border border-[#E4E7EE] shadow-[var(--shadow-card)] p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="chartDate">Chart Date</Label>
            <Input
              id="chartDate"
              name="chartDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select name="providerId" defaultValue={session?.id ?? ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName ?? p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional session notes" />
          </div>
        </div>

        <Button type="submit" className="bg-[#0D9488] hover:bg-[#0B7C71] text-white">
          Create Chart
        </Button>
      </form>
    </div>
  )
}
