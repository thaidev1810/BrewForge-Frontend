import type { ServerError } from './backend/operations'
import type { Operation } from './backend/contracts'
import { label, fieldContext } from '@/components/common/presentation'
const messages: Record<string, string> = {
  'BR-31': 'Khóa học chưa đủ nội dung, thời lượng hoặc chưa rà soát xong. Kiểm tra từng học phần bên dưới.',
  'BR-34': 'Giảng viên phải có chứng nhận hiệu lực trên đúng phiên bản SOP của khóa học.',
  'BR-39': 'Chưa thể thao tác lịch thực hành. Kiểm tra quiz trong chu kỳ hiện tại, lịch đang mở và trạng thái lịch.',
  'BR-21': 'Khóa học chưa đủ bài kiểm tra hoặc checklist thực hành. Kiểm tra chi tiết bên dưới.',
  IMPACT_ALREADY_COMMITTED: 'Lần phân tích này đã được áp dụng. Tải lại để xem trạng thái mới nhất.',
  'MSG-E12': 'Khóa học còn học phần thiếu nội dung hoặc thời lượng.',
  PREREQUISITE: 'Nhân viên chưa đạt nhóm khóa học tiên quyết. Kiểm tra lộ trình và hoàn thành nhóm học trước khi giao khóa này.',
  RETRAINING_INCOMPLETE: 'Còn nhân viên chưa đạt yêu cầu học lại. Giữ ghi chú và kiểm tra tiến độ học lại trước khi đóng yêu cầu.',
  RETRAINING_COURSE_NOT_ALLOWED: 'Khóa học lại không còn phù hợp với quy trình hiện hành. Tải lại lựa chọn và chọn khóa hợp lệ; nội dung đã nhập được giữ lại.',
  IDEMPOTENCY_KEY_MISMATCH: 'Tệp khác với lần gửi trước. Kiểm tra kết quả lần nhập cũ; chỉ chọn tệp mới khi muốn bắt đầu một lần nhập khác.',
  UNIQUE: 'Mã này đã được sử dụng. Hãy chọn mã khác.',
  IMPORT_LAYOUT: 'Tệp chưa đúng mẫu cột. Tải tệp mẫu CSV, giữ nguyên hàng tiêu đề và điền dữ liệu theo thứ tự trước khi nhập lại.',
}
export const unmappedPresentation = new Set<string>()
export function errorMessage(e: ServerError, operation?: Operation): string {
  if (e.status === 403) return 'Bạn không có quyền thực hiện thao tác này. Liên hệ người quản lý nếu cần thay đổi quyền.'
  if (e.status === 404) return 'Không tìm thấy thông tin trong phạm vi bạn được xem. Quay lại danh sách để kiểm tra lựa chọn.'
  if ((e.rule === 'UNIQUE' || e.code === 'UNIQUE') && e.validationErrors) return issueMessage('must be unique', Object.keys(e.validationErrors)[0])
  const known = messages[e.rule ?? ''] ?? messages[e.code ?? '']
  if (known) return known
  if (e.validationErrors && Object.keys(e.validationErrors).length) return 'Có thông tin cần chỉnh sửa. Kiểm tra các trường được đánh dấu rồi gửi lại.'
  if (!e.status || e.status >= 500) return operation ? 'Chưa xác nhận được kết quả. Hãy kiểm tra lại trước khi gửi lần nữa. Nội dung đã nhập được giữ lại.' : 'Chưa tải được thông tin. Kiểm tra kết nối rồi chọn Thử lại nếu có.'
  if (e.status === 409) return 'Thông tin đã thay đổi hoặc thao tác chưa được phép. Kiểm tra trạng thái mới nhất trước khi gửi lại.' + (operation ? ' Nội dung đã nhập được giữ lại.' : '')
  unmappedPresentation.add(`${operation ?? 'read'}:${e.code ?? 'unknown'}:${e.rule ?? ''}`)
  return 'Chưa thể thực hiện yêu cầu. Kiểm tra thông tin đã chọn hoặc liên hệ người quản lý kèm mã hỗ trợ nếu có.'
}
export function issueMessage(issue: string, field?: string): string {
  const name = field ? label(field.replace(/\[\d+\]/g, '').split('.').at(-1) ?? field).toLocaleLowerCase('vi') : 'thông tin'
  if (['is required', 'Trường này bắt buộc.', 'required'].includes(issue)) return `${/Id(s)?$|Type$|status$|state$|unit$|passed$|role$/.test(field ?? '') ? 'Chọn' : 'Nhập'} ${name}.`
  const known: Record<string, string> = { 'has no content': 'Thiếu nội dung giảng viên hoặc chưa có bài học.', 'has no duration': 'Chưa thiết lập thời lượng (phút).', 'needs review after the rebuild': 'Cần rà soát sau khi cập nhật SOP.', 'is required': 'Trường này bắt buộc.', 'is empty': 'Chưa có dữ liệu.', 'has no questions': 'Bài kiểm tra chưa có câu hỏi.', 'must be in the future': 'Thời gian phải ở tương lai.' }
  if (known[issue]) return known[issue]
  if (issue==='Ngày phải có dạng YYYY-MM-DD.') return 'Chọn ngày hợp lệ từ lịch.'
  if (['must be unique', 'already exists'].includes(issue)) {
    const subject = /Code$|^code$/.test(field ?? '') ? 'Mã' : field ? label(field.split('.').at(-1) ?? field) : 'Giá trị'
    return `${subject} này đã được sử dụng. Hãy ${subject === 'Mã' ? 'chọn mã khác' : subject === 'Email' ? 'nhập email khác' : 'kiểm tra thông tin và nhập lại'}.`
  }
  const max = issue.match(/^(?:must be at most|must not exceed|maximum length is) (\d+)(?: characters)?\.?$/)
  if (max) return `Nhập tối đa ${max[1]} ký tự.`
  if (/[À-ỹ]/.test(issue) && !/\b(API|DTO|Int32|ISO|SQL|schema|payload|backend|exception)\b|traceId|https?:\/\//i.test(issue)) return issue
  unmappedPresentation.add(`field:${field ?? 'unknown'}:unmapped`)
  return `Kiểm tra ${name} và chọn hoặc nhập lại giá trị hợp lệ.`
}
export function fieldFeedback(field: string, issue: string) { return `${fieldContext(field)}: ${issueMessage(issue, field)}` }
