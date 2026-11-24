import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  Clock,
  Lock,
  MapPin,
  RotateCcw,
  UserRound,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ErrorBox, Loading, StateBadge, SuccessBox, useAction } from '@/components/common/Kit'
import { useAppSelector } from '@/app/hooks'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { CertificateBadgeCard, CertificatePreviewModal } from '@/components/common/CertificateBadgeCard'
import { LessonReferenceView } from '@/components/common/LessonReferenceView'
import { brewforgeApi } from '@/services/brewforgeApi'
import { normalizeApiError } from '@/services/apiError'
import { AuthenticatedVideo } from '@/components/common/AuthenticatedMedia'
import { cn } from '@/utils/cn'
import { ProgressBar, ScoreRing } from './learnerUi'
import { courseTypeLabel, fmtDay, fmtDayTime, moduleLabel, splitTitle } from './learnerFormat'
import type {
  CertificateDto,
  EligibilityDto,
  EnrollmentDto,
  EnrollmentModuleDto,
  LearnerQuizDto,
  PracticalScheduleDto,
  PracticalVideoDto,
  QuizAttemptResultDto,
  SkillDto,
} from '@/types/backend'

const two = (n: number) => String(n).padStart(2, '0')
const isFinished = (e: EnrollmentDto) => e.state === 'PASSED' || e.state === 'CLOSED'

// ------------------------------------------------------------------ Trainee Learning

function CourseCard({ enrollment, selected, onSelect }: { enrollment: EnrollmentDto; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className="course-card" aria-pressed={selected} onClick={onSelect}>
      <div className="flex items-center justify-between gap-3">
        <span className="kicker">{courseTypeLabel(enrollment.courseType)}</span>
        <StateBadge value={enrollment.state} />
      </div>
      <p className="line-clamp-2 min-h-[2.6em] text-[16px] font-semibold leading-snug tracking-[-0.01em]">{splitTitle(enrollment.courseTitle).name}</p>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold tabular-nums">{enrollment.progressPercent}%</span>
        </div>
        <ProgressBar value={enrollment.progressPercent} label={`${enrollment.courseTitle} progress`} />
      </div>
      <p className={cn('flex items-center gap-1.5 text-[13px]', enrollment.overdue ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
        <CalendarDays className="size-3.5" aria-hidden="true" />
        {enrollment.overdue ? `Overdue since ${fmtDay(enrollment.dueDate)}` : `Due ${fmtDay(enrollment.dueDate)}`}
      </p>
    </button>
  )
}

function Gate({ ok, title, detail }: { ok: boolean | null; title: string; detail: string }) {
  return (
    <div className={cn('gate', ok === true && 'is-ok', ok === false && 'is-bad')}>
      <span className="gate-ico" aria-hidden="true">
        {ok ? <Check className="size-3.5" strokeWidth={3} /> : <Lock className="size-3.5" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

export function TraineeLearningPage() {
  const navigate = useNavigate()
  const enrollmentsLoader = useCallback(() => brewforgeApi.enrollments.mine(), [])
  const enrollments = useAsyncLoad(enrollmentsLoader, [] as EnrollmentDto[])

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentDto | null>(null)
  const [modules, setModules] = useState<EnrollmentModuleDto[]>([])
  const [eligibility, setEligibility] = useState<EligibilityDto | null>(null)
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null)
  const [schedules, setSchedules] = useState<PracticalScheduleDto[]>([])
  const [videos, setVideos] = useState<PracticalVideoDto[]>([])
  const [detailError, setDetailError] = useState<string | null>(null)

  const action = useAction()

  const loadEnrollmentDetails = useCallback(async (id: number, keepModule = false) => {
    setSelectedId(id)
    setDetailError(null)
    try {
      const [e, mList, elig, sched, vid] = await Promise.all([
        brewforgeApi.enrollments.get(id),
        brewforgeApi.enrollments.modules(id),
        brewforgeApi.enrollments.eligibility(id),
        brewforgeApi.practicalSchedules.forEnrollment(id),
        brewforgeApi.enrollments.listPracticalVideos(id),
      ])
      setSelectedEnrollment(e)
      setModules(mList)
      setEligibility(elig)
      setSchedules(sched)
      setVideos(vid)
      if (!keepModule) {
        // Open on the first module still to do, so a returning learner continues where they stopped.
        const next = mList.find((m) => !m.completed) ?? mList[0]
        setActiveModuleId(next ? next.module.id : null)
      }
    } catch (err) {
      setDetailError(normalizeApiError(err).message)
    }
  }, [])

  useEffect(() => {
    if (selectedId === null && enrollments.data.length > 0) {
      const first = enrollments.data.find((e) => !isFinished(e)) ?? enrollments.data[0]
      const timer = window.setTimeout(() => {
        void loadEnrollmentDetails(first.id)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [enrollments.data, selectedId, loadEnrollmentDetails])

  const active = enrollments.data.filter((e) => !isFinished(e))
  const finished = enrollments.data.filter(isFinished)
  const activeIndex = modules.findIndex((m) => m.module.id === activeModuleId)
  const activeModule = activeIndex >= 0 ? modules[activeIndex] : null
  const doneCount = modules.filter((m) => m.completed).length

  const handleCompleteModule = (moduleId: number) => {
    if (!selectedId) return
    void action.run(
      () => brewforgeApi.enrollments.completeModule(selectedId, moduleId),
      'Module completed.',
      () => {
        enrollments.reload()
        const next = modules.slice(activeIndex + 1).find((m) => !m.completed)
        if (next) setActiveModuleId(next.module.id)
        void loadEnrollmentDetails(selectedId, true)
      },
    )
  }

  const goTo = (index: number) => {
    const target = modules[index]
    if (!target) return
    setActiveModuleId(target.module.id)
    document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <PageHeader
        title="My learning"
        description="Study each module of your course, pass the theory quiz, then show your skill at the practical."
      />
      <ErrorBox error={action.error ?? enrollments.error ?? detailError} />
      <SuccessBox message={action.message} />
      <Loading show={enrollments.loading} />

      {!enrollments.loading && enrollments.data.length === 0 && (
        <p className="rounded-xl border border-dashed border-input p-10 text-center text-muted-foreground">
          You are not enrolled in any course right now.
        </p>
      )}

      {active.length > 0 && (
        <section className="mb-10" aria-labelledby="in-progress">
          <h2 id="in-progress" className="mb-4 text-[17px] font-semibold">In progress <span className="text-muted-foreground">· {active.length}</span></h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((e) => (
              <CourseCard key={e.id} enrollment={e} selected={selectedId === e.id} onSelect={() => void loadEnrollmentDetails(e.id)} />
            ))}
          </div>
        </section>
      )}

      {selectedEnrollment && (
        <section className="surface mb-10 overflow-hidden" aria-label="Selected course">
          <header className="flex flex-wrap items-center gap-6 border-b border-border p-6 md:p-8">
            <ScoreRing value={selectedEnrollment.progressPercent} size={84} stroke={7} tone={selectedEnrollment.progressPercent >= 100 ? 'success' : 'ink'}>
              <span className="text-[22px] font-bold tabular-nums">{selectedEnrollment.progressPercent}</span>
              <span className="text-[11px] text-muted-foreground">%</span>
            </ScoreRing>
            <div className="min-w-0 flex-1">
              <p className="kicker">{courseTypeLabel(selectedEnrollment.courseType)} · {doneCount} of {modules.length} modules done</p>
              <h2 className="mt-1.5 text-[clamp(22px,2.4vw,30px)] font-bold leading-tight tracking-[-0.025em] text-balance">{selectedEnrollment.courseTitle}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Enrolled {fmtDay(selectedEnrollment.enrolledAt)} · Due {fmtDay(selectedEnrollment.dueDate)}</p>
            </div>
            {eligibility?.eligible ? (
              <Button size="default" onClick={() => navigate(`/trainee/quiz/${selectedEnrollment.id}`)}>
                Start the quiz <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button size="default" variant="outline" disabled>
                <Lock aria-hidden="true" /> Quiz locked
              </Button>
            )}
          </header>

          {eligibility && (
            <div className="grid gap-3 border-b border-border bg-background/50 p-6 md:grid-cols-3 md:px-8">
              <Gate
                ok={eligibility.missingModules.length === 0}
                title="Modules"
                detail={eligibility.missingModules.length === 0 ? 'All modules completed' : `${eligibility.missingModules.length} still to complete`}
              />
              <Gate
                ok={eligibility.attendancePct >= eligibility.minAttendancePct}
                title="Attendance"
                detail={`${eligibility.attendancePct}% · minimum ${eligibility.minAttendancePct}%`}
              />
              <Gate
                ok={eligibility.retakesLeft > 0 ? true : selectedEnrollment.state === 'PASSED' ? true : false}
                title="Quiz attempts"
                detail={`${eligibility.retakesLeft} retake${eligibility.retakesLeft === 1 ? '' : 's'} left`}
              />
            </div>
          )}

          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
            <nav aria-label="Course modules" className="lg:sticky lg:top-24 lg:self-start">
              <p className="mb-3 text-[13px] font-medium text-muted-foreground">Syllabus</p>
              <ol className="syllabus">
                {modules.map((m) => (
                  <li key={m.module.id}>
                    <button
                      type="button"
                      className={cn('syl-item', m.completed && 'is-done')}
                      aria-current={m.module.id === activeModuleId ? 'step' : undefined}
                      onClick={() => setActiveModuleId(m.module.id)}
                    >
                      <span className="syl-dot">{m.completed ? <Check className="size-3.5" strokeWidth={3} aria-label="Completed" /> : two(m.module.moduleOrder)}</span>
                      <span className="min-w-0 truncate">{moduleLabel(m.module.moduleType)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            <article id="reader" className="reader min-w-0 scroll-mt-24">
              {activeModule ? (
                <>
                  <p className="kicker">Module {two(activeModule.module.moduleOrder)} of {two(modules.length)}</p>
                  <h2 className="mt-2">{moduleLabel(activeModule.module.moduleType)}</h2>
                  <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{activeModule.module.lessons.length} lesson{activeModule.module.lessons.length === 1 ? '' : 's'}</span>
                    {activeModule.module.durationMinutes != null && (
                      <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden="true" />{activeModule.module.durationMinutes} min</span>
                    )}
                    {activeModule.completed && (
                      <span className="inline-flex items-center gap-1.5 font-medium text-[var(--mint)]"><Check className="size-3.5" strokeWidth={3} aria-hidden="true" />Completed {fmtDay(activeModule.completedAt)}</span>
                    )}
                  </p>

                  <div className="mt-8">
                    {activeModule.module.lessons.map((lesson) => (
                      <section key={lesson.id} className="lesson">
                        <p className="lesson-no">Lesson {two(lesson.lessonOrder)}</p>
                        <h3 className="lesson-title">{lesson.title}</h3>
                        {lesson.content ? (
                          <p className="lesson-body">{lesson.content}</p>
                        ) : (
                          !lesson.reference && <p className="lesson-body">Read the standard recipe instructions.</p>
                        )}
                        {lesson.mediaUrl && (
                          <a href={lesson.mediaUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-brand/50 underline-offset-4 hover:decoration-brand">
                            Open training media <ArrowRight className="size-3.5" aria-hidden="true" />
                          </a>
                        )}
                        <LessonReferenceView moduleType={activeModule.module.moduleType} reference={lesson.reference} />
                      </section>
                    ))}
                    {activeModule.module.lessons.length === 0 && <p className="text-muted-foreground">This module has no lessons yet.</p>}
                  </div>

                  <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                    <Button variant="ghost" disabled={activeIndex <= 0} onClick={() => goTo(activeIndex - 1)}>
                      <ArrowLeft aria-hidden="true" /> Previous
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                      {!activeModule.completed && (
                        <Button disabled={action.busy} onClick={() => handleCompleteModule(activeModule.module.id)}>
                          <Check aria-hidden="true" /> Mark as completed
                        </Button>
                      )}
                      <Button variant="outline" disabled={activeIndex >= modules.length - 1} onClick={() => goTo(activeIndex + 1)}>
                        Next module <ArrowRight aria-hidden="true" />
                      </Button>
                    </div>
                  </footer>
                </>
              ) : (
                <p className="text-muted-foreground">Select a module to start reading.</p>
              )}
            </article>
          </div>

          <div className="border-t border-border p-6 md:p-8">
            <h3 className="text-[17px] font-semibold">Practical exam</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your trainer watches you make the drink and records a video as evidence.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                {schedules.map((s) => (
                  <div key={s.id} className="flex items-start gap-4 rounded-xl border border-border p-4">
                    <div className="grid w-14 shrink-0 place-items-center rounded-lg bg-accent/70 py-2 text-center leading-none">
                      <span className="text-[11px] font-medium uppercase text-muted-foreground">{new Date(s.scheduledAt).toLocaleDateString('en-GB', { month: 'short' })}</span>
                      <span className="mt-1 text-[22px] font-bold tabular-nums">{new Date(s.scheduledAt).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{fmtDayTime(s.scheduledAt)}</p>
                        <StateBadge value={s.status} />
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground"><UserRound className="size-3.5" aria-hidden="true" />{s.trainerName ?? 'Trainer'}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-3.5" aria-hidden="true" />{s.location}</p>
                    </div>
                  </div>
                ))}
                {schedules.length === 0 && <p className="rounded-xl border border-dashed border-input p-6 text-center text-sm text-muted-foreground">No practical scheduled yet.</p>}
              </div>
              <div className="space-y-3">
                {videos.map((v) => (
                  <div key={v.id} className="overflow-hidden rounded-xl border border-border">
                    <AuthenticatedVideo videoId={v.id} />
                    <p className="px-4 py-2.5 text-[13px] text-muted-foreground">Practical recording #{v.id}</p>
                  </div>
                ))}
                {videos.length === 0 && <p className="rounded-xl border border-dashed border-input p-6 text-center text-sm text-muted-foreground">No practical video uploaded yet.</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section aria-labelledby="completed">
          <h2 id="completed" className="mb-4 text-[17px] font-semibold">Completed <span className="text-muted-foreground">· {finished.length}</span></h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {finished.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => void loadEnrollmentDetails(e.id)}
                  aria-pressed={selectedId === e.id}
                  className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-accent/40 aria-pressed:bg-accent/60"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--mint)] text-[#13261a]"><Check className="size-4" strokeWidth={3} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{e.courseTitle}</span>
                  <span className="hidden text-[13px] text-muted-foreground sm:inline">{courseTypeLabel(e.courseType)}</span>
                  <span className="hidden text-[13px] tabular-nums text-muted-foreground md:inline">{fmtDay(e.completedAt ?? e.dueDate)}</span>
                  <StateBadge value={e.state} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Quiz Page

export function QuizPage() {
  const { enrollmentId } = useParams()
  const navigate = useNavigate()
  const action = useAction()

  const [quizData, setQuizData] = useState<LearnerQuizDto | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [current, setCurrent] = useState(0)
  const [attemptResult, setAttemptResult] = useState<QuizAttemptResultDto | null>(null)
  const [pastAttempts, setPastAttempts] = useState<QuizAttemptResultDto[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadQuiz = useCallback(async (id: number) => {
    const [q, att] = await Promise.all([
      brewforgeApi.enrollments.getQuiz(id),
      brewforgeApi.enrollments.listQuizAttempts(id),
    ])
    setQuizData(q)
    setPastAttempts(att)
  }, [])

  useEffect(() => {
    if (!enrollmentId) return
    let active = true
    const id = Number(enrollmentId)
    Promise.all([
      brewforgeApi.enrollments.getQuiz(id),
      brewforgeApi.enrollments.listQuizAttempts(id),
    ])
      .then(([q, att]) => {
        if (active) {
          setQuizData(q)
          setPastAttempts(att)
        }
      })
      .catch((err) => {
        if (active) setLoadError(normalizeApiError(err).message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId])

  const questions = useMemo(() => quizData?.questions ?? [], [quizData])
  const answered = questions.filter((q) => answers[q.id] != null).length
  const question = questions[current]
  const allAnswered = questions.length > 0 && answered === questions.length

  const handleSubmitQuiz = () => {
    if (!enrollmentId || !quizData) return
    const formatted = Object.entries(answers).map(([qId, opt]) => ({
      questionId: Number(qId),
      selectedOption: opt,
    }))

    void action.run(
      () => brewforgeApi.enrollments.attemptQuiz(Number(enrollmentId), formatted),
      undefined,
      (res) => {
        setAttemptResult(res)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        void loadQuiz(Number(enrollmentId))
      },
    )
  }

  const retake = () => {
    setAttemptResult(null)
    setAnswers({})
    setCurrent(0)
  }

  const back = (
    <Button variant="ghost" onClick={() => navigate('/trainee/learning')}>
      <ArrowLeft aria-hidden="true" /> Back to learning
    </Button>
  )

  return (
    <>
      <PageHeader
        title={quizData?.title ?? 'Theory quiz'}
        description={quizData ? `${questions.length} questions · pass mark ${quizData.passScore}% · ${quizData.retakesLeft} retake${quizData.retakesLeft === 1 ? '' : 's'} left` : 'Answer every question, then submit once.'}
        action={back}
      />
      <ErrorBox error={action.error ?? loadError} />
      <Loading show={loading} text="Loading the quiz…" />

      {attemptResult && (
        <section className="quiz-stage mb-8 overflow-hidden" aria-live="polite">
          <div className="flex flex-col items-center gap-6 p-8 text-center md:flex-row md:p-10 md:text-left">
            <ScoreRing value={attemptResult.score} size={148} stroke={10} tone={attemptResult.passed ? 'success' : 'error'}>
              <span className="text-[40px] font-bold tracking-[-0.03em] tabular-nums">{attemptResult.score}</span>
              <span className="mt-1 block text-[12px] text-muted-foreground">of 100</span>
            </ScoreRing>
            <div className="min-w-0 flex-1">
              <p className="kicker">Attempt {attemptResult.attemptNo}</p>
              <h2 className="mt-2 text-[clamp(26px,3vw,38px)] font-bold leading-tight tracking-[-0.03em]">
                {attemptResult.passed ? 'You passed the quiz.' : 'Not this time.'}
              </h2>
              <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
                {attemptResult.passed
                  ? 'Next step: the practical with your trainer.'
                  : `You need ${attemptResult.passScore}% to pass. ${attemptResult.retakesLeft > 0 ? `You have ${attemptResult.retakesLeft} retake${attemptResult.retakesLeft === 1 ? '' : 's'} left.` : 'No retakes left, ask your training manager.'}`}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                {!attemptResult.passed && attemptResult.retakesLeft > 0 && (
                  <Button onClick={retake}><RotateCcw aria-hidden="true" /> Try again</Button>
                )}
                <Button variant="outline" onClick={() => navigate('/trainee/learning')}>Back to learning</Button>
              </div>
            </div>
          </div>
          {attemptResult.perModule.length > 0 && (
            <div className="grid gap-x-8 gap-y-4 border-t border-border bg-background/50 p-6 sm:grid-cols-2 md:px-10">
              {attemptResult.perModule.map((m) => (
                <div key={m.moduleType}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>{moduleLabel(m.moduleType)}</span>
                    <span className="font-semibold tabular-nums">{m.correct}/{m.total}</span>
                  </div>
                  <ProgressBar value={m.total ? (m.correct / m.total) * 100 : 0} label={`${moduleLabel(m.moduleType)} score`} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {quizData && !attemptResult && question && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="quiz-stage p-6 md:p-10" aria-labelledby={`q-${question.id}-text`}>
            <div className="mb-8">
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="font-medium tabular-nums">Question {current + 1} <span className="text-muted-foreground">of {questions.length}</span></span>
                <span className="text-muted-foreground tabular-nums">{answered} answered</span>
              </div>
              <ProgressBar value={((current + 1) / questions.length) * 100} label="Quiz position" />
            </div>

            <p className="kicker">{moduleLabel(question.moduleType)}</p>
            <h2 id={`q-${question.id}-text`} className="quiz-q mt-3">{question.questionText}</h2>

            <fieldset className="mt-8 space-y-3">
              <legend className="sr-only">Choose one answer</legend>
              {question.options.map((opt) => (
                <label key={opt.key} className="opt">
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={opt.key}
                    checked={answers[question.id] === opt.key}
                    onChange={() => setAnswers({ ...answers, [question.id]: opt.key })}
                  />
                  <span className="opt-key" aria-hidden="true">{opt.key}</span>
                  <span>{opt.text}</span>
                </label>
              ))}
            </fieldset>

            <div className="mt-10 flex items-center justify-between gap-3">
              <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
                <ArrowLeft aria-hidden="true" /> Previous
              </Button>
              {current < questions.length - 1 ? (
                <Button onClick={() => setCurrent(current + 1)}>
                  Next <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <Button variant="accent" disabled={action.busy || !allAnswered} onClick={handleSubmitQuiz}>
                  {action.busy ? 'Submitting…' : 'Submit answers'}
                </Button>
              )}
            </div>
          </section>

          <aside className="quiz-stage h-fit p-5 lg:sticky lg:top-24" aria-label="Question navigator">
            <p className="text-sm font-semibold">Questions</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{answered} of {questions.length} answered</p>
            <div className="qnav mt-4">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  className={cn(answers[q.id] != null && 'is-answered')}
                  aria-current={i === current}
                  aria-label={`Question ${i + 1}${answers[q.id] != null ? ', answered' : ''}`}
                  onClick={() => setCurrent(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button className="mt-5 w-full" variant="accent" disabled={action.busy || !allAnswered} onClick={handleSubmitQuiz}>
              Submit answers
            </Button>
            {!allAnswered && <p className="mt-2 text-center text-[12.5px] text-muted-foreground">Answer all questions to submit.</p>}
          </aside>
        </div>
      )}

      {pastAttempts.length > 0 && (
        <section className="mt-10" aria-labelledby="history">
          <h2 id="history" className="mb-4 text-[17px] font-semibold">Previous attempts</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {pastAttempts.map((a) => (
              <li key={a.attemptNo} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <span className="w-20 font-medium tabular-nums">Attempt {a.attemptNo}</span>
                <span className="flex-1"><ProgressBar value={a.score} label={`Attempt ${a.attemptNo} score`} className="max-w-xs" /></span>
                <span className="w-12 text-right font-semibold tabular-nums">{a.score}%</span>
                <StateBadge value={a.passed ? 'PASSED' : 'FAILED'} />
                <span className="hidden w-44 text-right text-muted-foreground md:inline">{fmtDayTime(a.attemptedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Certificates & Skills

export function CertificatesPage() {
  const user = useAppSelector((state) => state.auth.user)
  const certsLoader = useCallback(() => brewforgeApi.certificates.mine(), [])
  const certs = useAsyncLoad(certsLoader, [] as CertificateDto[])

  const skillsLoader = useCallback(() => brewforgeApi.certificates.mySkills(), [])
  const skills = useAsyncLoad(skillsLoader, [] as SkillDto[])

  const [activeCertificate, setActiveCertificate] = useState<CertificateDto | null>(null)

  const certified = skills.data.filter((s) => s.status === 'CERTIFIED').length

  const handleOpenSkillCertificate = async (s: SkillDto) => {
    const existing = certs.data.find(
      (c) => (s.certificateId != null && c.id === s.certificateId) || c.courseId === s.courseId,
    )
    if (existing) {
      setActiveCertificate(existing)
      return
    }
    if (s.certificateId != null) {
      try {
        const fetched = await brewforgeApi.certificates.get(s.certificateId)
        setActiveCertificate(fetched)
        return
      } catch {
        // fallback below
      }
    }
    if (s.status === 'CERTIFIED' || s.issuedAt) {
      setActiveCertificate({
        id: s.certificateId ?? s.courseId,
        userId: user?.numericId ?? 0,
        fullName: user?.name ?? 'Barista',
        branchId: user?.numericBranchId ?? null,
        courseId: s.courseId,
        courseTitle: s.courseTitle,
        recipeVersionId: s.recipeVersionId,
        recipeCode: null,
        recipeName: splitTitle(s.courseTitle).name,
        versionNo: 1,
        issuedAt: s.issuedAt ?? new Date().toISOString(),
        status: 'VALID',
        supersededBy: null,
      })
    }
  }

  return (
    <>
      <PageHeader
        title="Certificates & skills"
        description="Every drink you are certified to make, bound to the recipe version you were trained on. Click any CERTIFIED skill to open its certificate."
      />
      <ErrorBox error={certs.error ?? skills.error} />

      <section className="mb-12" aria-labelledby="passport">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="passport" className="text-[17px] font-semibold">Skill passport</h2>
          {skills.data.length > 0 && <p className="text-sm text-muted-foreground tabular-nums">{certified} of {skills.data.length} certified</p>}
        </div>
        <Loading show={skills.loading} />
        {!skills.loading && skills.data.length === 0 && <p className="rounded-xl border border-dashed border-input p-8 text-center text-muted-foreground">No skills recorded yet.</p>}
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {skills.data.map((s) => {
            const isCertified = s.status === 'CERTIFIED' || s.certificateId != null
            return (
              <li
                key={s.courseId}
                role={isCertified ? 'button' : undefined}
                tabIndex={isCertified ? 0 : undefined}
                onClick={() => {
                  if (isCertified) void handleOpenSkillCertificate(s)
                }}
                onKeyDown={(e) => {
                  if (isCertified && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    void handleOpenSkillCertificate(s)
                  }
                }}
                className={cn(
                  'flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 transition',
                  isCertified && 'cursor-pointer hover:border-brand/60 hover:bg-accent/40 hover:shadow-md',
                )}
                title={isCertified ? 'Bấm để xem chứng chỉ (Click to view certificate)' : undefined}
              >
                <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', s.status === 'CERTIFIED' ? 'bg-[var(--latte)] text-[var(--ink-fg)]' : 'bg-accent text-muted-foreground')}>
                  {s.status === 'CERTIFIED' ? <Award className="size-[18px]" aria-hidden="true" /> : <Clock className="size-[18px]" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[14.5px] font-medium leading-snug">{splitTitle(s.courseTitle).name}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {s.issuedAt ? `Since ${fmtDay(s.issuedAt)} · Xem chứng chỉ` : 'Not certified yet'}
                  </p>
                </div>
                <StateBadge value={s.status} />
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="certs">
        <h2 id="certs" className="mb-4 text-[17px] font-semibold">Certificates ({certs.data.length})</h2>
        <Loading show={certs.loading} />
        {!certs.loading && certs.data.length === 0 && <p className="rounded-xl border border-dashed border-input p-8 text-center text-muted-foreground">You have not earned a certificate yet.</p>}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {certs.data.map((c) => (
            <CertificateBadgeCard
              key={c.id}
              certificate={c}
              holderName={c.fullName}
              holderRole="BARISTA ACCREDITATION"
            />
          ))}
        </div>
      </section>

      {activeCertificate && (
        <CertificatePreviewModal
          certificate={activeCertificate}
          holderName={activeCertificate.fullName || user?.name || 'Barista'}
          holderRole="BARISTA ACCREDITATION"
          onClose={() => setActiveCertificate(null)}
        />
      )}
    </>
  )
}
