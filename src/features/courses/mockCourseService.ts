import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord, requireText } from '@/services/mock/helpers'
import { DEFAULT_QUIZ_PASSING_SCORE } from '@/constants/training'
import { mockSopVersions } from '@/features/sops/mockSopService'
import type { Course, CourseService } from './courseTypes'

export const mockCourses = new Map<string, Course>([
  ['course-latte', { id: 'course-latte', title: 'Latte fundamentals', description: 'Learn the standard latte workflow.', sopVersionIds: ['sop-latte-v1'], quizPassingScore: DEFAULT_QUIZ_PASSING_SCORE, archived: false }],
])
export const mockCourseService: CourseService = {
  ...mockRead(mockCourses),
  async execute(command, signal) {
    checkSignal(signal)
    if (command.operation === 'archive') {
      const course = { ...requireRecord(mockCourses, command.id), archived: true }
      mockCourses.set(course.id, course)
      return copy(course)
    }
    const previous = command.operation === 'update' ? requireRecord(mockCourses, command.id) : undefined
    if (previous?.archived) throw new ApiError('Archived courses cannot be edited.', 409)
    const input = command.input
    const sopVersionIds = [...new Set(input.sopVersionIds)]
    if (!sopVersionIds.length) throw new ApiError('A course requires at least one published SOP version.', 400)
    for (const id of sopVersionIds) {
      if (requireRecord(mockSopVersions, id).status !== 'PUBLISHED') throw new ApiError('Courses can only reference published SOP versions.', 409)
    }
    const quizPassingScore = input.quizPassingScore ?? previous?.quizPassingScore ?? DEFAULT_QUIZ_PASSING_SCORE
    if (!Number.isFinite(quizPassingScore) || quizPassingScore < 0 || quizPassingScore > 100) throw new ApiError('Quiz passing score must be between 0 and 100.', 400)
    const course: Course = { id: previous?.id ?? crypto.randomUUID(), title: requireText(input.title, 'title'), description: input.description, sopVersionIds, quizPassingScore, archived: false }
    mockCourses.set(course.id, course)
    return copy(course)
  },
}
