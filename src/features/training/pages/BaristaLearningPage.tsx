import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState, FormMessage, LoadState, Panel } from '@/components/common/Panel'
import { StatusBadge } from '@/components/common/StatusBadge'
import { summarizeAttendance } from '@/features/attendance/attendanceRules'
import { MIN_ATTENDANCE_PERCENT } from '@/constants/training'
import { normalizeApiError } from '@/services/apiError'
import { useTrainingData } from '@/hooks/useTrainingData'
import { mutateTrainingAssignment } from '../trainingSlice'
import { isActive, isOverdue, passedQuizFor, stageOf, STAGE_LABELS, STAGE_VARIANTS } from '../trainingProgress'

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : 'No deadline')

export function BaristaLearningPage() {
  const user = useAppSelector((state) => state.auth.user)!
  const dispatch = useAppDispatch()
  const data = useTrainingData()
  const [error, setError] = useState<string | null>(null)
  const mine = data.assignments.filter((assignment) => assignment.traineeId === user.id)
  const enrolledCourseIds = new Set(mine.filter(isActive).map((assignment) => assignment.courseId))
  const certifiedCourseIds = new Set(mine.filter((assignment) => stageOf(assignment, data.facts) === 'CERTIFIED').map((assignment) => assignment.courseId))
  const available = data.courses.filter((course) => !course.archived && !enrolledCourseIds.has(course.id) && !certifiedCourseIds.has(course.id))

  async function run(command: Parameters<typeof mutateTrainingAssignment>[0]) {
    setError(null)
    const result = await dispatch(mutateTrainingAssignment(command))
    if (mutateTrainingAssignment.rejected.match(result)) setError(result.payload?.message ?? normalizeApiError(result.error).message)
    else data.reload()
  }

  return (
    <>
      <PageHeader title="My learning" description="Enrol in a course, learn the procedure, pass the quiz, then take the practical." />
      <LoadState loading={data.loading} error={data.error} />
      <FormMessage error={error} />

      <Panel title="My courses">
        {mine.length === 0 ? <EmptyState>You are not enrolled in any course yet. Pick one below.</EmptyState> : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {mine.map((assignment) => {
              const course = data.courses.find((item) => item.id === assignment.courseId)
              const stage = stageOf(assignment, data.facts)
              const attendance = summarizeAttendance(data.attendance.filter((record) => record.assignmentId === assignment.id))
              const attempts = data.quizzes.filter((quiz) => quiz.assignmentId === assignment.id)
              const best = attempts.length ? Math.max(...attempts.map((quiz) => Math.round(quiz.scorePercent))) : null
              const sops = data.sops.filter((sop) => assignment.sopVersionIds.includes(sop.id))
              const quizPassed = !!passedQuizFor(assignment, data.facts)
              const canQuiz = assignment.status === 'IN_PROGRESS' && !quizPassed && attendance.meetsMinimum
              return (
                <li key={assignment.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium">{course?.title ?? 'Course'}</h3>
                    <div className="flex gap-2">
                      {isOverdue(assignment, stage) && <StatusBadge variant="error">Overdue</StatusBadge>}
                      <StatusBadge variant={STAGE_VARIANTS[stage]}>{STAGE_LABELS[stage]}</StatusBadge>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">Deadline</dt><dd>{formatDate(assignment.dueAt)}</dd></div>
                    <div><dt className="text-muted-foreground">Quiz (pass {assignment.quizPassingScore}%)</dt><dd>{best === null ? 'Not taken' : `Best ${best}%`}</dd></div>
                    <div><dt className="text-muted-foreground">Attendance</dt><dd>{attendance.sessions === 0 ? 'No sessions yet' : `${attendance.percent}% of ${attendance.present + attendance.absent} counted`}</dd></div>
                  </dl>
                  {!attendance.meetsMinimum && <p role="alert" className="mt-3 text-sm text-destructive">Attendance is below {MIN_ATTENDANCE_PERCENT}%, so the quiz is closed. Speak to your trainer.</p>}
                  {sops.length > 0 && assignment.status !== 'CANCELLED' && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-medium">Procedure</summary>
                      {sops.map((sop) => (
                        <div key={sop.id} className="mt-2"><p className="text-muted-foreground">{sop.purpose}</p><ol className="mt-1 list-decimal pl-5">{sop.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></div>
                      ))}
                    </details>
                  )}
                  {stage === 'PRACTICAL_PENDING' && <p className="mt-3 text-sm">Quiz passed. Your trainer will assess your practical at the counter.</p>}
                  {stage === 'PRACTICAL_FAILED' && <p className="mt-3 text-sm text-destructive">The practical did not pass. Your trainer will schedule another assessment.</p>}
                  {stage === 'AWAITING_CERTIFICATE' && <p className="mt-3 text-sm">Practical passed. Your certificate is being issued.</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {assignment.status === 'ASSIGNED' && <Button size="sm" onClick={() => run({ operation: 'start', id: assignment.id })}>Start learning</Button>}
                    {canQuiz && <Button size="sm" asChild><Link to={`/barista/quiz/${assignment.id}`}>Take the quiz</Link></Button>}
                    {stage === 'CERTIFIED' && <Button size="sm" variant="outline" asChild><Link to="/barista/certificates">View certificate</Link></Button>}
                    {isActive(assignment) && stage !== 'CERTIFIED' && <Button size="sm" variant="ghost" onClick={() => run({ operation: 'cancel', id: assignment.id })}>Withdraw</Button>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Available courses" description="Enrol yourself on any active course you are not already taking.">
        {available.length === 0 ? <EmptyState>No other courses are open for enrolment.</EmptyState> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {available.map((course) => (
              <li key={course.id} className="flex items-start justify-between gap-3 rounded-lg border p-4">
                <div><h3 className="font-medium">{course.title}</h3><p className="mt-1 text-sm text-muted-foreground">{course.description || 'No description.'}</p></div>
                <Button size="sm" disabled={!user.branchId} title={user.branchId ? undefined : 'Your account has no branch'} onClick={() => run({ operation: 'assign', input: { courseId: course.id, traineeId: user.id, branchId: user.branchId ?? '', dueAt: null } })}>Enrol</Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
