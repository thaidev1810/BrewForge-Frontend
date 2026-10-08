import type { DomainService } from '@/types/domain'
// Score counts simulate grading in the mock only. A real adapter must use server grading.
export interface QuizAttemptInput { assignmentId: string; correctAnswers: number; totalQuestions: number }
export interface QuizAttempt extends QuizAttemptInput {
  id: string
  traineeId: string
  courseId: string
  sopVersionIds: string[]
  scorePercent: number
  passingScore: number
  passed: boolean
  submittedAt: string
}
export type QuizCommand = { operation: 'record'; input: QuizAttemptInput }
export type QuizService = DomainService<QuizAttempt, QuizCommand>
