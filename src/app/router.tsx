import { createBrowserRouter, Navigate } from 'react-router-dom'
import { NotFound, RouteError, LoginPage, LandingPage } from '@/components/common/RoutePages'
import { ROLES } from '@/features/auth/authTypes'
import { PublicRoute } from '@/features/auth/PublicRoute'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RoleBasedRoute } from '@/features/auth/RoleBasedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RoleDashboard } from '@/components/common/RoleDashboard'
import { roleConfig } from '@/constants/roles'
import { canCall } from '@/services/backend/operations'
import { resources, reportPages } from '@/features/workspace/resources'
import { ResourcePage, VersionPage, ReportPage, ImpactPage, TracePage, CompliancePage, SalesAnalyticsPage, AccountPage, PushPage, LearningPage, AssessmentPage, RecordPage, VideoPage, ImportResultPage, LearningPathPage, InboxPage, EnrollmentReviewPage } from '@/components/common/WorkspacePages'
export const router = createBrowserRouter([{ errorElement: <RouteError />, children: [
  { path: '/', element: <LandingPage /> },
  { element: <PublicRoute />, children: [{ path: '/login', element: <LoginPage /> }] },
  { element: <ProtectedRoute />, children: ROLES.map(role => ({ path: roleConfig[role].prefix, element: <RoleBasedRoute allowedRoles={[role]} />, children: [{ element: <DashboardLayout />, children: [
    { index: true, element: <Navigate to="dashboard" replace /> }, { path: 'dashboard', element: <RoleDashboard role={role} /> },
    ...resources.filter(r => canCall(r.list, role)).flatMap(r => [
      { path: r.key, element: <ResourcePage key={r.key} resource={r.key} /> },
      ...(r.detail && canCall(r.detail, role) ? [{ path: r.key + '/:id', element: r.key === 'learning' ? <LearningPage /> : <ResourcePage key={r.key} resource={r.key} /> }] : []),
    ]),
    ...reportPages.filter(p => canCall(p.operation, role)).map(p => ({ path: p.key, element: <ReportPage page={p.key} /> })),
    ...(canCall('RecipeVersions.Get', role) ? [{ path: 'versions/:id', element: <VersionPage /> }] : []),
    ...(canCall('Enrollments.Mine', role) ? [{ path: 'learning/:id/quiz', element: <LearningPage /> }, { path: 'learning/:id/results', element: <LearningPage /> }] : []),
    ...(['TRAINING_MANAGER','BRANCH_MANAGER'].includes(role)&&canCall('Enrollments.Get',role)?[{path:'enrollments/:id',element:<EnrollmentReviewPage/>}]:[]),
    ...(role === 'TRAINER' ? [{ path: 'assessment/:id', element: <AssessmentPage /> }] : []),
    ...(canCall('Pilots.Get', role) && !canCall('Pilots.List', role) ? [{ path: 'pilots/:id', element: <RecordPage operation="Pilots.Get" title="Thử nghiệm của chi nhánh" /> }] : []),
    ...(canCall('Certificates.Get', role) && !canCall('Certificates.Mine', role) ? [{ path: 'certificates/:id', element: <RecordPage operation="Certificates.Get" title="Chi tiết chứng chỉ" /> }] : []),
    ...(canCall('Enrollments.PracticalVideoContent', role) ? [{ path: 'videos/:id', element: <VideoPage /> }] : []),
    ...(canCall('Sales.ImportResult', role) ? [{ path: 'sales/import/:jobId', element: <ImportResultPage /> }] : []),
    ...(canCall('Sales.Aggregate', role) ? [{ path: 'sales-analytics', element: <SalesAnalyticsPage /> }] : []),
    ...(canCall('ImpactAnalysis.Analyze', role) ? [{ path: 'impact', element: <ImpactPage /> }, { path: 'impact/:runId', element: <ImpactPage /> }] : []),
    ...(canCall('AuditLog.Trace', role) ? [{ path: 'trace', element: <TracePage /> }, { path: 'trace/:entityType/:id', element: <TracePage /> }] : []),
    ...(canCall('Reports.Compliance', role) ? [{ path: 'compliance', element: <CompliancePage /> }] : []),
    ...(canCall('LearningPath.Mine', role) || canCall('LearningPath.Get', role) ? [{ path: 'learning-path', element: <LearningPathPage /> }] : []),
    ...(canCall('Courses.Approve', role) ? [{ path: 'courses/pending', element: <ResourcePage key="courses-pending" resource="courses" initialFilters={{ state: 'PENDING_APPROVAL' }} /> }] : canCall('Courses.List',role)?[{path:'courses/pending',element:<Navigate to={roleConfig[role].prefix+'/dashboard'} replace/>}]:[]),
    { path: 'notifications', element: <InboxPage /> },
    { path: 'account', element: <AccountPage /> }, { path: 'push', element: <PushPage /> },
  ] }] })) },
  { path: '*', element: <NotFound /> },
] }])
