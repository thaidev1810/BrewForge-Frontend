import { useRef, useState } from 'react'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { Link, useParams, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState, ErrorState, Notice } from '@/components/common/AsyncState'
import { DataView } from '@/components/common/DataView'
import { display } from '@/components/common/presentation'
import { asRecord, useReadQuery, useExecuteMutation } from '@/services/backend/operations'
import type { EnrollmentDto, EnrollmentModuleDto, EligibilityDto, LearnerQuizDto, QuizAttemptResultDto } from '@/services/backend/contracts'
import { canReadLesson } from '@/services/backend/learningFlow'
import { PracticalSchedulePanel } from './PracticalSchedulePanel'
import { ProtectedMedia } from '@/features/workspace/specialPages'
export function LearningPage() {
  const { id } = useParams(), location = useLocation(), user = useAppSelector(s => s.auth.user), enrollmentId = Number(id)
  const enrollment = useReadQuery({ operation: 'Enrollments.Get', params: { id: enrollmentId } }), modules = useReadQuery({ operation: 'Enrollments.Modules', params: { id: enrollmentId } }), eligibility = useReadQuery({ operation: 'Enrollments.Eligibility', params: { id: enrollmentId } }), attempts = useReadQuery({ operation: 'Enrollments.QuizAttempts', params: { id: enrollmentId } })
  const [complete, mutation] = useExecuteMutation(), [error, setError] = useState<unknown>(null)
  const e = enrollment.currentData as EnrollmentDto | undefined, gate = eligibility.currentData as EligibilityDto | undefined, histories = attempts.currentData as QuizAttemptResultDto[] | undefined
  const prefix = user ? roleConfig[user.role].prefix : '', own = e?.userId === Number(user?.id), quizPassed = histories?.some(a => a.passed && Date.parse(a.attemptedAt) >= Date.parse(e?.enrolledAt ?? ''))
  const currentHistories = histories?.filter(a => Date.parse(a.attemptedAt) >= Date.parse(e?.enrolledAt ?? ''))
  const quizTab = location.pathname.endsWith('/quiz'), resultTab = location.pathname.endsWith('/results')
  const completing = useRef(false)
  async function finish(lessonId: number) { if (completing.current) return; completing.current = true; setError(null); try { await complete({ operation: 'Enrollments.CompleteLesson', params: { id: enrollmentId, lessonId } }).unwrap() } catch (err) { setError(err) } finally { completing.current = false } }
  return <><Link className="text-link" to={prefix + '/learning'}>← Khóa học của tôi</Link><PageHeader title={e?.courseTitle ?? 'Khóa học'} description="Theo dõi tiến độ, đọc từng bài và hoàn thành khóa học." />{enrollment.isLoading ? <LoadingState /> : enrollment.error && !e ? <ErrorState error={enrollment.error} /> : e && <>
    <section className="learning-summary"><div><span className="eyebrow">TIẾN ĐỘ CỦA BẠN</span><h2>{e.progressPercent}% hoàn thành</h2><progress value={e.progressPercent} max={100} /></div><div><span className="muted">Hạn hoàn thành</span><p>{e.dueDate ?? 'Chưa có hạn'} {e.overdue && <span className="badge tone-overdue">Quá hạn</span>}</p><span className="badge">{display(e.state)}</span></div></section>
    {!own && <Notice>Đây là đăng ký của người khác. Chỉ người học mới được hoàn thành học phần và làm quiz.</Notice>}
    {e.state === 'LOCKED' && <Notice>Đăng ký đã bị khóa theo điều kiện đào tạo. Xem điểm danh và số lượt thi, liên hệ quản lý đào tạo để được học lại.</Notice>}
    <nav className="tabs" aria-label="Nội dung khóa học"><Link className={!quizTab && !resultTab ? 'active' : ''} to={`${prefix}/learning/${id}${location.search}${location.hash}`}>Học phần</Link><Link className={quizTab ? 'active' : ''} to={`${prefix}/learning/${id}/quiz${location.search}${location.hash}`}>Bài kiểm tra</Link><Link className={resultTab ? 'active' : ''} to={`${prefix}/learning/${id}/results${location.search}${location.hash}`}>Kết quả & thực hành</Link></nav>
    {eligibility.isFetching && !gate ? <LoadingState label="Đang kiểm tra điều kiện…" /> : eligibility.error ? <ErrorState error={eligibility.error} /> : <section className="panel mb-6"><div className="section-header"><h3>Điều kiện dự thi</h3><span className="badge">{gate?.eligible ? 'Đủ điều kiện' : 'Chưa mở bài thi'}</span></div><p>Điểm danh {gate?.attendancePct ?? '—'}% / {gate?.minAttendancePct ?? '—'}% · {gate?.missingModules.length ?? '—'} học phần chưa xong · {gate?.retakesLeft ?? '—'} lần thi lại còn</p>{!!gate?.missingModules.length && <p>Cần học/đọc lại: {gate.missingModules.map(m => display(m.moduleType)).join(', ')}</p>}</section>}
    {(enrollment.isFetching || modules.isFetching || eligibility.isFetching) && e && <p role="status" className="muted">Đang cập nhật tiến độ từ máy chủ…</p>}
    {error !== null && <ErrorState error={error} />}
    {modules.error && modules.currentData && <ErrorState error={modules.error} retry={()=>void modules.refetch()}/> }
    {!quizTab && !resultTab && (modules.isFetching && !modules.currentData ? <LoadingState /> : modules.error && !modules.currentData ? <ErrorState error={modules.error} retry={()=>void modules.refetch()} /> : <LessonReader items={(modules.currentData as EnrollmentModuleDto[]|undefined)??[]} enrollment={e} own={own} userId={Number(user?.id)} busy={mutation.isLoading||modules.isFetching||enrollment.isFetching} finish={finish}/>)}
    {e.state === 'CLOSED' && <Notice>Đăng ký đã đóng. Chỉ xem lịch sử; không tiếp tục học, thi hoặc thực hành.</Notice>}
    {quizTab && (own && e.state === 'ELIGIBLE' && gate?.eligible && !quizPassed ? <LearnerQuiz key={enrollmentId + e.enrolledAt} enrollmentId={enrollmentId} /> : <><Notice>{quizPassed ? 'Bạn đã đạt bài kiểm tra này. Theo dõi lịch thực hành và kết quả ở tab kế tiếp.' : 'Bài kiểm tra chỉ mở khi học đủ các học phần và đạt điểm danh; đăng ký phải còn đủ điều kiện.'}</Notice>{currentHistories?.length ? <section className="panel"><DataView value={[...currentHistories].sort((a,b) => b.attemptNo - a.attemptNo)[0]} title="Kết quả lần thi gần nhất" /></section> : null}</>)}
    {resultTab && <LearningResults enrollment={e} enrollmentId={enrollmentId} attempts={histories} attemptsError={attempts.error} />}
  </>}</>
}
function LearnerQuiz({ enrollmentId }: { enrollmentId: number }) {
  const query = useReadQuery({ operation: 'Enrollments.Quiz', params: { id: enrollmentId } }), [answers, setAnswers] = useState<Record<number, string>>({}), [send, mutation] = useExecuteMutation(), [error, setError] = useState<unknown>(null), [result, setResult] = useState<QuizAttemptResultDto | null>(null)
  const quiz = query.currentData as LearnerQuizDto | undefined
  useUnsavedChanges(Object.keys(answers).length > 0 && result === null, mutation.isLoading)
  const submitting = useRef(false)
  async function submit() { if (submitting.current || !quiz) return; submitting.current = true; setError(null); try { const data = await send({ operation: 'Enrollments.AttemptQuiz', params: { id: enrollmentId }, body: { answers: quiz?.questions.map(q => ({ questionId: q.id, selectedOption: answers[q.id] ?? null })) ?? [] } }).unwrap(); setResult(data as QuizAttemptResultDto) } catch (e) { setError(e) } finally { submitting.current = false } }
  if (query.isFetching && !query.currentData) return <LoadingState />
  if (query.error) return <ErrorState error={query.error} />
  return <section className="panel"><h2>{quiz?.title}</h2><p className="muted">Điểm đạt: {quiz?.passScore}% · Mỗi câu chọn một đáp án. Bỏ trống được tính sai.</p>{result ? <DataView value={result} /> : <form key={quiz?.attemptNo} onSubmit={e => { e.preventDefault(); void submit() }}>{quiz?.questions.map((q, i) => <fieldset className="quiz-question" key={q.id}><legend>{i + 1}. {q.questionText}</legend>{q.options.map(o => <label className="quiz-option" key={o.key}><input type="radio" name={'question-' + q.id} value={o.key} checked={answers[q.id] === o.key} onChange={() => setAnswers({ ...answers, [q.id]: o.key })} />{o.text}</label>)}</fieldset>)}{error !== null && <ErrorState error={error} />}<Button type="submit" disabled={mutation.isLoading || !quiz?.questions.length}>{mutation.isLoading ? 'Đang chấm bài…' : 'Nộp bài kiểm tra'}</Button></form>}</section>
}
function LearningResults({ enrollment, enrollmentId, attempts, attemptsError }: { enrollment: EnrollmentDto; enrollmentId: number; attempts?: QuizAttemptResultDto[]; attemptsError?: unknown }) {
  const videos = useReadQuery({ operation: 'Enrollments.PracticalVideos', params: { id: enrollmentId } })
  return <><section className="panel"><h2>Lịch sử bài thi</h2>{attemptsError ? <ErrorState error={attemptsError} /> : <DataView value={attempts ?? []} />}</section><PracticalSchedulePanel enrollment={enrollment} /><section className="panel mt-6"><h2>Bản ghi thực hành</h2>{videos.isFetching ? <LoadingState /> : videos.error ? <ErrorState error={videos.error} /> : Array.isArray(videos.data) && videos.data.map(raw => { const video = asRecord(raw); return <article className="lesson-card" key={String(video.id)}><DataView value={video} /><ProtectedMedia operation="Enrollments.PracticalVideoContent" params={{ id: Number(video.id) }} kind="video" /></article> })}</section></>
}

function LessonReader({items,enrollment,own,userId,busy,finish}:{items:EnrollmentModuleDto[];enrollment:EnrollmentDto;own:boolean;userId:number;busy:boolean;finish:(id:number)=>Promise<void>}) {
  const [search]=useSearchParams(),location=useLocation(),navigate=useNavigate(),[catalog,setCatalog]=useState(false)
  const lessons=items.flatMap(item=>item.module.lessons.map(lesson=>({item,lesson})))
  const [initialLesson] = useState(() => lessons.find(entry=>!entry.item.readLessonIds?.includes(entry.lesson.id))?.lesson.id ?? lessons[0]?.lesson.id)
  const requested=search.has('lesson') ? Number(search.get('lesson')) : initialLesson
  const selected=lessons.find(entry=>entry.lesson.id===requested)??lessons.find(entry=>!entry.item.readLessonIds?.includes(entry.lesson.id))??lessons[0]
  function choose(id:number){const next=new URLSearchParams(search);next.set('lesson',String(id));void navigate({pathname:location.pathname,search:'?'+next.toString(),hash:location.hash},{replace:true,preventScrollReset:true,state:location.state});setCatalog(false)}
  if(!selected)return <Notice>Khóa học chưa có bài học.</Notice>
  const {item,lesson:l}=selected,index=lessons.indexOf(selected)
  return <div className="lesson-workspace"><Button className="catalog-toggle" variant="outline" aria-expanded={catalog} aria-controls="lesson-catalog" onClick={()=>setCatalog(!catalog)}>Danh mục bài học</Button><nav id="lesson-catalog" className={'lesson-catalog '+(catalog?'catalog-open':'')} aria-label="Danh mục bài học">{items.map(module=><div key={module.module.id}><h3>{module.module.moduleOrder}. {display(module.module.moduleType)}</h3><p className="field-help">{module.lessonsRead??0}/{module.lessonsTotal??module.module.lessons.length} bài · {module.module.durationMinutes??'—'} phút</p>{module.module.lessons.map(lesson=><button key={lesson.id} className={lesson.id===l.id?'active':''} aria-current={lesson.id===l.id?'step':undefined} onClick={()=>choose(lesson.id)}><span>{lesson.title}</span><small>{module.readLessonIds?.includes(lesson.id)?'Đã hoàn thành':'Chưa hoàn thành'}</small></button>)}</div>)}</nav><section className="panel lesson-reader"><p className="eyebrow">BÀI {index+1} / {lessons.length}</p><h2>{l.title}</h2><p className="muted">{item.readLessonIds?.includes(l.id)?'Đã đánh dấu hoàn thành':'Chưa hoàn thành'}</p>{l.content&&<div className="lesson-prose whitespace-pre-wrap">{l.content}</div>}{l.reference!==null&&<DataView value={l.reference} title="Tiêu chuẩn tham chiếu"/>}{l.mediaUrl&&/^https?:\/\//.test(l.mediaUrl)&&<a href={l.mediaUrl} className="text-link" target="_blank" rel="noreferrer">Mở tài liệu học</a>}{l.media?.map(picture=><ProtectedMedia key={picture.id} operation="LessonMedia.Get" params={{id:picture.id}} kind="image"/>)}{l.fieldNotes?.length?<DataView value={l.fieldNotes} title="Ghi chú thực tế"/>:null}<div className="lesson-actions">{own&&['ASSIGNED','IN_PROGRESS','ELIGIBLE'].includes(enrollment.state)&&<Button disabled={!canReadLesson(enrollment,userId,item,l.id)||busy} onClick={()=>void finish(l.id)}>{item.readLessonIds?.includes(l.id)?'Đã hoàn thành bài':'Đánh dấu hoàn thành bài'}</Button>}<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={index===0} onClick={()=>choose(lessons[index-1].lesson.id)}>Bài trước</Button>{index<lessons.length-1?<Button variant="outline" onClick={()=>choose(lessons[index+1].lesson.id)}>Bài tiếp theo →</Button>:<p className="field-help">Đã đến bài cuối. Xem điều kiện dự thi ở phía trên.</p>}</div></div></section></div>
}
