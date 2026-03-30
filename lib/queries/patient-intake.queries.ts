import { createClient } from '@/lib/supabase/server'

export async function hasSubmittedIntake(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('patient_intake_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return (count ?? 0) > 0
}

export async function getPatientIntake(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('patient_intake_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single()
  return data
}
