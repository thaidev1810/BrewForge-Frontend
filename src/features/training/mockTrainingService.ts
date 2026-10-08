import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord } from '@/services/mock/helpers'
import { mockBranches } from '@/services/mock/branchDirectory'
import { mockCourses } from '@/features/courses/mockCourseService'
import { demoUsers } from '@/features/auth/mockAuthService'
import type { TrainingAssignment, TrainingService } from './trainingTypes'

export const mockTrainingAssignments = new Map<string, TrainingAssignment>()
export const mockTrainingService: TrainingService = {
  ...mockRead(mockTrainingAssignments),
  async execute(command, signal) {
    checkSignal(signal)
    if (command.operation === 'assign') {
      const input = copy(command.input)
      const course = requireRecord(mockCourses, input.courseId)
      const branch = requireRecord(mockBranches, input.branchId)
      if (course.archived || !branch.active) throw new ApiError('Assignments require an active course and branch.', 409)
      if (!demoUsers.some((user) => user.id === input.traineeId)) throw new ApiError('Demo trainee not found.', 404)
      if (input.dueAt !== null && !Number.isFinite(Date.parse(input.dueAt))) throw new ApiError('Due date must be a valid date-time.', 400)
      if (input.dueAt !== null) input.dueAt = new Date(input.dueAt).toISOString()
      if ([...mockTrainingAssignments.values()].some((assignment) => assignment.courseId === input.courseId && assignment.traineeId === input.traineeId && ['ASSIGNED', 'IN_PROGRESS'].includes(assignment.status))) throw new ApiError('An active assignment already exists for this trainee and course.', 409)
      const assignment: TrainingAssignment = { ...input, id: crypto.randomUUID(), status: 'ASSIGNED', assignedAt: new Date().toISOString(), sopVersionIds: [...course.sopVersionIds], quizPassingScore: course.quizPassingScore }
      mockTrainingAssignments.set(assignment.id, assignment)
      return copy(assignment)
    }
    const assignment = copy(requireRecord(mockTrainingAssignments, command.id))
    if (command.operation === 'start') {
      if (assignment.status !== 'ASSIGNED') throw new ApiError('Only assigned training can be started.', 409)
      assignment.status = 'IN_PROGRESS'
    } else if (command.operation === 'complete') {
      if (assignment.status !== 'IN_PROGRESS') throw new ApiError('Only training in progress can be completed.', 409)
      assignment.status = 'COMPLETED'
    } else {
      if (!['ASSIGNED', 'IN_PROGRESS'].includes(assignment.status)) throw new ApiError('Only active assignments can be cancelled.', 409)
      assignment.status = 'CANCELLED'
    }
    mockTrainingAssignments.set(assignment.id, assignment)
    return copy(assignment)
  },
}
