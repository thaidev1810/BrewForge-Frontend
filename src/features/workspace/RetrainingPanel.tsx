import { RetrainingResultView } from './RetrainingResultView'
import type { RetrainingResultDto } from '@/services/backend/contracts'
import { useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { ActionDialog } from '@/components/common/ActionDialog'
import { ErrorState, LoadingState, Notice } from '@/components/common/AsyncState'
import { Button } from '@/components/ui/button'
import { asRecord, canCall, useReadQuery, type RecordData } from '@/services/backend/operations'

export function RetrainingPanel({ record }: { record: RecordData }) {
  const user = useAppSelector(s => s.auth.user), [courseId, setCourseId] = useState(0), [open, setOpen] = useState(false), [conflict,setConflict]=useState(false)
  const eligible = canCall('CorrectiveActions.AssignRetraining', user?.role) && record.status !== 'CLOSED' && record.retrainingRequired === true && Array.isArray(record.employeeIds) && record.employeeIds.length > 0
  const options = useReadQuery({ operation: 'CorrectiveActions.RetrainingOptions', params: { id: Number(record.id) } }, { skip: !eligible })
  const data = asRecord(options.currentData), courses = (Array.isArray(data.courses) ? data.courses.map(asRecord) : [])
  if (!canCall('CorrectiveActions.AssignRetraining', user?.role)) return null
  if (!eligible && !open) return <Notice>Giao học lại cần action chưa đóng, có yêu cầu học lại và danh sách nhân viên đã được chỉ định. Nhân viên được chọn khi tạo kiểm định qua danh bạ active; giao học lại giữ danh sách đã ghi trên action.</Notice>
  return <section className="panel mt-6"><h2>Giao học lại theo SOP của kiểm định</h2><Notice>Các khóa đã công bố lấy từ API lựa chọn học lại theo SOP được kiểm định hoặc SOP phát hành hiện tại của cùng công thức. Nhân viên lấy từ action hiện có. Máy chủ kiểm tra hoạt động và chi nhánh của từng người; kết quả phân biệt giao mới, đã có đăng ký và bỏ qua kèm lý do.</Notice>
    {options.isLoading || options.isFetching && !options.currentData ? <LoadingState /> : options.error ? <ErrorState error={options.error} retry={() => { void options.refetch() }} /> : <><label htmlFor="retraining-course">Khóa học đã công bố</label><select id="retraining-course" value={courseId} onChange={e => setCourseId(Number(e.target.value))}><option value={0}>Chọn khóa…</option>{courses.map(c => <option value={Number(c.courseId)} key={String(c.courseId)}>{String(c.title)} · {String(c.courseType)} · SOP #{String(c.recipeVersionId)}{c.currentVersion ? ' (hiện tại)' : ''}</option>)}</select>{!courses.length && <p className="muted">Không có khóa đã công bố trên SOP này. Cần giảng viên tạo và quản lý đào tạo duyệt khóa phù hợp; API chỉ cung cấp các khóa phù hợp SOP của action.</p>}<Button className="mt-3" disabled={!courses.some(c => c.courseId === courseId)} onClick={() => setOpen(true)}>Giao học lại</Button></>}
    {open && <ActionDialog renderResult={data=><RetrainingResultView result={data as RetrainingResultDto}/>} onFailure={error=>setConflict(error.rule==='RETRAINING_COURSE_NOT_ALLOWED')} errorAction={conflict&&<><Notice>Danh sách khóa có thể đã thay đổi. Tải lại lựa chọn rồi chọn khóa hợp lệ; nội dung form được giữ.</Notice><Button type="button" variant="outline" disabled={options.isFetching} onClick={()=>void options.refetch()}>Tải lại lựa chọn học lại</Button>{options.error&&<ErrorState error={options.error} retry={()=>void options.refetch()}/>}</>} action={{ operation: 'CorrectiveActions.AssignRetraining', label: 'Giao học lại cho nhân viên được chỉ định' }} record={record} initial={{ courseId, deadline: null }} context={{ choices: { courseId: courses.map(c => ({ value: Number(c.courseId), label: String(c.title) })) }, retrainingCourseIds: courses.map(c => Number(c.courseId)) }} disabledReason={!eligible ? 'Action không còn đủ điều kiện giao học lại.' : undefined} onClose={() => setOpen(false)} />}
  </section>
}
