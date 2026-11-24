import { demoUsers } from '@/features/auth/mockAuthService'
import type { User } from '@/features/auth/authTypes'
import type { Course } from '@/features/courses/courseTypes'
import { isOverdue, stageOf, type TrainingFacts } from '@/features/training/trainingProgress'
import type { TrainingAssignment } from '@/features/training/trainingTypes'

export type Cell = 'CERTIFIED' | 'TRAINING' | 'OVERDUE' | 'NOT_STARTED'

// Readiness of one branch: every barista there against every active course.
export function branchReadiness(branchId: string | null, courses: Course[], assignments: TrainingAssignment[], facts: TrainingFacts) {
  const people: User[] = branchId ? demoUsers.filter((user) => user.role === 'TRAINEE' && user.branchId === branchId) : []
  const active = courses.filter((course) => !course.archived)
  const cellFor = (person: User, course: Course): Cell => {
    const mine = assignments.filter((assignment) => assignment.traineeId === person.id && assignment.courseId === course.id && assignment.status !== 'CANCELLED')
    if (mine.some((assignment) => stageOf(assignment, facts) === 'CERTIFIED')) return 'CERTIFIED'
    if (mine.some((assignment) => isOverdue(assignment, stageOf(assignment, facts)))) return 'OVERDUE'
    return mine.length > 0 ? 'TRAINING' : 'NOT_STARTED'
  }
  const rows = people.map((user) => ({ user, cells: Object.fromEntries(active.map((course) => [course.id, cellFor(user, course)])) as Record<string, Cell> }))
  const certifiedCells = rows.reduce((sum, row) => sum + Object.values(row.cells).filter((cell) => cell === 'CERTIFIED').length, 0)
  const total = rows.length * active.length
  return {
    rows,
    courses: active.map((course) => ({ id: course.id, title: course.title, certified: rows.filter((row) => row.cells[course.id] === 'CERTIFIED').length })),
    percent: total === 0 ? 0 : Math.round(certifiedCells * 100 / total),
    fullyCertified: active.length === 0 ? 0 : rows.filter((row) => Object.values(row.cells).every((cell) => cell === 'CERTIFIED')).length,
    overdue: rows.reduce((sum, row) => sum + Object.values(row.cells).filter((cell) => cell === 'OVERDUE').length, 0),
  }
}
