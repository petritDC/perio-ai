interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  accent?: boolean
  href?: string
}

export default function StatCard({ label, value, sub, accent, href }: StatCardProps) {
  const inner = (
    <div
      className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
        accent
          ? 'bg-[#0D9488] border-transparent text-white'
          : 'bg-white border-[#E4E7EE] text-[#030213]'
      }`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${accent ? 'text-teal-100' : 'text-[#717182]'}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold font-[family-name:var(--font-sora)] ${accent ? 'text-white' : 'text-[#030213]'}`}>
        {value}
      </p>
      {sub ? (
        <p className={`text-xs mt-1 ${accent ? 'text-teal-100' : 'text-[#717182]'}`}>{sub}</p>
      ) : null}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {inner}
      </a>
    )
  }
  return inner
}
