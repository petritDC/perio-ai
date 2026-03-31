export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Page heading skeleton */}
      <div className="h-7 w-48 rounded-lg bg-slate-200" />

      {/* Card skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-slate-100 p-5 space-y-3"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div
        className="rounded-2xl bg-white border border-slate-100 p-5 space-y-3"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-slate-100" style={{ width: `${75 + (i % 3) * 8}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
