import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord } from '@/services/mock/helpers'
import { mockTrainingAssignments } from '@/features/training/mockTrainingService'
import type { QuizAttempt, QuizService } from './quizTypes'

export const mockQuizAttempts = new Map<string, QuizAttempt>()
export const mockQuizService: QuizService = {
  ...mockRead(mockQuizAttempts),
  async execute(command, signal) {
    checkSignal(signal)
    const input = command.input
    const assignment = requireRecord(mockTrainingAssignments, input.assignmentId)
    if (assignment.status === 'CANCELLED') throw new ApiError('Cancelled assignments cannot receive quiz attempts.', 409)
    if (!Number.isInteger(input.totalQuestions) || input.totalQuestions < 1 || !Number.isInteger(input.correctAnswers) || input.correctAnswers < 0 || input.correctAnswers > input.totalQuestions) throw new ApiError('Quiz counts must be valid whole numbers.', 400)
    const scorePercent = input.correctAnswers / input.totalQuestions * 100
    const attempt: QuizAttempt = { ...copy(input), id: crypto.randomUUID(), traineeId: assignment.traineeId, courseId: assignment.courseId, sopVersionIds: [...assignment.sopVersionIds], scorePercent, passingScore: assignment.quizPassingScore, passed: scorePercent >= assignment.quizPassingScore, submittedAt: new Date().toISOString() }
    mockQuizAttempts.set(attempt.id, attempt)
    return copy(attempt)
  },
}
