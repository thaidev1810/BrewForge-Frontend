import { useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { ActionDialog } from '@/components/common/ActionDialog'
import { LoadingState, ErrorState } from '@/components/common/AsyncState'
import { canCall, useReadQuery } from '@/services/backend/operations'
import type { EnrollmentDto, PracticalScheduleDto, QuizAttemptResultDto } from '@/services/backend/contracts'
import type { ActionSpec } from '@/features/workspace/resources'
import { practicalBookingIssue, canManagePractical } from './practicalRules'
import { PracticalAppointment } from './PracticalAppointment'
import { browserTimeZone, practicalActionNote } from '@/services/operationPresentation'

export function PracticalSchedulePanel({ enrollment }: { enrollment: EnrollmentDto }) {
  const user = useAppSelector(s => s.auth.user)
  const schedules = useReadQuery({ operation: 'PracticalSchedules.ForEnrollment', params: { id: enrollment.id } })
  const attempts = useReadQuery({ operation: 'Enrollments.QuizAttempts', params: { id: enrollment.id } })
  const [selected, setSelected] = useState<{ action: ActionSpec; schedule?: PracticalScheduleDto } | null>(null)
  const rows = schedules.data as PracticalScheduleDto[] | undefined
  const issue = schedules.data && attempts.data ? practicalBookingIssue(enrollment, attempts.data as QuizAttemptResultDto[], rows ?? []) : 'Đang xác minh kết quả quiz và lịch hiện tại.'
  const trainer = canCall('PracticalSchedules.Create', user?.role)
  return <section className="panel mt-6"><div className="section-header"><h2>Lịch thực hành</h2>{trainer && <Button disabled={!!issue || schedules.isFetching || attempts.isFetching || !!schedules.error || !!attempts.error} onClick={() => setSelected({ action: { operation: 'PracticalSchedules.Create', label: 'Đặt lịch thực hành', params: () => ({ id: enrollment.id }) } })}>Đặt lịch</Button>}</div>
    <div className="schedule-guidance"><p>{trainer ? issue ?? 'Học viên đã đạt bài kiểm tra lý thuyết. Bạn sẽ phụ trách buổi thực hành khi đặt lịch mới.' : 'Giảng viên đặt lịch sau khi bạn đạt bài kiểm tra lý thuyết. Bạn xem thời gian và địa điểm tại đây.'}</p><p className="field-help">Thời gian hiển thị theo {browserTimeZone()}. Kết thúc buổi thực hành chưa phải kết quả đánh giá; chứng chỉ chỉ được cấp khi đạt yêu cầu khóa học.</p></div>
    {attempts.error && <ErrorState error={attempts.error} retry={() => void attempts.refetch()} />}
    {schedules.isFetching ? <LoadingState /> : schedules.error ? <ErrorState error={schedules.error} retry={() => void schedules.refetch()} /> : !rows?.length ? <p className="empty-instruction">Chưa có lịch thực hành. {trainer ? 'Khi học viên đủ điều kiện, chọn Đặt lịch để hẹn thời gian và địa điểm.' : 'Theo dõi tại đây sau khi giảng viên sắp lịch.'}</p> : rows.map(s => <article className="appointment-sheet" key={s.id}><PracticalAppointment schedule={s} />{canManagePractical(s, user?.role, user?.id) && <div className="action-bar"><Button variant="outline" onClick={() => setSelected({ action: { operation: 'PracticalSchedules.Reschedule', label: 'Đổi lịch' }, schedule: s })}>Đổi lịch</Button><Button variant="outline" onClick={() => setSelected({ action: { operation: 'PracticalSchedules.Cancel', label: 'Hủy lịch', danger: true }, schedule: s })}>Hủy lịch</Button><Button onClick={() => setSelected({ action: { operation: 'PracticalSchedules.Complete', label: 'Hoàn tất lịch' }, schedule: s })}>Hoàn tất lịch</Button></div>}</article>)}
    {selected && <ActionDialog action={{ ...selected.action, note: practicalActionNote(selected.action.operation) }} record={selected.schedule ? { ...selected.schedule } : { id: enrollment.id }} initial={selected.action.operation === 'PracticalSchedules.Reschedule' && selected.schedule ? { scheduledAt: selected.schedule.scheduledAt, location: selected.schedule.location, note: selected.schedule.note } : undefined} renderResult={result => <PracticalAppointment schedule={result as PracticalScheduleDto} />} onClose={() => setSelected(null)} />}
  </section>
}
