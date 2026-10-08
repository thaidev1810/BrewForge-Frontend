import { BookOpen, Building2, ShieldCheck } from 'lucide-react'
import { PageHeader } from './PageHeader'
import { StatCard } from './StatCard'
import { StatusBadge } from './StatusBadge'
import { roleConfig } from '@/constants/roles'
import type { Role } from '@/features/auth/authTypes'
export function RoleDashboard({ role }: { role: Role }) {
  const config = roleConfig[role]
  return <><PageHeader title={`${config.label} dashboard`} description={config.description} action={<StatusBadge>Workspace preview</StatusBadge>} /><div className="grid gap-4 sm:grid-cols-3"><StatCard title="Training activity" value="—" description="Courses will appear here." icon={BookOpen} /><StatCard title="Branch overview" value="—" description="Branch data is not connected yet." icon={Building2} /><StatCard title="Quality & standards" value="—" description="SOP and assessment data coming soon." icon={ShieldCheck} /></div><section className="mt-8 rounded-xl border bg-card p-6"><h2 className="text-lg font-semibold">Ready for your next chapter</h2><p className="mt-2 text-muted-foreground">Your {config.label.toLowerCase()} workspace is ready. Business features will be added here as BrewForge grows.</p></section></>
}
