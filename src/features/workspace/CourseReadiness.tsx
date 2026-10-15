import { courseReadiness } from '@/services/backend/authoringRules'
import type { RecordData } from '@/services/backend/operations'
export function CourseReadiness({ record }: { record: RecordData }) {
  const issues = courseReadiness(record)
  return <section className="panel mt-4"><h2>Kiểm tra trước khi gửi duyệt</h2>{issues.length ? <ul className="field-error">{issues.map((i, n) => <li key={n}>{i.field}: {i.issue}</li>)}</ul> : <p className="success-box">Nội dung đã lưu có đủ điều kiện kiểm tra phía giao diện. Máy chủ vẫn kiểm tra lần cuối khi gửi.</p>}<p className="field-help">Đối chiếu từ GET khóa học sau lưu. Bài TECHNIQUE kết hợp phải có cả tham chiếu SOP và nội dung giảng viên; URL media không thay cho nội dung chữ. Thời lượng tính bằng phút.</p></section>
}
