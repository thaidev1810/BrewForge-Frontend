import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState, FormMessage, LoadState, Panel } from '@/components/common/Panel'
import { StatusBadge } from '@/components/common/StatusBadge'
import { demoUsers } from '@/features/auth/mockAuthService'
import { mutateCertificate } from '@/features/certificates/certificateSlice'
import { mutateTrainingAssignment } from '@/features/training/trainingSlice'
import { passedQuizFor, stageOf, type Stage } from '@/features/training/trainingProgress'
import type { TrainingAssignment } from '@/features/training/trainingTypes'
import { buildChecklist } from '@/features/quizzes/quizBuilder'
import { normalizeApiError } from '@/services/apiError'
import { useTrainingData } from '@/hooks/useTrainingData'
import { recordPracticalAssessment } from './assessmentSlice'

const nameOf = (id: string) => demoUsers.find((user) => user.id === id)?.name ?? id
const WAITING: Stage[] = ['PRACTICAL_PENDING', 'PRACTICAL_FAILED', 'AWAITING_CERTIFICATE']

export function PracticalAssessmentsPage() {
  const user = useAppSelector((state) => state.auth.user)!
  const dispatch = useAppDispatch()
  const data = useTrainingData()
  const [openId, setOpenId] = useState<string | null>(null)
  const [marks, setMarks] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const waiting = data.assignments.filter((assignment) => WAITING.includes(stageOf(assignment, data.facts)))
  const open = waiting.find((assignment) => assignment.id === openId) ?? null
  const checklist = open ? buildChecklist(data.sops.filter((sop) => open.sopVersionIds.includes(sop.id))) : []
  const unmarked = checklist.filter((item) => marks[item.criterionId] === undefined).length

  // PASS means a certificate for every SOP version the course teaches, then the enrolment is complete.
  async function certify(assignment: TrainingAssignment, assessmentId: string) {
    for (const sopVersionId of assignment.sopVersionIds) {
      const result = await dispatch(mutateCertificate({ operation: 'issue', input: { assessmentId, sopVersionId } }))
      // An active certificate that already exists is not a failure of this assessment.
      if (mutateCertificate.rejected.match(result) && result.payload?.status !== 409) throw new Error(result.payload?.message ?? 'Unable to issue the certificate.')
    }
    if (assignment.status === 'IN_PROGRESS') await dispatch(mutateTrainingAssignment({ operation: 'complete', id: assignment.id }))
  }

  async function guarded(work: () => Promise<void>) {
    setError(null)
    setOutcome(null)
    setBusy(true)
    try { await work() } catch (caught) { setError(caught instanceof Error ? caught.message : normalizeApiError(caught).message) }
    setBusy(false)
    data.reload()
  }

  const submit = () => open && guarded(async () => {
    const quiz = passedQuizFor(open, data.facts)
    if (!quiz) throw new Error('This trainee has not passed the quiz.')
    const result = await dispatch(recordPracticalAssessment({ operation: 'record', input: { quizAttemptId: quiz.id, assessorId: user.id, notes, criteria: checklist.map((item) => ({ ...item, passed: marks[item.criterionId] })) } }))
    if (recordPracticalAssessment.rejected.match(result)) throw new Error(result.payload?.message ?? 'Unable to record the assessment.')
    const assessment = result.payload
    if (assessment.passed) await certify(open, assessment.id)
    setOutcome(assessment.criticalFailure ? 'AUTO FAIL — a critical criterion failed.' : assessment.passed ? 'PASS — certificate issued.' : 'FAIL — at least one criterion failed.')
    setOpenId(null)
    setMarks({})
    setNotes('')
  })

  const retryCertificate = (assignment: TrainingAssignment) => guarded(async () => {
    const assessment = data.assessments.filter((item) => item.assignmentId === assignment.id && item.passed).at(-1)
    if (!assessment) throw new Error('No passed assessment found.')
    await certify(assignment, assessment.id)
    setOutcome('Certificate issued.')
  })

  return (
    <>
      <PageHeader title="Practical assessments" description="Assess trainees who passed the quiz. A failed critical criterion fails the whole practical." />
      <LoadState loading={data.loading} error={data.error} />
      {outcome && <p role="status" className="mb-4 rounded-lg bg-accent p-4 text-sm font-medium">{outcome}</p>}
      <FormMessage error={error} />
      <Panel title="Waiting for a practical">
        {waiting.length === 0 ? <EmptyState>Nobody is waiting for a practical right now.</EmptyState> : (
          <ul className="divide-y">
            {waiting.map((assignment) => {
              const stage = stageOf(assignment, data.facts)
              const quiz = passedQuizFor(assignment, data.facts)
              return (
                <li key={assignment.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{nameOf(assignment.traineeId)} · {data.courses.find((course) => course.id === assignment.courseId)?.title}</p>
                      <p className="text-sm text-muted-foreground">Quiz {quiz ? `${Math.round(quiz.scorePercent)}%` : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage === 'PRACTICAL_FAILED' && <StatusBadge variant="error">Previous attempt failed</StatusBadge>}
                      {stage === 'AWAITING_CERTIFICATE'
                        ? <Button size="sm" disabled={busy} onClick={() => retryCertificate(assignment)}>Issue certificate</Button>
                        : <Button size="sm" variant={openId === assignment.id ? 'outline' : 'default'} onClick={() => { setOpenId(openId === assignment.id ? null : assignment.id); setMarks({}); setNotes(''); setOutcome(null) }}>{openId === assignment.id ? 'Close' : 'Start assessment'}</Button>}
                    </div>
                  </div>
                  {open?.id === assignment.id && (
                    <div className="mt-4 rounded-lg border p-4">
                      {checklist.map((item) => (
                        <fieldset key={item.criterionId} className="flex flex-wrap items-center justify-between gap-3 border-b py-2 last:border-b-0">
                          <legend className="sr-only">{item.label}</legend>
                          <span className="text-sm">{item.label} {item.critical && <StatusBadge variant="warning">Critical</StatusBadge>}</span>
                          <span className="flex gap-4 text-sm">
                            {([true, false] as const).map((value) => (
                              <label key={String(value)} className="flex items-center gap-1"><input type="radio" name={item.criterionId} checked={marks[item.criterionId] === value} onChange={() => setMarks((current) => ({ ...current, [item.criterionId]: value }))} />{value ? 'Pass' : 'Fail'}</label>
                            ))}
                          </span>
                        </fieldset>
                      ))}
                      <label className="mt-3 block text-sm">Notes
                        <textarea className="mt-1 w-full rounded-md border bg-background p-2" rows={3} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} />
                      </label>
                      <div className="mt-3 flex items-center gap-3"><Button disabled={unmarked > 0 || busy} onClick={submit}>Record result</Button>{unmarked > 0 && <p className="text-sm text-muted-foreground">{unmarked} criteria not marked</p>}</div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </>
  )
}
