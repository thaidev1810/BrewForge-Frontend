import type { EnrollmentDto, PracticalScheduleDto, QuizAttemptResultDto } from '@/services/backend/contracts'
export function practicalBookingIssue(enrollment: Pick<EnrollmentDto, 'state' | 'enrolledAt'>, attempts: Pick<QuizAttemptResultDto, 'passed' | 'attemptedAt'>[], schedules: Pick<PracticalScheduleDto, 'status'>[]): string | null {
  if (enrollment.state !== 'ELIGIBLE') return 'Đăng ký phải ở trạng thái đủ điều kiện (ELIGIBLE).'
  if (!attempts.some(a => a.passed && Date.parse(a.attemptedAt) >= Date.parse(enrollment.enrolledAt))) return 'Học viên phải đạt quiz trong chu kỳ học hiện tại.'
  if (schedules.some(s => s.status === 'SCHEDULED')) return 'Đã có lịch đang mở. Đổi hoặc hủy lịch hiện có trước khi đặt mới.'
  return null
}
export function canManagePractical(schedule: Pick<PracticalScheduleDto, 'status' | 'trainerId'>, role?: string, userId?: string): boolean {
  return role === 'TRAINER' && schedule.status === 'SCHEDULED' && schedule.trainerId === Number(userId)
}
