import type { LucideIcon } from 'lucide-react'
export function StatCard({ title, value, description, icon: Icon }: { title: string; value: string | number; description?: string; icon: LucideIcon }) {
  return <div className="rounded-xl border bg-card p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{title}</p><Icon className="size-5 text-caramel" aria-hidden="true" /></div><p className="mt-4 text-3xl font-semibold">{value}</p>{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}</div>
}
