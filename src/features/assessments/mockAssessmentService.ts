import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord, requireText } from '@/services/mock/helpers'
import { mockQuizAttempts } from '@/features/quizzes/mockQuizService'
import { mockTrainingAssignments } from '@/features/training/mockTrainingService'
import { demoUsers } from '@/features/auth/mockAuthService'
import type { AssessmentService, PracticalAssessment } from './assessmentTypes'

export const mockPracticalAssessments = new Map<string, PracticalAssessment>()
export const mockAssessmentService: AssessmentService = {
  ...mockRead(mockPracticalAssessments),
  async execute(command, signal) {
    checkSignal(signal)
    const input = copy(command.input)
    const attempt = requireRecord(mockQuizAttempts, input.quizAttemptId)
    if (!attempt.passed) throw new ApiError('Practical assessment requires a passed quiz attempt.', 409)
    if (requireRecord(mockTrainingAssignments, attempt.assignmentId).status === 'CANCELLED') throw new ApiError('Cancelled assignments cannot be assessed.', 409)
    if (!demoUsers.some((user) => user.id === input.assessorId)) throw new ApiError('Demo assessor not found.', 404)
    if (!input.criteria.length) throw new ApiError('At least one practical criterion is required.', 400)
    input.criteria = input.criteria.map((criterion) => ({ ...criterion, criterionId: requireText(criterion.criterionId, 'criterionId'), label: requireText(criterion.label, 'label') }))
    if (new Set(input.criteria.map((criterion) => criterion.criterionId)).size !== input.criteria.length) throw new ApiError('Practical criterion IDs must be unique.', 400)
    const criticalFailure = input.criteria.some((criterion) => criterion.critical && !criterion.passed)
    // Conservative mock policy: all criteria must pass; real rubric is still to be agreed.
    const passed = !criticalFailure && input.criteria.every((criterion) => criterion.passed)
    const assessment: PracticalAssessment = { ...input, id: crypto.randomUUID(), assignmentId: attempt.assignmentId, traineeId: attempt.traineeId, courseId: attempt.courseId, sopVersionIds: [...attempt.sopVersionIds], criticalFailure, passed, assessedAt: new Date().toISOString() }
    mockPracticalAssessments.set(assessment.id, assessment)
    return copy(assessment)
  },
}
