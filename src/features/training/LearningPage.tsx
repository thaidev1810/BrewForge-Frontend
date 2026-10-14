import { useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState, ErrorState, Notice } from '@/components/common/AsyncState'
import { DataView } from '@/components/common/DataView'
import { display } from '@/components/common/presentation'
import { asRecord, useReadQuery, useExecuteMutation } from '@/services/backend/operations'
import type { EnrollmentDto, EnrollmentModuleDto, EligibilityDto, LearnerQuizDto, QuizAttemptResultDto } from '@/services/backend/contracts'
import { PracticalSchedulePanel } from './PracticalSchedulePanel'
import { ProtectedMedia } from '@/features/workspace/specialPages'
export function LearningPage() {
  const { id } = useParams(), location = useLocation(), user = useAppSelector(s => s.auth.user), enrollmentId = Number(id)
  const enrollment = useReadQuery({ operation: 'Enrollments.Get', params: { id: enrollmentId } }), modules = useReadQuery({ operation: 'Enrollments.Modules', params: { id: enrollmentId } }), eligibility = useReadQuery({ operation: 'Enrollments.Eligibility', params: { id: enrollmentId } }), attempts = useReadQuery({ operation: 'Enrollments.QuizAttempts', params: { id: enrollmentId } })
  const [complete, mutation] = useExecuteMutation(), [error, setError] = useState<unknown>(null)
  const e = enrollment.data as EnrollmentDto | undefined, gate = eligibility.data as EligibilityDto | undefined, histories = attempts.data as QuizAttemptResultDto[] | undefined
  const prefix = user ? roleConfig[user.role].prefix : '', own = e?.userId === Number(user?.id), quizPassed = histories?.some(a => a.passed && Date.parse(a.attemptedAt) >= Date.parse(e?.enrolledAt ?? ''))
  const quizTab = location.pathname.endsWith('/quiz'), resultTab = location.pathname.endsWith('/results')
  async function finish(moduleId: number) { setError(null); try { await complete({ operation: 'Enrollments.CompleteModule', params: { id: enrollmentId, moduleId } }).unwrap() } catch (err) { setError(err) } }
  return <><Link className="text-link" to={prefix + '/learning'}>← Khóa học của tôi</Link><PageHeader title={e?.courseTitle ?? 'Khóa học'} description="Học theo tiêu chuẩn và hoàn thành từng học phần." />{enrollment.isLoading ? <LoadingState /> : enrollment.error ? <ErrorState error={enrollment.error} /> : e && <>
    <section className="learning-summary"><div><span className="eyebrow">TIẾN ĐỘ CỦA BẠN</span><h2>{e.progressPercent}% hoàn thành</h2><progress value={e.progressPercent} max={100} /></div><div><span className="muted">Hạn hoàn thành</span><p>{e.dueDate ?? 'Chưa có hạn'} {e.overdue && <span className="badge tone-overdue">Quá hạn</span>}</p><span className="badge">{display(e.state)}</span></div></section>
    {!own && <Notice>Đây là đăng ký của người khác. Chỉ người học mới được hoàn thành học phần và làm quiz.</Notice>}
    {e.state === 'LOCKED' && <Notice>Đăng ký đã bị khóa sau số lần thi cho phép. Liên hệ quản lý đào tạo để được giao học lại.</Notice>}
    <nav className="tabs" aria-label="Nội dung khóa học"><Link className={!quizTab && !resultTab ? 'active' : ''} to={`${prefix}/learning/${id}`}>Học phần</Link><Link className={quizTab ? 'active' : ''} to={`${prefix}/learning/${id}/quiz`}>Bài kiểm tra</Link><Link className={resultTab ? 'active' : ''} to={`${prefix}/learning/${id}/results`}>Kết quả & thực hành</Link></nav>
    {eligibility.isFetching ? <LoadingState label="Đang kiểm tra điều kiện…" /> : eligibility.error ? <ErrorState error={eligibility.error} /> : <section className="panel mb-6"><div className="section-header"><h3>Điều kiện dự thi</h3><span className="badge">{gate?.eligible ? 'Đủ điều kiện' : 'Chưa mở bài thi'}</span></div><p>Điểm danh {gate?.attendancePct ?? '—'}% / {gate?.minAttendancePct ?? '—'}% · {gate?.missingModules.length ?? '—'} học phần chưa xong · {gate?.retakesLeft ?? '—'} lần thi lại còn</p></section>}
    {error !== null && <ErrorState error={error} />}
    {!quizTab && !resultTab && (modules.isFetching ? <LoadingState /> : modules.error ? <ErrorState error={modules.error} /> : <div className="space-y-5">{(modules.data as EnrollmentModuleDto[] | undefined)?.map(item => <section className="panel" key={item.module.id}><div className="section-header"><h2>{item.module.moduleOrder}. {display(item.module.moduleType)}</h2><span className="badge">{item.completed ? 'Đã hoàn thành' : `${item.module.durationMinutes ?? '—'} phút`}</span></div>{item.module.lessons.map(l => <article className="lesson-card" key={l.id}><h3>{l.title}</h3>{l.content && <p className="whitespace-pre-wrap">{l.content}</p>}{l.reference !== null && <DataView value={l.reference} title="Tiêu chuẩn tham chiếu" />}{l.mediaUrl && /^https?:\/\//.test(l.mediaUrl) && <a href={l.mediaUrl} className="text-link" target="_blank" rel="noreferrer">Mở tài liệu học</a>}</article>)}{own && ['ASSIGNED', 'IN_PROGRESS', 'ELIGIBLE'].includes(e.state) && <Button className="mt-4" disabled={item.completed || mutation.isLoading} onClick={() => void finish(item.module.id)}>{item.completed ? 'Đã hoàn thành' : 'Đánh dấu đã học xong'}</Button>}</section>)}</div>)}
    {quizTab && (own && gate?.eligible && !quizPassed ? <LearnerQuiz enrollmentId={enrollmentId} /> : <><Notice>{quizPassed ? 'Bạn đã đạt bài kiểm tra này. Theo dõi lịch thực hành và kết quả ở tab kế tiếp.' : 'Bài kiểm tra chỉ mở khi học đủ các học phần và đạt điểm danh; đăng ký phải còn đủ điều kiện.'}</Notice>{histories?.length ? <section className="panel"><DataView value={histories.at(-1)} title="Kết quả lần thi gần nhất" /></section> : null}</>)}
    {resultTab && <LearningResults enrollment={e} enrollmentId={enrollmentId} attempts={histories} attemptsError={attempts.error} />}
  </>}</>
}
function LearnerQuiz({ enrollmentId }: { enrollmentId: number }) {
  const query = useReadQuery({ operation: 'Enrollments.Quiz', params: { id: enrollmentId } }), [answers, setAnswers] = useState<Record<number, string>>({}), [send, mutation] = useExecuteMutation(), [error, setError] = useState<unknown>(null), [result, setResult] = useState<QuizAttemptResultDto | null>(null)
  const quiz = query.data as LearnerQuizDto | undefined
  async function submit() { setError(null); try { const data = await send({ operation: 'Enrollments.AttemptQuiz', params: { id: enrollmentId }, body: { answers: quiz?.questions.map(q => ({ questionId: q.id, selectedOption: answers[q.id] ?? null })) ?? [] } }).unwrap(); setResult(data as QuizAttemptResultDto) } catch (e) { setError(e) } }
  if (query.isFetching) return <LoadingState />
  if (query.error) return <ErrorState error={query.error} />
  return <section className="panel"><h2>{quiz?.title}</h2><p className="muted">Điểm đạt: {quiz?.passScore}% · Mỗi câu chọn một đáp án. Bỏ trống được tính sai.</p>{result ? <DataView value={result} /> : <form onSubmit={e => { e.preventDefault(); void submit() }}>{quiz?.questions.map((q, i) => <fieldset className="quiz-question" key={q.id}><legend>{i + 1}. {q.questionText}</legend>{q.options.map(o => <label className="quiz-option" key={o.key}><input type="radio" name={'question-' + q.id} value={o.key} checked={answers[q.id] === o.key} onChange={() => setAnswers({ ...answers, [q.id]: o.key })} />{o.text}</label>)}</fieldset>)}{error !== null && <ErrorState error={error} />}<Button type="submit" disabled={mutation.isLoading || !quiz?.questions.length}>{mutation.isLoading ? 'Đang chấm bài…' : 'Nộp bài kiểm tra'}</Button></form>}</section>
}
function LearningResults({ enrollment, enrollmentId, attempts, attemptsError }: { enrollment: EnrollmentDto; enrollmentId: number; attempts?: QuizAttemptResultDto[]; attemptsError?: unknown }) {
  const videos = useReadQuery({ operation: 'Enrollments.PracticalVideos', params: { id: enrollmentId } })
  return <><section className="panel"><h2>Lịch sử bài thi</h2>{attemptsError ? <ErrorState error={attemptsError} /> : <DataView value={attempts ?? []} />}</section><PracticalSchedulePanel enrollment={enrollment} /><section className="panel mt-6"><h2>Bản ghi thực hành</h2>{videos.isFetching ? <LoadingState /> : videos.error ? <ErrorState error={videos.error} /> : Array.isArray(videos.data) && videos.data.map(raw => { const video = asRecord(raw); return <article className="lesson-card" key={String(video.id)}><DataView value={video} /><ProtectedMedia operation="Enrollments.PracticalVideoContent" params={{ id: Number(video.id) }} kind="video" /></article> })}</section></>
}
