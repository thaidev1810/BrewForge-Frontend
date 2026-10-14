import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { ActionDialog } from '@/components/common/ActionDialog'
import { DataView } from '@/components/common/DataView'

import { LoadingState, ErrorState, Notice } from '@/components/common/AsyncState'
import { asRecord, useReadQuery, type RecordData } from '@/services/backend/operations'
import type { CourseDetailDto, EnrollmentDto, PracticalVideoDto } from '@/services/backend/contracts'
import { PracticalSchedulePanel } from '@/features/training/PracticalSchedulePanel'
import { ProtectedMedia } from '@/features/workspace/specialPages'
import type { ActionSpec } from '@/features/workspace/resources'
export function AssessmentPage() {
  const { id } = useParams(), user = useAppSelector(s => s.auth.user), enrollmentId = Number(id), [action, setAction] = useState<ActionSpec | null>(null), [selectedVideo, setSelectedVideo] = useState<number | null>(null)
  const enrollment = useReadQuery({ operation: 'Enrollments.Get', params: { id: enrollmentId } }), e = enrollment.data as EnrollmentDto | undefined
  const course = useReadQuery({ operation: 'Courses.Get', params: { id: e?.courseId ?? 0 } }, { skip: !e?.courseId }), c = course.data as CourseDetailDto | undefined
  const attempts = useReadQuery({ operation: 'Enrollments.QuizAttempts', params: { id: enrollmentId } }), videos = useReadQuery({ operation: 'Enrollments.PracticalVideos', params: { id: enrollmentId } })
  const eligible = e?.state === 'ELIGIBLE' && c?.state === 'PUBLISHED' && e?.userId !== Number(user?.id)
  const recordings = videos.data as PracticalVideoDto[] | undefined, unused = recordings?.filter(v => v.uploadedBy === Number(user?.id) && v.evaluationId === null && Date.parse(v.uploadedAt) >= Date.parse(e?.enrolledAt ?? '')) ?? []
  const steps = c?.practicalChecklist.filter(i => i.recipeStepId !== null).map(i => ({ value: i.recipeStepId!, label: i.actionText })) ?? [], lessons = c?.practicalChecklist.map(i => ({ value: i.lessonId, label: i.actionText })) ?? []
  const initial: RecordData | undefined = action?.operation === 'Enrollments.EvaluatePractical' ? { practicalVideoId: selectedVideo, items: c?.practicalChecklist.map(item => ({ recipeStepId: c.recipeVersionId ? item.recipeStepId : null, lessonId: c.recipeVersionId ? null : item.lessonId, passed: null, note: null })) ?? [] } : undefined
  return <><PageHeader title={e ? 'Thực hành · ' + e.courseTitle : 'Đánh giá thực hành'} description="Đánh giá thủ công từ bản ghi của giảng viên và checklist khóa học." />{enrollment.isLoading ? <LoadingState /> : enrollment.error ? <ErrorState error={enrollment.error} /> : <>
    <section className="panel"><DataView value={e} /><Notice>Chỉ giảng viên khác người học, phụ trách lớp hoặc buổi học của lớp, mới được tải bản ghi; chính người tải lên thực hiện đánh giá. Backend vẫn kiểm tra các điều kiện này.</Notice><div className="action-bar">{eligible && <Button onClick={() => setAction({ operation: 'Enrollments.UploadPracticalVideo', label: 'Tải bản ghi thực hành' })}>Tải MP4 / MOV / WEBM</Button>}</div></section>
    <section className="panel mt-6"><h2>Checklist thực hành</h2>{course.isFetching ? <LoadingState /> : course.error ? <ErrorState error={course.error} /> : <DataView value={c?.practicalChecklist} />}<label htmlFor="evaluation-video">Chọn bản ghi của bạn chưa được đánh giá</label><select id="evaluation-video" value={selectedVideo ?? ''} onChange={event => setSelectedVideo(Number(event.target.value) || null)}><option value="">Chọn bản ghi…</option>{unused.map(v => <option key={v.id} value={v.id}>{v.fileName} · {v.uploadedAt}</option>)}</select><Button className="mt-3" disabled={!eligible || !selectedVideo || !c?.practicalChecklist.length} onClick={() => setAction({ operation: 'Enrollments.EvaluatePractical', label: 'Đánh giá theo checklist' })}>Đánh giá thực hành</Button></section>
    <section className="panel mt-6"><h2>Bản ghi</h2>{videos.isFetching ? <LoadingState /> : videos.error ? <ErrorState error={videos.error} /> : recordings?.map(v => <article className="lesson-card" key={v.id}><DataView value={v} /><ProtectedMedia operation="Enrollments.PracticalVideoContent" params={{ id: v.id }} kind="video" /></article>)}</section>
    <section className="panel mt-6"><h2>Lịch sử quiz</h2>{attempts.error ? <ErrorState error={attempts.error} /> : <DataView value={attempts.data} />}</section>
    {e && <PracticalSchedulePanel enrollment={e} />}
  </>}{action && <ActionDialog action={action} record={asRecord(enrollment.data)} initial={initial} context={{ choices: { practicalVideoId: unused.map(v => ({ value: v.id, label: v.fileName })), recipeStepId: steps, lessonId: lessons }, readOnly: action.operation === 'Enrollments.EvaluatePractical' ? ['recipeStepId', 'lessonId', 'practicalVideoId'] : [] }} onClose={() => setAction(null)} />}</>
}
