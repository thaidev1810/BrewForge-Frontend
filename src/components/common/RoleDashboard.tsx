import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Boxes,
  Building2,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { isDemoMode, isMockServicesMode } from '@/constants/config'
import { roleConfig } from '@/constants/roles'
import type { Role } from '@/features/auth/authTypes'
import { brewforgeApi } from '@/services/brewforgeApi'
import { normalizeApiError } from '@/services/apiError'
import { StatCard } from './StatCard'
import { StatusBadge } from './StatusBadge'


type Stat = { title: string; value: string | number; description?: string; icon: typeof BookOpen }

export function RoleDashboard({ role }: { role: Role }) {
  const config = roleConfig[role]
  const user = useAppSelector((state) => state.auth.user)
  const [stats, setStats] = useState<Stat[]>(() =>
    isDemoMode || isMockServicesMode
      ? [{ title: 'Workspace mode', value: 'Mock', description: 'Switch VITE_ENABLE_MOCK_AUTH=false for live data', icon: Activity }]
      : [],
  )
  const [loading, setLoading] = useState(() => !(isDemoMode || isMockServicesMode))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemoMode || isMockServicesMode) return
    let active = true

    const run = async (): Promise<Stat[]> => {
      if (role === 'ADMIN') {
        const [users, branches, ingredients, equipment] = await Promise.all([
          brewforgeApi.users.list({ page: 1, size: 1 }),
          brewforgeApi.branches.list({ page: 1, size: 1 }),
          brewforgeApi.ingredients.list({ page: 1, size: 1 }),
          brewforgeApi.equipment.list({ page: 1, size: 1 }),
        ])
        return [
          { title: 'Users', value: users.total, description: 'Registered accounts across 8 roles', icon: Users },
          { title: 'Branches', value: branches.total, description: 'Store locations', icon: Building2 },
          { title: 'Ingredients', value: ingredients.total, description: 'Master ingredient catalog', icon: Boxes },
          { title: 'Equipment Classes', value: equipment.total, description: 'Standardized dosing bounds', icon: ShieldCheck },
        ]
      }
      if (role === 'RD_SPECIALIST') {
        const [products, recipes, activeRecipes] = await Promise.all([
          brewforgeApi.products.list({ page: 1, size: 1 }),
          brewforgeApi.recipes.list({ page: 1, size: 1 }),
          brewforgeApi.recipes.list({ page: 1, size: 1, status: 'ACTIVE' }),
        ])
        return [
          { title: 'Products', value: products.total, description: 'Drink catalog items', icon: ShoppingBag },
          { title: 'Total Recipes', value: recipes.total, description: 'NEW & EXISTING recipes', icon: FlaskConical },
          { title: 'Active Recipes', value: activeRecipes.total, description: 'Available for versioning', icon: ShieldCheck },
        ]
      }
      if (role === 'RD_MANAGER') {
        const [recipes, pilots, launches, auditSummary] = await Promise.all([
          brewforgeApi.recipes.list({ page: 1, size: 1 }),
          brewforgeApi.pilots.list({ page: 1, size: 1 }),
          brewforgeApi.pilots.listBranchLaunchStatus(),
          brewforgeApi.quality.summary(),
        ])
        const liveCount = launches.filter((l) => l.status === 'LIVE').length
        return [
          { title: 'Recipes', value: recipes.total, description: 'Review & release pipeline', icon: FlaskConical },
          { title: 'Pilot Programs', value: pilots.total, description: 'Controlled branch trials', icon: Store },
          { title: 'Live Branch Drinks', value: liveCount, description: 'Active branch-recipe launches', icon: Building2 },
          { title: 'Audits (Period)', value: auditSummary.audits, description: `${auditSummary.passed} passed / ${auditSummary.failed} failed`, icon: ShieldCheck },
        ]
      }
      if (role === 'TRAINER') {
        const [courses, assignments, schedules, needs] = await Promise.all([
          brewforgeApi.courses.list({ page: 1, size: 1 }),
          brewforgeApi.assignments.list({ page: 1, size: 1 }),
          brewforgeApi.practicalSchedules.list({ page: 1, size: 1, status: 'SCHEDULED' }),
          brewforgeApi.trainingNeeds.list(),
        ])
        return [
          { title: 'Courses', value: courses.total, description: '7-module training courses', icon: BookOpen },
          { title: 'Enrollments', value: assignments.total, description: 'Active & historical assignments', icon: Users },
          { title: 'Scheduled Practicals', value: schedules.total, description: 'Upcoming practical sessions', icon: ClipboardCheck },
          { title: 'Training Needs', value: needs.length, description: 'Unfulfilled mandatory/recert needs', icon: AlertTriangle },
        ]
      }
      if (role === 'TRAINING_MANAGER') {
        const [pending, published, regulations, needs] = await Promise.all([
          brewforgeApi.courses.list({ page: 1, size: 1, state: 'PENDING_APPROVAL' }),
          brewforgeApi.courses.list({ page: 1, size: 1, state: 'PUBLISHED' }),
          brewforgeApi.regulations.list(),
          brewforgeApi.trainingNeeds.list(),
        ])
        return [
          { title: 'Pending Approvals', value: pending.total, description: 'Courses awaiting sign-off', icon: ShieldCheck },
          { title: 'Published Courses', value: published.total, description: 'Live training catalog', icon: BookOpen },
          { title: 'Regulations', value: regulations.length, description: 'Active governance rules', icon: Gauge },
          { title: 'Open Training Needs', value: needs.length, description: 'Staff needing assignment', icon: AlertTriangle },
        ]
      }
      if (role === 'QUALITY_AUDITOR') {
        const [summary, openCa] = await Promise.all([
          brewforgeApi.quality.summary(),
          brewforgeApi.quality.listCorrectiveActions({ page: 1, size: 1, status: 'OPEN' }),
        ])
        return [
          { title: 'Audits (Month)', value: summary.audits, description: `${summary.from} to ${summary.to}`, icon: ShieldCheck },
          { title: 'Passed Audits', value: summary.passed, description: 'Meeting pass mark & criticals', icon: Award },
          { title: 'Failed Audits', value: summary.failed, description: 'Triggered corrective actions', icon: AlertTriangle },
          { title: 'Open Actions', value: openCa.total, description: `${summary.openCorrectiveActions} total unclosed`, icon: ClipboardCheck },
        ]
      }
      if (role === 'BRANCH_MANAGER') {
        const [employees, launches, sales, actions] = await Promise.all([
          brewforgeApi.dashboards.employees(),
          brewforgeApi.pilots.listBranchLaunchStatus(),
          brewforgeApi.sales.list({ page: 1, size: 1 }),
          brewforgeApi.quality.listCorrectiveActions({ page: 1, size: 1 }),
        ])
        const liveDrinks = launches.filter((l) => l.status === 'LIVE').length
        const overdueCount = employees.reduce((acc, e) => acc + e.overdue, 0)
        return [
          { title: 'Branch Employees', value: employees.length, description: `${overdueCount} overdue trainings`, icon: Users },
          { title: 'Live Drinks', value: liveDrinks, description: `${launches.length} tracked launches`, icon: Store },
          { title: 'Sales Records', value: sales.total, description: 'Manual & POS imported days', icon: ShoppingBag },
          { title: 'Corrective Actions', value: actions.total, description: 'Branch quality follow-ups', icon: AlertTriangle },
        ]
      }
      // TRAINEE
      const [enrollments, certificates, skills] = await Promise.all([
        brewforgeApi.enrollments.mine(),
        brewforgeApi.certificates.mine(),
        brewforgeApi.certificates.mySkills(),
      ])
      const activeEnrollments = enrollments.filter((e) => e.state !== 'PASSED' && e.state !== 'CLOSED')
      const validCerts = certificates.filter((c) => c.status === 'VALID')
      const needsRecert = skills.filter((s) => s.status === 'NEEDS_RECERT')
      return [
        { title: 'Active Courses', value: activeEnrollments.length, description: `${enrollments.length} total enrollments`, icon: BookOpen },
        { title: 'Valid Certificates', value: validCerts.length, description: 'Certified right now', icon: Award },
        { title: 'Skills Tracked', value: skills.length, description: `${needsRecert.length} needing recertification`, icon: Gauge },
        { title: 'Overdue Courses', value: enrollments.filter((e) => e.overdue).length, description: 'Past due date', icon: AlertTriangle },
      ]
    }

    run()
      .then((res) => {
        if (active) setStats(res)
      })
      .catch((err) => {
        if (active) setError(normalizeApiError(err).message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [role, user?.id])

  const quickLinks = config.nav.filter((item) => !item.to.endsWith('/dashboard'))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(/\s+/).filter(Boolean).slice(-1)[0] ?? ''

  return (
    <>
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-[clamp(24px,2.4vw,30px)] font-bold leading-tight tracking-[-0.02em]">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{config.description}</p>
        </div>
        <StatusBadge variant={isDemoMode ? 'warning' : 'success'}>{isDemoMode ? 'Mock mode' : 'Connected'}</StatusBadge>
      </section>

      {error && (
        <p role="alert" className="note note-error mb-6">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading live workspace metrics">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[124px] !rounded-[14px]" />)}
        </div>
      ) : (
        <div className="stat-grid mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Go to</h2>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to}>
              <Link className="module-card" to={item.to}>
                <span className="m-ico"><Icon className="size-[18px]" aria-hidden="true" /></span>
                <span className="text-[15px] font-medium">{item.label}</span>
                <ArrowUpRight className="m-arrow size-5" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
