import { lazy, type ComponentType } from 'react'

function lazyWithReload<T extends ComponentType>(importer: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const storageKey = 'brewforge_chunk_reload_ts'
    try {
      const mod = await importer()
      sessionStorage.removeItem(storageKey)
      return mod
    } catch (error) {
      const lastReload = Number(sessionStorage.getItem(storageKey) ?? '0')
      const now = Date.now()
      if (now - lastReload > 10_000) {
        sessionStorage.setItem(storageKey, String(now))
        window.location.reload()
      }
      throw error
    }
  })
}

// Common & Landing
export const LandingPage = lazyWithReload(() => import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage })))

// ADMIN
export const UsersPage = lazyWithReload(() => import('@/features/admin/AdminPages').then((m) => ({ default: m.UsersPage })))
export const BranchesPage = lazyWithReload(() => import('@/features/admin/AdminPages').then((m) => ({ default: m.BranchesPage })))
export const CategoriesPage = lazyWithReload(() => import('@/features/admin/AdminPages').then((m) => ({ default: m.CategoriesPage })))
export const IngredientsPage = lazyWithReload(() => import('@/features/admin/AdminPages').then((m) => ({ default: m.IngredientsPage })))
export const EquipmentPage = lazyWithReload(() => import('@/features/admin/AdminPages').then((m) => ({ default: m.EquipmentPage })))
export const SettingsPage = lazyWithReload(() => import('@/features/admin/AdminPages').then((m) => ({ default: m.SettingsPage })))
export const AdminAuditLogsPage = lazyWithReload(() => import('@/features/admin/AdminPages').then((m) => ({ default: m.AdminAuditLogsPage })))

// RD_SPECIALIST
export const ProductsPage = lazyWithReload(() => import('@/features/rd/RdPages').then((m) => ({ default: m.ProductsPage })))
export const RecipesPage = lazyWithReload(() => import('@/features/rd/RdPages').then((m) => ({ default: m.RecipesPage })))

// RD_MANAGER
export const RdManagerRecipesPage = lazyWithReload(() => import('@/features/rd/RdPages').then((m) => ({ default: m.RdManagerRecipesPage })))
export const PilotsPage = lazyWithReload(() => import('@/features/rd/RdManagerPages').then((m) => ({ default: m.PilotsPage })))
export const ImpactAnalysisPage = lazyWithReload(() => import('@/features/rd/RdManagerPages').then((m) => ({ default: m.ImpactAnalysisPage })))
export const SalesAnalyticsPage = lazyWithReload(() => import('@/features/rd/RdManagerPages').then((m) => ({ default: m.SalesAnalyticsPage })))
export const ComplianceAndTracePage = lazyWithReload(() => import('@/features/rd/RdManagerPages').then((m) => ({ default: m.ComplianceAndTracePage })))

// TRAINER
export const TrainerCoursesPage = lazyWithReload(() => import('@/features/trainer/TrainerCoursesPage').then((m) => ({ default: m.TrainerCoursesPage })))
export const QuestionBankPage = lazyWithReload(() => import('@/features/trainer/TrainerCoursesPage').then((m) => ({ default: m.QuestionBankPage })))
export const TrainingClassesPage = lazyWithReload(() => import('@/features/trainer/TrainerOperationalPages').then((m) => ({ default: m.TrainingClassesPage })))
export const TrainerAssignmentsPage = lazyWithReload(() => import('@/features/trainer/TrainerOperationalPages').then((m) => ({ default: m.TrainerAssignmentsPage })))
export const PracticalAssessmentsPage = lazyWithReload(() => import('@/features/trainer/TrainerOperationalPages').then((m) => ({ default: m.PracticalAssessmentsPage })))
export const TrainerLearningPage = lazyWithReload(() => import('@/features/trainer/TrainerOperationalPages').then((m) => ({ default: m.TrainerLearningPage })))

// TRAINING_MANAGER
export const CourseApprovalsPage = lazyWithReload(() => import('@/features/training-manager/TrainingManagerPages').then((m) => ({ default: m.CourseApprovalsPage })))
export const TrainingRegulationsPage = lazyWithReload(() => import('@/features/training-manager/TrainingManagerPages').then((m) => ({ default: m.TrainingRegulationsPage })))
export const EnrollmentGovernancePage = lazyWithReload(() => import('@/features/training-manager/TrainingManagerPages').then((m) => ({ default: m.EnrollmentGovernancePage })))
export const TrainingEffectivenessPage = lazyWithReload(() => import('@/features/training-manager/TrainingManagerPages').then((m) => ({ default: m.TrainingEffectivenessPage })))

// QUALITY_AUDITOR
export const BranchAuditsPage = lazyWithReload(() => import('@/features/quality-auditor/QualityAuditorPages').then((m) => ({ default: m.BranchAuditsPage })))
export const CorrectiveActionsPage = lazyWithReload(() => import('@/features/quality-auditor/QualityAuditorPages').then((m) => ({ default: m.CorrectiveActionsPage })))
export const AuditorCompliancePage = lazyWithReload(() => import('@/features/quality-auditor/QualityAuditorPages').then((m) => ({ default: m.AuditorCompliancePage })))

// BRANCH_MANAGER
export const BranchStaffReadinessPage = lazyWithReload(() => import('@/features/branch-manager/BranchManagerPages').then((m) => ({ default: m.BranchStaffReadinessPage })))
export const BranchLaunchesPage = lazyWithReload(() => import('@/features/branch-manager/BranchManagerPages').then((m) => ({ default: m.BranchLaunchesPage })))
export const BranchSalesPage = lazyWithReload(() => import('@/features/branch-manager/BranchManagerPages').then((m) => ({ default: m.BranchSalesPage })))
export const BranchQualityPage = lazyWithReload(() => import('@/features/branch-manager/BranchManagerPages').then((m) => ({ default: m.BranchQualityPage })))

// TRAINEE
export const TraineeLearningPage = lazyWithReload(() => import('@/features/trainee/TraineePages').then((m) => ({ default: m.TraineeLearningPage })))
export const QuizPage = lazyWithReload(() => import('@/features/trainee/TraineePages').then((m) => ({ default: m.QuizPage })))
export const CertificatesPage = lazyWithReload(() => import('@/features/trainee/TraineePages').then((m) => ({ default: m.CertificatesPage })))

// AI INTELLIGENCE & FINANCE ML
export const FinanceIntelligencePage = lazyWithReload(() => import('@/features/intelligence/IntelligencePages').then((m) => ({ default: m.FinanceIntelligencePage })))
export const SensoryTwinPage = lazyWithReload(() => import('@/features/intelligence/IntelligencePages').then((m) => ({ default: m.SensoryTwinPage })))
