import { useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { ActionDialog } from '@/components/common/ActionDialog'
import { ErrorState, LoadingState, Notice } from '@/components/common/AsyncState'
import { Button } from '@/components/ui/button'
import { asRecord, canCall, useReadQuery, type RecordData } from '@/services/backend/operations'

export function RetrainingPanel({ record }: { record: RecordData }) {
  const user = useAppSelector(s => s.auth.user), [courseId, setCourseId] = useState(0), [open, setOpen] = useState(false)
  const eligible = canCall('CorrectiveActions.AssignRetraining', user?.role) && record.status !== 'CLOSED' && record.retrainingRequired === true && Array.isArray(record.employeeIds) && record.employeeIds.length > 0
  const audit = useReadQuery({ operation: 'BranchAudits.Get', params: { id: Number(record.branchAuditId) } }, { skip: !eligible })
  const versionId = asRecord(audit.currentData).recipeVersionId
  const trace = useReadQuery({ operation: 'AuditLog.Trace', params: { entityType: 'RecipeVersion', entityId: Number(versionId) } }, { skip: !eligible || !versionId })
  const data = asRecord(trace.currentData), courses = (Array.isArray(data.courses) ? data.courses.map(asRecord) : []).filter(c => c.state === 'PUBLISHED')
  if (!canCall('CorrectiveActions.AssignRetraining', user?.role)) return null
  if (!eligible) return <Notice>Giao học lại cần action chưa đóng, có yêu cầu học lại và danh sách nhân viên đã được chỉ định. Chưa có API chọn đầy đủ nhân viên active; không dùng lịch sử chứng chỉ làm roster.</Notice>
  return <section className="panel mt-6"><h2>Giao học lại theo SOP của kiểm định</h2><Notice>Chỉ có các khóa đã công bố gắn với đúng SOP từ API truy vết. Nhân viên lấy từ action hiện có; trạng thái active do máy chủ kiểm tra khi giao, không được suy ra từ CertifiedStaff history. Khóa đã có enrollment chưa CLOSED sẽ được bỏ qua; chọn khóa học lại mới nếu cần.</Notice>
    {audit.isLoading || trace.isFetching ? <LoadingState /> : audit.error || trace.error ? <ErrorState error={audit.error ?? trace.error} retry={() => { void audit.refetch(); if (versionId) void trace.refetch() }} /> : <><label htmlFor="retraining-course">Khóa học đã công bố</label><select id="retraining-course" value={courseId} onChange={e => setCourseId(Number(e.target.value))}><option value={0}>Chọn khóa…</option>{courses.map(c => <option value={Number(c.id)} key={String(c.id)}>{String(c.title)} · {String(c.courseType)}</option>)}</select>{!courses.length && <p className="muted">Không có khóa đã công bố trên SOP này. Cần giảng viên tạo và quản lý đào tạo duyệt khóa phù hợp; chưa có picker khóa tổng quát cho auditor.</p>}<Button className="mt-3" disabled={!courses.some(c => c.id === courseId)} onClick={() => setOpen(true)}>Giao học lại</Button></>}
    {open && <ActionDialog action={{ operation: 'CorrectiveActions.AssignRetraining', label: 'Giao học lại cho nhân viên được chỉ định' }} record={record} initial={{ courseId, deadline: null }} context={{ choices: { courseId: courses.map(c => ({ value: Number(c.id), label: String(c.title) })) }, retrainingCourseIds: courses.map(c => Number(c.id)) }} disabledReason={!eligible ? 'Action không còn đủ điều kiện giao học lại.' : undefined} onClose={() => setOpen(false)} />}
  </section>
}
