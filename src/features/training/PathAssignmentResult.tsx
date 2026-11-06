import type { PathAssignmentDto } from '@/services/backend/contracts'
import { display } from '@/components/common/presentation'
const outcomes: Record<string, string> = { CERTIFIED: 'Đã có chứng chỉ', ENROLLED: 'Đã có lần học', BLOCKED: 'Chưa đủ điều kiện', AVAILABLE: 'Chưa được giao' }
export function PathAssignmentResult({ result }: { result: PathAssignmentDto }) {
  if (!result?.path?.stages || !Array.isArray(result.enrollmentIds)) return <p role="alert">Chưa đọc được kết quả giao khóa. Hãy kiểm tra lại lộ trình trước khi giao lần nữa.</p>
  return <section className="assignment-receipt" aria-label="Kết quả giao khóa học">
    <p className="eyebrow">KẾT QUẢ GIAO KHÓA</p><h3>{result.path.fullName}</h3>
    <p className="success-box" role="status">Giao mới: {result.enrollmentIds.length} lần học.</p>
    <p className="field-help">Danh sách dưới đây là tình trạng sau khi xử lý. Các khóa đã có lần học hoặc đã có chứng chỉ không được giao lại. Khóa còn thiếu tiên quyết sẽ chờ hoàn thành nhóm học trước.</p>
    {result.path.stages.map(stage => <section className="receipt-stage" key={stage.regulationId}><h4>{display(stage.courseType)}</h4>{stage.blocked && <p>Chưa đủ điều kiện: cần đạt nhóm {display(stage.prerequisiteType)} trước.</p>}{stage.courses.map(course => <div className="receipt-line" key={course.courseId}><strong>{course.title}</strong><span>{outcomes[course.status] ?? 'Cần kiểm tra lại tình trạng khóa học'}</span></div>)}</section>)}
    {!result.path.stages.length && <p>Chưa có khóa bắt buộc phù hợp trong lộ trình.</p>}
  </section>
}
