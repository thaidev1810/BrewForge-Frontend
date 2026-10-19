import type { EnrollmentDto, EnrollmentModuleDto } from './contracts'
export function confinedBranch(user: { role?: string; branchId?: string | number | null } | null | undefined): number | undefined {
  const branch = Number(user?.branchId) || undefined
  return user && (user.role === 'BRANCH_MANAGER' || user.role === 'TRAINEE' || user.role === 'TRAINER' && branch !== undefined) ? branch : undefined
}
export function canReadLesson(enrollment: EnrollmentDto, userId: number, module: EnrollmentModuleDto, lessonId: number): boolean {
  return enrollment.userId === userId && ['ASSIGNED', 'IN_PROGRESS', 'ELIGIBLE'].includes(enrollment.state) && !module.readLessonIds?.includes(lessonId)
}
export function pathEnrollmentLink(prefix: string, course: { enrollmentId: number | null }, own: boolean, trainer: boolean): string | undefined {
  return course.enrollmentId ? own ? `${prefix}/learning/${course.enrollmentId}` : trainer ? `${prefix}/assessment/${course.enrollmentId}` : undefined : undefined
}
