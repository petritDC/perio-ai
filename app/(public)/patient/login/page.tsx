'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Stethoscope } from 'lucide-react'

export default function PatientLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) { setError(error.message); setLoading(false); return }

    const role = auth.user?.user_metadata?.role
    if (role !== 'patient') {
      setError('This portal is for patients only. Staff should use the clinic login.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }
    router.push('/patient/portal')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[18px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sora)' }}>PerioAI</div>
            <div className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">Patient Portal</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h1 className="text-[22px] font-semibold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-[14px] text-slate-500 mb-6">Sign in to access your patient portal</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[12px] text-slate-600 font-medium">Email</Label>
              <Input id="email" type="email" {...register('email')} className="mt-1" placeholder="you@example.com" />
              {errors.email && <p className="text-[12px] text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-[12px] text-slate-600 font-medium">Password</Label>
              <Input id="password" type="password" {...register('password')} className="mt-1" />
              {errors.password && <p className="text-[12px] text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 h-10 text-[13px] font-semibold" style={{ fontFamily: 'var(--font-sora)' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-[13px] text-slate-500 mt-4">
            New patient?{' '}
            <Link href="/patient/register" className="text-teal-600 hover:text-teal-700 font-medium">
              Complete intake form →
            </Link>
          </p>
          <p className="text-center text-[13px] text-slate-400 mt-2">
            <Link href="/" className="hover:text-slate-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
