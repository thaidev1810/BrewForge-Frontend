import type { EnrollmentDto, PracticalScheduleDto, QuizAttemptResultDto } from '@/services/backend/contracts'
export function practicalBookingIssue(enrollment: Pick<EnrollmentDto, 'state' | 'enrolledAt'>, attempts: Pick<QuizAttemptResultDto, 'passed' | 'attemptedAt'>[], schedules: Pick<PracticalScheduleDto, 'status'>[]): string | null {
  if (enrollment.state === 'PASSED') return 'Học viên đã đạt khóa học này. Xem kết quả đánh giá và chứng chỉ; không cần đặt lịch mới cho lần học đã đạt.'
  if (enrollment.state === 'CLOSED') return 'Lần học đã đóng. Chỉ xem lịch sử; liên hệ quản lý đào tạo nếu cần được giao học lại.'
  if (enrollment.state === 'LOCKED') return 'Lần học đang bị khóa. Kiểm tra điểm danh và lượt thi với quản lý đào tạo để được hướng dẫn học lại.'
  if (enrollment.state !== 'ELIGIBLE') return 'Học viên cần hoàn thành học phần và đạt yêu cầu điểm danh để mở bài kiểm tra. Sau khi đạt bài kiểm tra, bạn có thể đặt lịch thực hành.'
  if (!attempts.some(a => a.passed && Date.parse(a.attemptedAt) >= Date.parse(enrollment.enrolledAt))) return 'Học viên cần đạt bài kiểm tra lý thuyết trong lần học hiện tại trước khi đặt lịch thực hành.'
  if (schedules.some(s => s.status === 'SCHEDULED')) return 'Đã có lịch đang mở. Đổi hoặc hủy lịch hiện có trước khi đặt mới.'
  return null
}
export function canManagePractical(schedule: Pick<PracticalScheduleDto, 'status' | 'trainerId'>, role?: string, userId?: string): boolean {
  return role === 'TRAINER' && schedule.status === 'SCHEDULED' && schedule.trainerId === Number(userId)
}
