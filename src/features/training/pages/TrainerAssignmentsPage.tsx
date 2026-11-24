import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState, FormMessage, LoadState, Panel } from '@/components/common/Panel'
import { StatusBadge } from '@/components/common/StatusBadge'
import { demoUsers } from '@/features/auth/mockAuthService'
import { normalizeApiError } from '@/services/apiError'
import { useTrainingData } from '@/hooks/useTrainingData'
import { mutateTrainingAssignment } from '../trainingSlice'
import { isActive, isOverdue, stageOf, STAGE_LABELS, STAGE_VARIANTS } from '../trainingProgress'

const trainees = demoUsers.filter((user) => user.role === 'TRAINEE')
const nameOf = (id: string) => demoUsers.find((user) => user.id === id)?.name ?? id

export function TrainerAssignmentsPage() {
  const dispatch = useAppDispatch()
  const data = useTrainingData()
  const [courseId, setCourseId] = useState('')
  const [traineeId, setTraineeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const activeCourses = data.courses.filter((course) => !course.archived)

  async function send(command: Parameters<typeof mutateTrainingAssignment>[0]) {
    setError(null)
    setNotice(null)
    const result = await dispatch(mutateTrainingAssignment(command))
    if (mutateTrainingAssignment.rejected.match(result)) { setError(result.payload?.message ?? normalizeApiError(result.error).message); return false }
    data.reload()
    return true
  }

  async function assign(event: FormEvent) {
    event.preventDefault()
    const trainee = trainees.find((user) => user.id === traineeId)
    if (!courseId || !trainee) { setError('Choose a course and a trainee.'); return }
    if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) { setError('The deadline cannot be in the past.'); return }
    const dueAt = dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null
    if (await send({ operation: 'assign', input: { courseId, traineeId: trainee.id, branchId: trainee.branchId ?? '', dueAt } })) setNotice(`Assigned to ${trainee.name}.`)
  }

  return (
    <>
      <PageHeader title="Assignments" description="Give a published course to a trainee with a deadline, and follow where each one stands." />
      <LoadState loading={data.loading} error={data.error} />
      <Panel title="Assign a course">
        <form onSubmit={assign} className="grid gap-4 sm:grid-cols-4" noValidate>
          <label className="text-sm">Course
            <select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value="">Select…</option>{activeCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <label className="text-sm">Trainee
            <select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={traineeId} onChange={(event) => setTraineeId(event.target.value)}>
              <option value="">Select…</option>{trainees.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Deadline
            <Input type="date" className="mt-1" value={dueDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <div className="flex items-end"><Button type="submit">Assign</Button></div>
        </form>
        <FormMessage error={error} />
        {notice && <p role="status" className="mt-3 text-sm text-green-800">{notice}</p>}
      </Panel>

      <Panel title="All assignments">
        {data.assignments.length === 0 ? <EmptyState>No assignments yet.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground"><tr><th className="py-2 pr-4 font-medium">Trainee</th><th className="pr-4 font-medium">Course</th><th className="pr-4 font-medium">Deadline</th><th className="pr-4 font-medium">Stage</th><th className="font-medium"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y">
                {data.assignments.map((assignment) => {
                  const stage = stageOf(assignment, data.facts)
                  return (
                    <tr key={assignment.id}>
                      <td className="py-3 pr-4">{nameOf(assignment.traineeId)}</td>
                      <td className="pr-4">{data.courses.find((course) => course.id === assignment.courseId)?.title ?? assignment.courseId}</td>
                      <td className="pr-4">{assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : '—'}</td>
                      <td className="pr-4"><span className="flex flex-wrap gap-1"><StatusBadge variant={STAGE_VARIANTS[stage]}>{STAGE_LABELS[stage]}</StatusBadge>{isOverdue(assignment, stage) && <StatusBadge variant="error">Overdue</StatusBadge>}</span></td>
                      <td className="text-right">{isActive(assignment) && stage !== 'CERTIFIED' && <Button size="sm" variant="ghost" onClick={() => send({ operation: 'cancel', id: assignment.id })}>Cancel</Button>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  )
}
