import { matchPath } from 'react-router-dom'
import { dashboardPath, roleConfig } from '@/constants/roles'
import { resources, reportPages } from '@/features/workspace/resources'
import { canCall } from '@/services/backend/operations'
import type { Operation } from '@/services/backend/contracts'
import type { Role } from './authTypes'

export function authDestination(value: unknown, role: Role): string {
  const fallback = dashboardPath(role), prefix = roleConfig[role].prefix
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || (value.includes('\\') || [...value].some(c => c.charCodeAt(0) < 32)) || /%2f|%5c/i.test(value)) return fallback
  let url: URL
  try { url = new URL(value, 'https://workspace.invalid'); decodeURIComponent(url.pathname) } catch { return fallback }
  if (url.origin !== 'https://workspace.invalid') return fallback
  const paths = ['dashboard', 'account', 'notifications', 'push']
  for (const r of resources) if (canCall(r.list, role)) { paths.push(r.key); if (r.detail && canCall(r.detail, role)) paths.push(r.key + '/:id') }
  for (const page of reportPages) if (canCall(page.operation, role)) paths.push(page.key)
  const optional: [Operation, string[]][] = [
    ['RecipeVersions.Get', ['versions/:id']], ['Enrollments.Mine', ['learning/:id/quiz', 'learning/:id/results']],
    ['Certificates.Get', ['certificates/:id']], ['Enrollments.PracticalVideoContent', ['videos/:id']], ['Sales.ImportResult', ['sales/import/:jobId']],
    ['Sales.Aggregate', ['sales-analytics']], ['ImpactAnalysis.Analyze', ['impact', 'impact/:runId']],
    ['AuditLog.Trace', ['trace', 'trace/:entityType/:id']], ['Reports.Compliance', ['compliance']],
    ['LearningPath.Mine', ['learning-path']], ['LearningPath.Get', ['learning-path']], ['Courses.Approve', ['courses/pending']],
  ]
  for (const [operation, allowed] of optional) if (canCall(operation, role)) paths.push(...allowed)
  if (role === 'TRAINER') paths.push('assessment/:id')
  // A dynamic course ID must not accidentally grant a reserved review route.
  if (url.pathname.replace(/\/+$/, '') === prefix + '/courses/pending' && !canCall('Courses.Approve', role)) return fallback
  const allowed = url.pathname === prefix || paths.some(path => matchPath({ path: prefix + '/' + path, end: true }, url.pathname))
  return allowed ? url.pathname + url.search + url.hash : fallback
}
