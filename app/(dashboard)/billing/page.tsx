import { CreditCard } from 'lucide-react'

export default function BillingPage() {
  return (
    <div className="p-8 max-w-[800px] mx-auto">
      <h1 className="text-[26px] font-semibold text-slate-900 tracking-tight mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
        Billing
      </h1>
      <p className="text-[13px] text-slate-500 mb-8">Manage invoices, payments, and insurance claims.</p>
      <div className="bg-white rounded-2xl p-16 flex flex-col items-center justify-center text-center" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <CreditCard className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-[15px] font-semibold text-slate-700 mb-1" style={{ fontFamily: 'var(--font-sora)' }}>Coming soon</p>
        <p className="text-[13px] text-slate-400">Billing and invoicing features are under development.</p>
      </div>
    </div>
  )
}
