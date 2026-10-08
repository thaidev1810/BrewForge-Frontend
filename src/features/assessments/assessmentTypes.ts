import type { DomainService } from '@/types/domain'
export interface PracticalCriterionResult { criterionId: string; label: string; critical: boolean; passed: boolean }
export interface PracticalAssessmentInput { quizAttemptId: string; assessorId: string; criteria: PracticalCriterionResult[]; notes: string }
export interface PracticalAssessment extends PracticalAssessmentInput {
  id: string
  assignmentId: string
  traineeId: string
  courseId: string
  sopVersionIds: string[]
  criticalFailure: boolean
  passed: boolean
  assessedAt: string
}
export type AssessmentCommand = { operation: 'record'; input: PracticalAssessmentInput }
export type AssessmentService = DomainService<PracticalAssessment, AssessmentCommand>
