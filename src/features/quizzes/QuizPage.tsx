import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState, FormMessage, LoadState, Panel } from '@/components/common/Panel'
import { StatusBadge } from '@/components/common/StatusBadge'
import { normalizeApiError } from '@/services/apiError'
import { useTrainingData } from '@/hooks/useTrainingData'
import { passedQuizFor } from '@/features/training/trainingProgress'
import { buildQuiz } from './quizBuilder'
import { recordQuizAttempt } from './quizSlice'
import type { QuizAttempt } from './quizTypes'

export function QuizPage() {
  const { assignmentId = '' } = useParams()
  const user = useAppSelector((state) => state.auth.user)!
  const dispatch = useAppDispatch()
  const data = useTrainingData()
  const assignment = data.assignments.find((item) => item.id === assignmentId && item.traineeId === user.id)
  const questions = useMemo(() => buildQuiz(data.sops.filter((sop) => assignment?.sopVersionIds.includes(sop.id))), [data.sops, assignment])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<QuizAttempt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!assignment) return <><LoadState loading={data.loading} error={data.error} />{!data.loading && <EmptyState>This quiz is not one of yours. <Link className="underline" to="/barista/learning">Back to my learning</Link></EmptyState>}</>
  if (assignment.status !== 'IN_PROGRESS' && !result) return <EmptyState>Start the course before taking its quiz. <Link className="underline" to="/barista/learning">Back to my learning</Link></EmptyState>
  if (passedQuizFor(assignment, data.facts) && !result) return <EmptyState>You have already passed this quiz. <Link className="underline" to="/barista/learning">Back to my learning</Link></EmptyState>
  const course = data.courses.find((item) => item.id === assignment.courseId)
  const unanswered = questions.filter((question) => answers[question.id] === undefined).length

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (unanswered > 0 || !assignment) return
    setError(null)
    setSubmitting(true)
    const correctAnswers = questions.filter((question) => answers[question.id] === question.answer).length
    const outcome = await dispatch(recordQuizAttempt({ operation: 'record', input: { assignmentId: assignment.id, correctAnswers, totalQuestions: questions.length } }))
    setSubmitting(false)
    if (recordQuizAttempt.rejected.match(outcome)) { setError(outcome.payload?.message ?? normalizeApiError(outcome.error).message); return }
    setResult(outcome.payload)
    data.reload()
  }

  if (result) {
    return (
      <>
        <PageHeader title={`${course?.title ?? 'Course'} quiz`} />
        <Panel title="Result">
          <div role="status" className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-semibold">{Math.round(result.scorePercent)}%</p>
            <StatusBadge variant={result.passed ? 'success' : 'error'}>{result.passed ? 'Passed' : 'Not passed'}</StatusBadge>
            <p className="text-sm text-muted-foreground">Pass mark {result.passingScore}%</p>
          </div>
          <p className="mt-3 text-sm">{result.passed ? 'Your trainer can now assess your practical.' : 'Review the procedure and try again.'}</p>
          <div className="mt-4 flex gap-2">
            {!result.passed && <Button variant="outline" onClick={() => { setResult(null); setAnswers({}) }}>Retake the quiz</Button>}
            <Button asChild><Link to="/barista/learning">Back to my learning</Link></Button>
          </div>
        </Panel>
      </>
    )
  }

  return (
    <>
      <PageHeader title={`${course?.title ?? 'Course'} quiz`} description={`${questions.length} questions · pass mark ${assignment.quizPassingScore}%`} />
      {questions.length === 0 ? <EmptyState>This course has no quiz questions yet.</EmptyState> : (
        <form onSubmit={submit} noValidate>
          {questions.map((question, index) => (
            <fieldset key={question.id} className="mb-4 rounded-xl border bg-card p-5">
              <legend className="px-1 font-medium">{index + 1}. {question.prompt}</legend>
              <div className="mt-2 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex cursor-pointer items-start gap-3 rounded-md p-2 text-sm hover:bg-accent">
                    <input type="radio" name={question.id} className="mt-1" checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={unanswered > 0 || submitting}>{submitting ? 'Submitting…' : 'Submit answers'}</Button>
            {unanswered > 0 && <p className="text-sm text-muted-foreground">{unanswered} unanswered</p>}
          </div>
          <FormMessage error={error} />
        </form>
      )}
    </>
  )
}
