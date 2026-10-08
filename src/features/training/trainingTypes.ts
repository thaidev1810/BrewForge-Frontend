import type { DomainService } from '@/types/domain'
export type TrainingStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export interface TrainingAssignmentInput { courseId: string; traineeId: string; branchId: string; dueAt: string | null }
export interface TrainingAssignment extends TrainingAssignmentInput {
  id: string
  status: TrainingStatus
  assignedAt: string
  // Historical reference/threshold snapshots, not duplicated course entities.
  sopVersionIds: string[]
  quizPassingScore: number
}
export type TrainingCommand =
  | { operation: 'assign'; input: TrainingAssignmentInput }
  | { operation: 'start' | 'complete' | 'cancel'; id: string }
export type TrainingService = DomainService<TrainingAssignment, TrainingCommand>
