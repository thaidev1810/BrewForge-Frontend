import type { Certificate } from '@/features/certificates/certificateTypes'
import type { PracticalAssessment } from '@/features/assessments/assessmentTypes'
import type { QuizAttempt } from '@/features/quizzes/quizTypes'
import type { TrainingAssignment } from './trainingTypes'

export type Stage = 'ASSIGNED' | 'IN_PROGRESS' | 'PRACTICAL_PENDING' | 'PRACTICAL_FAILED' | 'AWAITING_CERTIFICATE' | 'CERTIFIED' | 'COMPLETED' | 'CANCELLED'

export const STAGE_LABELS: Record<Stage, string> = {
  ASSIGNED: 'Enrolled', IN_PROGRESS: 'Learning', PRACTICAL_PENDING: 'Practical pending', PRACTICAL_FAILED: 'Practical failed',
  AWAITING_CERTIFICATE: 'Awaiting certificate', CERTIFIED: 'Certified', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
export const STAGE_VARIANTS: Record<Stage, 'neutral' | 'success' | 'warning' | 'error'> = {
  ASSIGNED: 'neutral', IN_PROGRESS: 'warning', PRACTICAL_PENDING: 'warning', PRACTICAL_FAILED: 'error',
  AWAITING_CERTIFICATE: 'warning', CERTIFIED: 'success', COMPLETED: 'success', CANCELLED: 'neutral',
}

export interface TrainingFacts { quizzes: QuizAttempt[]; assessments: PracticalAssessment[]; certificates: Certificate[] }

const latest = <T extends { assessedAt?: string; submittedAt?: string }>(items: T[]) =>
  [...items].sort((a, b) => (a.assessedAt ?? a.submittedAt ?? '').localeCompare(b.assessedAt ?? b.submittedAt ?? '')).at(-1)

export function passedQuizFor(assignment: TrainingAssignment, facts: TrainingFacts) {
  return latest(facts.quizzes.filter((quiz) => quiz.assignmentId === assignment.id && quiz.passed))
}
export function latestAssessmentFor(assignment: TrainingAssignment, facts: TrainingFacts) {
  return latest(facts.assessments.filter((assessment) => assessment.assignmentId === assignment.id))
}
export function hasActiveCertificate(assignment: TrainingAssignment, facts: TrainingFacts) {
  return facts.certificates.some((certificate) => certificate.traineeId === assignment.traineeId && !certificate.revokedAt && assignment.sopVersionIds.includes(certificate.sopVersionId))
}

// Where an enrolment stands, from what has actually been recorded: quiz, practical, certificate.
export function stageOf(assignment: TrainingAssignment, facts: TrainingFacts): Stage {
  if (assignment.status === 'CANCELLED') return 'CANCELLED'
  if (hasActiveCertificate(assignment, facts)) return 'CERTIFIED'
  const assessment = latestAssessmentFor(assignment, facts)
  if (assessment?.passed) return 'AWAITING_CERTIFICATE'
  if (assessment) return 'PRACTICAL_FAILED'
  if (passedQuizFor(assignment, facts)) return 'PRACTICAL_PENDING'
  return assignment.status
}
export const isActive = (assignment: TrainingAssignment) => assignment.status === 'ASSIGNED' || assignment.status === 'IN_PROGRESS'
export const isOverdue = (assignment: TrainingAssignment, stage: Stage, now = Date.now()) =>
  assignment.dueAt !== null && Date.parse(assignment.dueAt) < now && stage !== 'CERTIFIED' && stage !== 'COMPLETED' && stage !== 'CANCELLED'
