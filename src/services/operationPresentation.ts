import type { Operation } from './backend/contracts'
const verbs: Partial<Record<Operation, string>> = {
  'LearningPath.Assign': 'Giao khóa học', 'Assignments.Assign': 'Giao khóa học',
  'PracticalSchedules.Create': 'Lưu lịch thực hành', 'PracticalSchedules.Reschedule': 'Lưu lịch mới', 'PracticalSchedules.Cancel': 'Hủy lịch thực hành', 'PracticalSchedules.Complete': 'Hoàn tất lịch',
  'Courses.Submit': 'Gửi để duyệt', 'Courses.Approve': 'Duyệt khóa học', 'Courses.Return': 'Trả lại để chỉnh sửa',
  'Sales.Create': 'Ghi nhận doanh số', 'Sales.Import': 'Nhập doanh số từ tệp', 'CorrectiveActions.Close': 'Đóng yêu cầu khắc phục',
  'Ingredients.Create': 'Lưu nguyên liệu', 'Ingredients.Update': 'Lưu thay đổi',
}
export function submitLabel(operation: Operation, title: string): string {
  return verbs[operation] ?? (/\.(Create|Update|Save|Configure)/.test(operation) ? 'Lưu thông tin' : title)
}
export function successMessage(operation: Operation): string {
  if (operation.startsWith('PracticalSchedules.')) return 'Đã cập nhật lịch thực hành. Kiểm tra thời gian và địa điểm bên dưới.'
  if (operation === 'Courses.Submit') return 'Đã gửi khóa học để duyệt. Theo dõi kết quả trong danh sách khóa học.'
  if (operation === 'Courses.Approve') return 'Đã duyệt khóa học.'
  if (operation === 'Courses.Return') return 'Đã trả khóa học về để chỉnh sửa.'
  if (operation === 'CorrectiveActions.Close') return 'Đã đóng yêu cầu khắc phục theo kết quả xử lý. Xem lại hồ sơ bên dưới.'
  return 'Đã lưu kết quả. Bạn có thể kiểm tra thông tin bên dưới trước khi đóng.'
}
export function browserTimeZone(value?: string): string {
  const minutes = -(value ? new Date(value) : new Date()).getTimezoneOffset()
  const hours = Math.floor(Math.abs(minutes) / 60), remainder = Math.abs(minutes) % 60
  return `UTC${minutes >= 0 ? '+' : '−'}${hours}${remainder ? ':' + String(remainder).padStart(2, '0') : ''} (giờ trên thiết bị)`
}
export const posCsvTemplate = 'branch_code,drink_code,trading_date,quantity\r\n'
export function appointmentTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeStyle: 'short', timeZoneName: undefined }).format(new Date(value))
}
export function trainerReason(value: unknown): string {
  if(value==='belongs to another branch')return 'Giảng viên thuộc chi nhánh khác với lớp.'
  if(typeof value==='string'&&/^not certified on recipe version \d+$/.test(value))return 'Giảng viên chưa có chứng chỉ hiệu lực trên phiên bản quy trình của khóa học.'
  return 'Chưa đáp ứng điều kiện phụ trách khóa học; chọn giảng viên khác hoặc kiểm tra với quản lý đào tạo.'
}
export function loginErrorMessage(message: string): string {
  if (['The username or password is incorrect.', 'Invalid username or password.'].includes(message)) return 'Tên đăng nhập hoặc mật khẩu chưa đúng. Kiểm tra lại thông tin và thử đăng nhập lần nữa.'
  if (message === 'The account is no longer active.') return 'Tài khoản không còn hoạt động. Liên hệ quản trị viên để kiểm tra quyền truy cập.'
  return 'Chưa đăng nhập được. Kiểm tra kết nối và thông tin tài khoản; nếu vẫn không được, liên hệ quản trị viên.'
}
export function practicalActionNote(operation: Operation): string {
  if(operation==='PracticalSchedules.Cancel')return 'Hủy buổi hẹn này và giữ lịch cũ để đối chiếu. Nếu cần một buổi hẹn khác, kiểm tra điều kiện của lần học trước khi đặt lịch mới.'
  if(operation==='PracticalSchedules.Complete')return 'Ghi nhận buổi hẹn đã kết thúc. Thao tác này không chấm thực hành hoặc cấp chứng chỉ; giảng viên vẫn cần đánh giá bản ghi theo tiêu chí của khóa học.'
  return `Chọn giờ và địa điểm để học viên chuẩn bị. Giờ nhập theo múi giờ trên thiết bị; hiện tại là ${browserTimeZone()}. Việc lưu lịch không thay thế đánh giá thực hành.`
}
