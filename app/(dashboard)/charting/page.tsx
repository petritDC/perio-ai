import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ChartingIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <h1 className="text-2xl font-semibold font-[family-name:var(--font-sora)] text-[#030213]">
        Periodontal Charting
      </h1>
      <p className="text-[#717182] text-sm">Open a patient profile to start or view a chart.</p>
      <Button asChild variant="outline">
        <Link href="/patients">Go to Patients</Link>
      </Button>
    </div>
  )
}
