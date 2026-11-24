import { useAppSelector } from '@/app/hooks'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState, LoadState, Panel } from '@/components/common/Panel'
import { StatCard } from '@/components/common/StatCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Gauge, TriangleAlert, UserCheck, Users } from 'lucide-react'
import { useTrainingData } from '@/hooks/useTrainingData'
import { branchReadiness, type Cell } from './branchReadiness'

const CELL: Record<Cell, { label: string; variant: 'neutral' | 'success' | 'warning' | 'error' }> = {
  CERTIFIED: { label: 'Certified', variant: 'success' }, TRAINING: { label: 'In training', variant: 'warning' },
  OVERDUE: { label: 'Overdue', variant: 'error' }, NOT_STARTED: { label: 'Not started', variant: 'neutral' },
}

export function BranchReadinessPage() {
  const user = useAppSelector((state) => state.auth.user)!
  const data = useTrainingData()
  const readiness = branchReadiness(user.branchId, data.courses, data.assignments, data.facts)

  return (
    <>
      <PageHeader title="Branch readiness" description="Who in your branch is certified on which course, and where the gaps are." />
      <LoadState loading={data.loading} error={data.error} />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Branch readiness" value={`${readiness.percent}%`} description="Certified out of everyone × every course" icon={Gauge} />
        <StatCard title="Employees" value={readiness.rows.length} icon={Users} />
        <StatCard title="Fully certified" value={readiness.fullyCertified} icon={UserCheck} />
        <StatCard title="Overdue" value={readiness.overdue} description="Enrolments past their deadline" icon={TriangleAlert} />
      </div>
      <Panel title="By course" description="Certified staff against everyone in the branch.">
        {readiness.courses.length === 0 ? <EmptyState>No active courses.</EmptyState> : (
          <ul className="divide-y">
            {readiness.courses.map((course) => (
              <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>{course.title}</span>
                <span className="flex items-center gap-3 text-sm">{course.certified} of {readiness.rows.length} certified<StatusBadge variant={course.certified === readiness.rows.length && readiness.rows.length > 0 ? 'success' : course.certified === 0 ? 'error' : 'warning'}>{course.certified === readiness.rows.length && readiness.rows.length > 0 ? 'Ready' : course.certified === 0 ? 'At risk' : 'Partial'}</StatusBadge></span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="By employee">
        {readiness.rows.length === 0 ? <EmptyState>No employees are registered at this branch.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground"><tr><th className="py-2 pr-4 font-medium">Employee</th>{readiness.courses.map((course) => <th key={course.id} className="pr-4 font-medium">{course.title}</th>)}</tr></thead>
              <tbody className="divide-y">
                {readiness.rows.map((row) => (
                  <tr key={row.user.id}><td className="py-3 pr-4">{row.user.name}</td>{readiness.courses.map((course) => <td key={course.id} className="pr-4"><StatusBadge variant={CELL[row.cells[course.id]].variant}>{CELL[row.cells[course.id]].label}</StatusBadge></td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  )
}
