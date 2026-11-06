import type { PracticalScheduleDto } from '@/services/backend/contracts'
import { appointmentTime, browserTimeZone } from '@/services/operationPresentation'
const statuses: Record<string, string> = { SCHEDULED: 'Đã đặt lịch', COMPLETED: 'Đã kết thúc buổi thực hành', CANCELLED: 'Đã hủy lịch' }
export function PracticalAppointment({ schedule }: { schedule: PracticalScheduleDto }) {
  return <div className="appointment-record"><p className="eyebrow">{statuses[schedule.status] ?? 'Lịch thực hành'}</p><h3>{appointmentTime(schedule.scheduledAt)}</h3><p className="field-help">Giờ địa phương · {browserTimeZone(schedule.scheduledAt)}</p><dl className="appointment-facts"><div><dt>Địa điểm</dt><dd>{schedule.location}</dd></div><div><dt>Học viên</dt><dd>{schedule.traineeName ?? 'Chưa có tên trong kết quả'}</dd></div><div><dt>Giảng viên</dt><dd>{schedule.trainerName ?? 'Chưa có tên trong kết quả'}</dd></div></dl>{schedule.note && <p className="appointment-note">{schedule.note}</p>}</div>
}
