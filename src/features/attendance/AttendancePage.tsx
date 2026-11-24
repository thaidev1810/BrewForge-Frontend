import { useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState, FormMessage, LoadState, Panel } from '@/components/common/Panel'
import { demoUsers } from '@/features/auth/mockAuthService'
import { isActive } from '@/features/training/trainingProgress'
import { normalizeApiError } from '@/services/apiError'
import { useTrainingData } from '@/hooks/useTrainingData'
import { attendanceId, summarizeAttendance } from './attendanceRules'
import { recordAttendance } from './attendanceSlice'
import { ATTENDANCE_STATUSES, type AttendanceStatus } from './attendanceTypes'

const today = () => new Date().toISOString().slice(0, 10)
const nameOf = (id: string) => demoUsers.find((user) => user.id === id)?.name ?? id

// One session of one course: mark every enrolled trainee, then save. Saving a day again corrects it.
export function AttendancePage() {
  const user = useAppSelector((state) => state.auth.user)!
  const dispatch = useAppDispatch()
  const data = useTrainingData()
  const [courseId, setCourseId] = useState('')
  const [sessionDate, setSessionDate] = useState(today())
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<string | null>(null)

  const enrolled = useMemo(() => data.assignments.filter((assignment) => assignment.courseId === courseId && isActive(assignment)), [data.assignments, courseId])
  const coursesWithTrainees = data.courses.filter((course) => data.assignments.some((assignment) => assignment.courseId === course.id && isActive(assignment)))
  const existing = (assignmentId: string) => data.attendance.find((record) => record.id === attendanceId(assignmentId, sessionDate))
  const statusOf = (assignmentId: string): AttendanceStatus | '' => marks[assignmentId] ?? existing(assignmentId)?.status ?? ''
  const noteOf = (assignmentId: string) => notes[assignmentId] ?? existing(assignmentId)?.note ?? ''

  async function save() {
    setSaved(null)
    const next: Record<string, string> = {}
    let count = 0
    for (const assignment of enrolled) {
      const status = marks[assignment.id]
      if (!status) continue
      const result = await dispatch(recordAttendance({ operation: 'record', id: attendanceId(assignment.id, sessionDate), input: { assignmentId: assignment.id, sessionDate, status, note: noteOf(assignment.id), recordedBy: user.id } }))
      if (recordAttendance.rejected.match(result)) next[assignment.id] = result.payload?.message ?? normalizeApiError(result.error).message
      else count += 1
    }
    setErrors(next)
    setMarks({})
    setNotes({})
    data.reload()
    if (count > 0) setSaved(`Saved attendance for ${count} trainee${count === 1 ? '' : 's'} on ${sessionDate}.`)
  }

  return (
    <>
      <PageHeader title="Attendance" description="Record who attended a session. Trainees below 80% attendance cannot take the quiz; excused sessions do not count." />
      <LoadState loading={data.loading} error={data.error} />
      <Panel title="Session">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">Course
            <select className="mt-1 h-10 w-full rounded-md border bg-background px-2" value={courseId} onChange={(event) => { setCourseId(event.target.value); setMarks({}) }}>
              <option value="">Select…</option>{coursesWithTrainees.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <label className="text-sm">Session date
            <Input type="date" className="mt-1" value={sessionDate} max={today()} onChange={(event) => { setSessionDate(event.target.value); setMarks({}) }} />
          </label>
        </div>
        {!courseId ? <div className="mt-4"><EmptyState>Choose a course to list its trainees.</EmptyState></div> : enrolled.length === 0 ? <div className="mt-4"><EmptyState>No active enrolments on this course.</EmptyState></div> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground"><tr><th className="py-2 pr-4 font-medium">Trainee</th><th className="pr-4 font-medium">This session</th><th className="pr-4 font-medium">Note</th><th className="font-medium">Attendance so far</th></tr></thead>
              <tbody className="divide-y">
                {enrolled.map((assignment) => {
                  const summary = summarizeAttendance(data.attendance.filter((record) => record.assignmentId === assignment.id))
                  return (
                    <tr key={assignment.id}>
                      <td className="py-3 pr-4">{nameOf(assignment.traineeId)}</td>
                      <td className="pr-4">
                        <select aria-label={`Attendance of ${nameOf(assignment.traineeId)}`} className="h-9 rounded-md border bg-background px-2" value={statusOf(assignment.id)} onChange={(event) => setMarks((current) => ({ ...current, [assignment.id]: event.target.value as AttendanceStatus }))}>
                          <option value="">Not recorded</option>{ATTENDANCE_STATUSES.map((status) => <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>)}
                        </select>
                      </td>
                      <td className="pr-4"><Input aria-label={`Note for ${nameOf(assignment.traineeId)}`} maxLength={255} value={noteOf(assignment.id)} onChange={(event) => setNotes((current) => ({ ...current, [assignment.id]: event.target.value }))} /></td>
                      <td className={summary.meetsMinimum ? '' : 'text-destructive'}>{summary.sessions === 0 ? '—' : `${summary.percent}% (${summary.present}/${summary.present + summary.absent})${summary.excused ? ` · ${summary.excused} excused` : ''}`}{errors[assignment.id] && <span role="alert" className="block text-destructive">{errors[assignment.id]}</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="mt-4 flex items-center gap-3"><Button onClick={save} disabled={Object.keys(marks).length === 0}>Save attendance</Button>{saved && <p role="status" className="text-sm text-green-800">{saved}</p>}</div>
            <FormMessage error={Object.keys(errors).length ? 'Some records could not be saved.' : null} />
          </div>
        )}
      </Panel>
    </>
  )
}
