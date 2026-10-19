import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { PageHeader } from '@/components/common/PageHeader'
import { ResourcePicker } from '@/components/common/ContractForm'
import { ActionDialog } from '@/components/common/ActionDialog'
import { ErrorState, LoadingState, Notice } from '@/components/common/AsyncState'
import { display } from '@/components/common/presentation'
import { Button } from '@/components/ui/button'
import { canCall, useReadQuery } from '@/services/backend/operations'
import type { LearningPathDto } from '@/services/backend/contracts'
import { pathEnrollmentLink } from '@/services/backend/learningFlow'

export function LearningPathPage() {
  const user = useAppSelector(s => s.auth.user), [person, setPerson] = useState<number | null>(null), [open, setOpen] = useState(false)
  const canManage = canCall('LearningPath.Get', user?.role), [mine, setMine] = useState(true)
  const ownMode = canCall('LearningPath.Mine', user?.role) && (mine || !canManage)
  const userId = ownMode ? Number(user?.id) : person
  const query = useReadQuery(ownMode ? { operation: 'LearningPath.Mine' } : { operation: 'LearningPath.Get', params: { userId: userId ?? 0 } }, { skip: !user || !userId || !ownMode && !canManage })
  const path = query.currentData as LearningPathDto | undefined
  if (!user) return null
  const prefix = roleConfig[user.role].prefix
  return <><PageHeader title="Lộ trình học" description="Giai đoạn, tiên quyết và các khóa bắt buộc lấy từ máy chủ." />
    {canManage && <section className="panel mb-6">{canCall('LearningPath.Mine', user.role) && <label><input type="checkbox" checked={mine} onChange={e => { setMine(e.target.checked); setOpen(false) }} /> Lộ trình của tôi</label>}{!ownMode && <ResourcePicker field="userId" value={person} onChange={v => { setPerson(Number(v) || null); setOpen(false) }} />}</section>}
    {!userId ? <Notice>Chọn nhân viên trong phạm vi được phép để xem lộ trình.</Notice> : query.isLoading || query.isFetching && !path ? <LoadingState /> : <>
      {query.error && <ErrorState error={query.error} retry={() => void query.refetch()} />}
      {path && <><section className="panel"><h2>{path.fullName}</h2><p>{display(path.role)} · {path.branchId ? `Chi nhánh #${path.branchId}` : 'Toàn chuỗi'}</p><Notice>BLOCKED là trạng thái lộ trình, không phải EnrollmentState. Khóa tự giao sau tạo tài khoản/chứng chỉ được thực hiện ở BE; giao diện không gọi assign để giả lập.</Notice>{canCall('LearningPath.Assign', user.role) && <Button onClick={() => setOpen(true)}>Giao các khóa đang mở</Button>}{!path.stages.length && <p>Chưa có quy định bắt buộc phù hợp cho nhân viên này.</p>}</section>
        {path.stages.map(stage => <section className="panel mt-5" key={stage.regulationId}><h2>{display(stage.courseType)} <span className="badge">{stage.blocked ? 'Bị chặn bởi tiên quyết' : 'Giai đoạn đang mở'}</span></h2><p>Tiên quyết: {stage.prerequisiteType ? display(stage.prerequisiteType) : 'Không có'} · Hạn học {stage.dueDays} ngày</p>{stage.blocked && <Notice>Cần đạt khóa thuộc nhóm {display(stage.prerequisiteType)} theo quy định máy chủ.</Notice>}{!stage.courses.length && <p>Chưa có khóa công bố phù hợp với quy định và menu chi nhánh.</p>}{stage.courses.map(course => { const link = pathEnrollmentLink(prefix, course, path.userId === Number(user.id), user.role === 'TRAINER'); return <article className="lesson-card" key={course.courseId}><h3>{course.title}</h3><p>{display(course.status)} · {display(course.enrollmentState)}{course.dueDate ? ` · Hạn ${course.dueDate}` : ''}</p>{link ? <Link className="text-link" to={link}>Mở đăng ký học →</Link> : <p className="muted">{course.enrollmentId ? 'Role hiện tại chưa có quyền đọc chi tiết đăng ký.' : 'Chưa có đăng ký học; không có liên kết học.'}</p>}{course.certificateId && canCall('Certificates.Get', user.role) && <Link className="text-link ml-3" to={`${prefix}/certificates/${course.certificateId}`}>Xem chứng chỉ</Link>}</article> })}</section>)}
      </>}
    </>}
    {open && userId && <ActionDialog action={{ operation: 'LearningPath.Assign', label: 'Giao các khóa đang mở', params: () => ({ userId }), note: 'BE chỉ giao các khóa AVAILABLE, không tự mở khóa tiên quyết. Kết quả gồm path và enrollmentIds thực tế.' }} onClose={() => setOpen(false)} />}
  </>
}
