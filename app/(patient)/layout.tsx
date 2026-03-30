import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/patient/login')
  if (session.role !== 'patient') redirect('/dashboard')
  return <>{children}</>
}
