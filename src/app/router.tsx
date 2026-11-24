import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { NotFound, RouteError, LoginPage } from '@/components/common/RoutePages'
import { ROLES, type Role } from '@/features/auth/authTypes'
import { PublicRoute } from '@/features/auth/PublicRoute'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RoleBasedRoute } from '@/features/auth/RoleBasedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RoleDashboard } from '@/components/common/RoleDashboard'
import { roleConfig } from '@/constants/roles'
import {
  LandingPage,
  UsersPage,
  BranchesPage,
  CategoriesPage,
  IngredientsPage,
  EquipmentPage,
  SettingsPage,
  AdminAuditLogsPage,
  ProductsPage,
  RecipesPage,
  RdManagerRecipesPage,
  PilotsPage,
  ImpactAnalysisPage,
  SalesAnalyticsPage,
  ComplianceAndTracePage,
  TrainerCoursesPage,
  QuestionBankPage,
  TrainingClassesPage,
  TrainerAssignmentsPage,
  PracticalAssessmentsPage,
  TrainerLearningPage,
  CourseApprovalsPage,
  TrainingRegulationsPage,
  EnrollmentGovernancePage,
  TrainingEffectivenessPage,
  BranchAuditsPage,
  CorrectiveActionsPage,
  AuditorCompliancePage,
  BranchStaffReadinessPage,
  BranchLaunchesPage,
  BranchSalesPage,
  BranchQualityPage,
  TraineeLearningPage,
  QuizPage,
  CertificatesPage,
  FinanceIntelligencePage,
  SensoryTwinPage,
} from './lazyPages'

// Pages of each role beyond its dashboard. Paths are relative to the role's prefix.
const rolePages: Record<Role, RouteObject[]> = {
  ADMIN: [
    { path: 'users', element: <UsersPage /> },
    { path: 'branches', element: <BranchesPage /> },
    { path: 'categories', element: <CategoriesPage /> },
    { path: 'ingredients', element: <IngredientsPage /> },
    { path: 'equipment', element: <EquipmentPage /> },
    { path: 'settings', element: <SettingsPage /> },
    { path: 'audit-logs', element: <AdminAuditLogsPage /> },
    { path: 'finance-ai', element: <FinanceIntelligencePage /> },
    { path: 'sensory-lab', element: <SensoryTwinPage /> },
  ],
  RD_SPECIALIST: [
    { path: 'products', element: <ProductsPage /> },
    { path: 'recipes', element: <RecipesPage /> },
    { path: 'sensory-lab', element: <SensoryTwinPage /> },
  ],
  RD_MANAGER: [
    { path: 'recipes', element: <RdManagerRecipesPage /> },
    { path: 'pilots', element: <PilotsPage /> },
    { path: 'impact', element: <ImpactAnalysisPage /> },
    { path: 'analytics', element: <SalesAnalyticsPage /> },
    { path: 'finance-ai', element: <FinanceIntelligencePage /> },
    { path: 'sensory-lab', element: <SensoryTwinPage /> },
    { path: 'compliance', element: <ComplianceAndTracePage /> },
  ],
  TRAINER: [
    { path: 'courses', element: <TrainerCoursesPage /> },
    { path: 'question-bank', element: <QuestionBankPage /> },
    { path: 'classes', element: <TrainingClassesPage /> },
    { path: 'assignments', element: <TrainerAssignmentsPage /> },
    { path: 'assessments', element: <PracticalAssessmentsPage /> },
    { path: 'my-learning', element: <TrainerLearningPage /> },
    { path: 'sensory-lab', element: <SensoryTwinPage /> },
  ],
  TRAINING_MANAGER: [
    { path: 'courses', element: <CourseApprovalsPage /> },
    { path: 'regulations', element: <TrainingRegulationsPage /> },
    { path: 'enrollments', element: <EnrollmentGovernancePage /> },
    { path: 'effectiveness', element: <TrainingEffectivenessPage /> },
  ],
  QUALITY_AUDITOR: [
    { path: 'audits', element: <BranchAuditsPage /> },
    { path: 'corrective-actions', element: <CorrectiveActionsPage /> },
    { path: 'compliance', element: <AuditorCompliancePage /> },
  ],
  BRANCH_MANAGER: [
    { path: 'readiness', element: <BranchStaffReadinessPage /> },
    { path: 'launches', element: <BranchLaunchesPage /> },
    { path: 'sales', element: <BranchSalesPage /> },
    { path: 'finance-ai', element: <FinanceIntelligencePage /> },
    { path: 'quality', element: <BranchQualityPage /> },
  ],
  TRAINEE: [
    { path: 'learning', element: <TraineeLearningPage /> },
    { path: 'quiz/:enrollmentId', element: <QuizPage /> },
    { path: 'certificates', element: <CertificatesPage /> },
  ],
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <LandingPage /> },
      { element: <PublicRoute />, children: [{ path: '/login', element: <LoginPage /> }] },

      // Legacy backwards compatibility redirects for old barista / store-manager paths
      { path: '/barista/*', element: <Navigate to="/trainee/learning" replace /> },
      { path: '/store-manager/*', element: <Navigate to="/branch-manager/readiness" replace /> },

      {
        element: <ProtectedRoute />,
        children: ROLES.map((role) => ({
          path: roleConfig[role].prefix,
          element: <RoleBasedRoute allowedRoles={[role]} />,
          children: [
            {
              element: <DashboardLayout />,
              children: [
                { index: true, element: <Navigate to="dashboard" replace /> },
                { path: 'dashboard', element: <RoleDashboard role={role} /> },
                ...(rolePages[role] ?? []),
              ],
            },
          ],
        })),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
