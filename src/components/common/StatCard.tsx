import type { LucideIcon } from 'lucide-react'

export function StatCard({ title, value, description, icon: Icon }: { title: string; value: string | number; description?: string; icon: LucideIcon }) {
  const numeric = typeof value === 'number' && Number.isFinite(value)
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow plain">{title}</p>
        <span className="stat-chip"><Icon className="size-4" aria-hidden="true" /></span>
      </div>
      <p className="stat-value">{numeric ? value.toLocaleString() : value}</p>
      {description && <p className="stat-desc">{description}</p>}
    </div>
  )
}
