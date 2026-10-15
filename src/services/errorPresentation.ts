import type { ServerError } from './backend/operations'
const messages: Record<string, string> = {
  'BR-31': 'Khóa học chưa đủ nội dung, thời lượng hoặc chưa rà soát xong. Kiểm tra từng học phần bên dưới.',
  'BR-34': 'Giảng viên phải có chứng nhận hiệu lực trên đúng phiên bản SOP của khóa học.',
  'BR-39': 'Chưa thể thao tác lịch thực hành. Kiểm tra quiz trong chu kỳ hiện tại, lịch đang mở và trạng thái lịch.',
  'BR-21': 'Khóa học chưa đủ bài kiểm tra hoặc checklist thực hành. Kiểm tra chi tiết bên dưới.',
  IMPACT_ALREADY_COMMITTED: 'Lần phân tích này đã được áp dụng. Tải lại để xem trạng thái mới nhất.',
  'MSG-E12': 'Khóa học còn học phần thiếu nội dung hoặc thời lượng.',
}
export function errorMessage(e: ServerError): string {
  if (e.status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (e.status === 404) return 'Tài nguyên không tồn tại hoặc ngoài phạm vi truy cập của bạn.'
  return messages[e.code ?? ''] ?? messages[e.rule ?? ''] ?? (e.message ? 'Không thể hoàn tất yêu cầu. ' + e.message : 'Không tải được dữ liệu. Vui lòng thử lại.')
}
export function issueMessage(issue: string): string {
  const known: Record<string, string> = { 'has no content': 'Thiếu nội dung giảng viên hoặc chưa có bài học.', 'has no duration': 'Chưa thiết lập thời lượng (phút).', 'needs review after the rebuild': 'Cần rà soát sau khi cập nhật SOP.', 'is required': 'Trường này bắt buộc.', 'is empty': 'Chưa có dữ liệu.', 'has no questions': 'Bài kiểm tra chưa có câu hỏi.', 'must be in the future': 'Thời gian phải ở tương lai.' }
  return known[issue] ?? issue
}
