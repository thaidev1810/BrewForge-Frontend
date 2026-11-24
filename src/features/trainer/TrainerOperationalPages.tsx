import { useCallback, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { PageHeader } from '@/components/common/PageHeader'
import { Panel } from '@/components/common/Panel'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  ErrorBox,
  Field,
  Loading,
  Pager,
  Select,
  StateBadge,
  SuccessBox,
  TextInput,
  Toolbar,
  addDays,
  fmtDate,
  today,
  useAction,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { CertificateBadgeCard, CertificatePreviewModal } from '@/components/common/CertificateBadgeCard'
import { LessonReferenceView } from '@/components/common/LessonReferenceView'
import { brewforgeApi } from '@/services/brewforgeApi'
import { AuthenticatedVideo } from '@/components/common/AuthenticatedMedia'
import type {
  AssignmentDto,
  AttendanceEntryDto,
  AttendanceStatus,
  BranchDto,
  CertificateDto,
  ChecklistItemDto,
  ChecklistMarkRequest,
  CourseDto,
  CourseModuleDto,
  EligibilityDto,
  EnrollmentDto,
  EnrollmentModuleDto,
  LearnerQuizDto,
  PracticalEvaluationDto,
  PracticalScheduleDto,
  PracticalVideoDto,
  QuizAttemptResultDto,
  ScheduleStatus,
  SkillDto,
  TrainingClassDto,
  TrainingNeedDto,
  UserDirectoryItemDto,
} from '@/types/backend'

const PAGE_SIZE = 20

// ------------------------------------------------------------------ Classes & Attendance

export function TrainingClassesPage() {
  const { user } = useAppSelector((s) => s.auth)
  const callerTrainerId = user?.numericId ?? (user?.id ? Number(user.id) : 5)

  const [page, setPage] = useState(1)
  const [classState, setClassState] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  const loader = useCallback(
    () =>
      brewforgeApi.classes.list({
        page,
        size: PAGE_SIZE,
        state: classState || undefined,
        branchId: branchFilter ? Number(branchFilter) : undefined,
      }),
    [page, classState, branchFilter],
  )
  const classes = useAsyncLoad(loader, { items: [] as TrainingClassDto[], page: 1, size: PAGE_SIZE, total: 0 })

  const lookupsLoader = useCallback(async () => {
    const [b, c] = await Promise.all([
      brewforgeApi.branches.list({ page: 1, size: 100 }),
      brewforgeApi.courses.list({ page: 1, size: 100, state: 'PUBLISHED' }),
    ])
    return { branches: b.items, courses: c.items }
  }, [])
  const lookups = useAsyncLoad(lookupsLoader, { branches: [] as BranchDto[], courses: [] as CourseDto[] })

  const action = useAction()
  const [newCourseId, setNewCourseId] = useState('')
  const [newBranchId, setNewBranchId] = useState('')
  const [newName, setNewName] = useState('')
  const [newStartDate, setNewStartDate] = useState(today())
  const [newEndDate, setNewEndDate] = useState(addDays(14))

  // Selected class for session & attendance view
  const [selectedClass, setSelectedClass] = useState<TrainingClassDto | null>(null)
  const [classModules, setClassModules] = useState<CourseModuleDto[]>([])
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([])
  const [newSessionDate, setNewSessionDate] = useState(today())
  const [newSessionTime, setNewSessionTime] = useState('09:00')
  const [newSessionDuration, setNewSessionDuration] = useState('60')
  const [newSessionLocation, setNewSessionLocation] = useState('Main Bar')
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntryDto[]>([])

  const loadClassDetail = async (id: number) => {
    const updated = await brewforgeApi.classes.get(id)
    setSelectedClass(updated)
    setNewSessionDate(updated.startDate)
    const mods = await brewforgeApi.courses.modules(updated.courseId)
    setClassModules(mods)
    setSelectedModuleIds(mods.map((m) => m.id))
  }

  const handleSelectClass = (c: TrainingClassDto) => {
    setSelectedClass(c)
    setActiveSessionId(null)
    void loadClassDetail(c.id)
  }

  const loadAttendance = async (sessionId: number) => {
    setActiveSessionId(sessionId)
    const sheet = await brewforgeApi.classes.getAttendance(sessionId)
    setAttendanceEntries(sheet.entries)
  }

  return (
    <>
      <PageHeader
        title="Training Classes & Sessions"
        description="Schedule classes, add module training sessions, enroll branch cohorts, and record session attendance."
      />
      <ErrorBox error={action.error ?? classes.error ?? lookups.error} />
      <SuccessBox message={action.message} />

      <Panel title="Open a New Training Class">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Class Name">
            <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. B01 March Cohort" />
          </Field>
          <Field label="Course">
            <Select value={newCourseId} onChange={(e) => setNewCourseId(e.target.value)}>
              <option value="">— select course —</option>
              {lookups.data.courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Branch">
            <Select value={newBranchId} onChange={(e) => setNewBranchId(e.target.value)}>
              <option value="">— select branch —</option>
              {lookups.data.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchCode} · {b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Start Date">
            <TextInput type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
          </Field>
          <Field label="End Date">
            <TextInput type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
          </Field>
        </div>
        <Button
          size="sm"
          className="mt-3"
          disabled={action.busy || !newCourseId || !newBranchId || !newName.trim()}
          onClick={() =>
            void action.run(
              () =>
                brewforgeApi.classes.create({
                  courseId: Number(newCourseId),
                  branchId: Number(newBranchId),
                  name: newName,
                  startDate: newStartDate,
                  endDate: newEndDate,
                }),
              'Training class created.',
              (c) => {
                classes.reload()
                handleSelectClass(c)
              },
            )
          }
        >
          Create Planned Class
        </Button>
      </Panel>

      <Panel title="Class Registry">
        <Toolbar>
          <Field label="State">
            <Select value={classState} onChange={(e) => { setClassState(e.target.value); setPage(1) }}>
              <option value="">All</option>
              <option value="PLANNED">PLANNED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="CLOSED">CLOSED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
          </Field>
          <Field label="Branch">
            <Select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}>
              <option value="">All Branches</option>
              {lookups.data.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchCode}</option>
              ))}
            </Select>
          </Field>
        </Toolbar>
        <Loading show={classes.loading} />
        <DataTable
          rows={classes.data.items}
          rowKey={(c) => c.id}
          selectedKey={selectedClass?.id}
          onRowClick={handleSelectClass}
          columns={[
            { header: 'Class', cell: (c) => c.name },
            { header: 'Branch', cell: (c) => lookups.data.branches.find((b) => b.id === c.branchId)?.branchCode ?? c.branchId },
            { header: 'Duration', cell: (c) => `${c.startDate} → ${c.endDate}` },
            { header: 'Enrolled', cell: (c) => `${c.enrolledCount} learners` },
            { header: 'Sessions', cell: (c) => `${c.sessions.length} sessions` },
            { header: 'State', cell: (c) => <StateBadge value={c.state} /> },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={classes.data.total} onPage={setPage} />
      </Panel>

      {selectedClass && (
        <Panel
          title={`Class: ${selectedClass.name} (#${selectedClass.id})`}
          description={`State: ${selectedClass.state} · ${selectedClass.startDate} to ${selectedClass.endDate}`}
        >
          <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
            {selectedClass.state === 'PLANNED' && (
              <Button
                size="sm"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => brewforgeApi.classes.open(selectedClass.id),
                    (res) => `Class opened! ${res.enrollmentIds.length} trainees enrolled.`,
                    () => { classes.reload(); void loadClassDetail(selectedClass.id) },
                  )
                }
              >
                Open Class (Auto-Enroll Branch Trainees)
              </Button>
            )}
            {selectedClass.state === 'RUNNING' && (
              <Button
                size="sm"
                variant="outline"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => brewforgeApi.classes.close(selectedClass.id),
                    'Class closed.',
                    () => { classes.reload(); void loadClassDetail(selectedClass.id) },
                  )
                }
              >
                Close Class
              </Button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold">Sessions Schedule</h4>
              <div className="space-y-2">
                {selectedClass.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`rounded border p-3 text-xs transition-colors cursor-pointer ${
                      activeSessionId === sess.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                    onClick={() => void loadAttendance(sess.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Session #{sess.sessionNo}: {sess.scheduledDate} @ {sess.startTime}</span>
                      <div className="flex items-center gap-2">
                        <span>{sess.durationMinutes}m · {sess.location ?? 'On-site'}</span>
                        {selectedClass.state === 'PLANNED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              void action.run(
                                () => brewforgeApi.classes.deleteSession(sess.id),
                                `Session #${sess.sessionNo} removed.`,
                                () => void loadClassDetail(selectedClass.id),
                              )
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground">Modules covered: {sess.moduleIds.join(', ') || 'All'}</p>
                  </div>
                ))}
                {selectedClass.sessions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No sessions scheduled.</p>
                )}
              </div>

              {selectedClass.state !== 'CLOSED' && (
                <div className="mt-4 rounded border bg-muted/30 p-3">
                  <h5 className="mb-2 text-xs font-semibold">Schedule New Session</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Field label="Date"><TextInput type="date" value={newSessionDate} onChange={(e) => setNewSessionDate(e.target.value)} /></Field>
                    <Field label="Start Time"><TextInput type="time" value={newSessionTime} onChange={(e) => setNewSessionTime(e.target.value)} /></Field>
                    <Field label="Duration (m)"><TextInput type="number" value={newSessionDuration} onChange={(e) => setNewSessionDuration(e.target.value)} /></Field>
                    <Field label="Location"><TextInput value={newSessionLocation} onChange={(e) => setNewSessionLocation(e.target.value)} /></Field>
                  </div>
                  {classModules.length > 0 && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Modules Covered in Session</label>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {classModules.map((m) => (
                          <label key={m.id} className="flex items-center gap-1 rounded border bg-card px-2 py-0.5">
                            <input
                              type="checkbox"
                              checked={selectedModuleIds.includes(m.id)}
                              onChange={(e) =>
                                setSelectedModuleIds((prev) =>
                                  e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id),
                                )
                              }
                            />
                            {m.moduleOrder}. {m.moduleType}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={action.busy || selectedModuleIds.length === 0}
                    onClick={() =>
                      void action.run(
                        () =>
                          brewforgeApi.classes.addSession(selectedClass.id, {
                            scheduledDate: newSessionDate,
                            startTime: newSessionTime,
                            durationMinutes: Number(newSessionDuration),
                            location: newSessionLocation,
                            trainerId: callerTrainerId,
                            moduleIds: selectedModuleIds,
                          }),
                        'Session scheduled.',
                        () => void loadClassDetail(selectedClass.id),
                      )
                    }
                  >
                    Add Session
                  </Button>
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Session Attendance Sheet</h4>
              {activeSessionId ? (
                <div>
                  <DataTable
                    rows={attendanceEntries}
                    rowKey={(e) => e.enrollmentId}
                    columns={[
                      { header: 'Learner', cell: (e) => e.fullName },
                      {
                        header: 'Status',
                        cell: (e) => (
                          <Select
                            className="h-8 text-xs w-28"
                            value={e.status ?? ''}
                            onChange={(ev) => {
                              const val = ev.target.value as AttendanceStatus
                              setAttendanceEntries((prev) =>
                                prev.map((item) => (item.enrollmentId === e.enrollmentId ? { ...item, status: val } : item)),
                              )
                            }}
                          >
                            <option value="">— Unmarked —</option>
                            <option value="PRESENT">PRESENT</option>
                            <option value="ABSENT">ABSENT</option>
                            <option value="EXCUSED">EXCUSED</option>
                          </Select>
                        ),
                      },
                      {
                        header: 'Note',
                        cell: (e) => (
                          <TextInput
                            className="h-8 text-xs"
                            value={e.note ?? ''}
                            placeholder="Optional note"
                            onChange={(ev) => {
                              const val = ev.target.value
                              setAttendanceEntries((prev) =>
                                prev.map((item) => (item.enrollmentId === e.enrollmentId ? { ...item, note: val } : item)),
                              )
                            }}
                          />
                        ),
                      },
                    ]}
                  />
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(
                        () =>
                          brewforgeApi.classes.recordAttendance(
                            activeSessionId,
                            attendanceEntries
                              .filter((e) => e.status !== null)
                              .map((e) => ({
                                enrollmentId: e.enrollmentId,
                                status: e.status!,
                                note: e.note ?? null,
                              })),
                          ),
                        'Attendance sheet saved.',
                      )
                    }
                  >
                    Save Attendance
                  </Button>
                </div>
              ) : (
                <p className="rounded border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Select a session on the left to record or review attendance.
                </p>
              )}
            </div>
          </div>
        </Panel>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Needs & Assignments

export function TrainerAssignmentsPage() {
  const [page, setPage] = useState(1)
  const [branchFilter, setBranchFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')

  const loader = useCallback(
    () =>
      brewforgeApi.assignments.list({
        page,
        size: PAGE_SIZE,
        branchId: branchFilter ? Number(branchFilter) : undefined,
        courseId: courseFilter ? Number(courseFilter) : undefined,
      }),
    [page, branchFilter, courseFilter],
  )
  const assignments = useAsyncLoad(loader, { items: [] as AssignmentDto[], page: 1, size: PAGE_SIZE, total: 0 })

  const needsLoader = useCallback(
    () =>
      brewforgeApi.trainingNeeds.list({
        branchId: branchFilter ? Number(branchFilter) : undefined,
        courseId: courseFilter ? Number(courseFilter) : undefined,
      }),
    [branchFilter, courseFilter],
  )
  const needs = useAsyncLoad(needsLoader, [] as TrainingNeedDto[])

  const lookupsLoader = useCallback(async () => {
    const [b, c, u] = await Promise.all([
      brewforgeApi.branches.list({ page: 1, size: 100 }),
      brewforgeApi.courses.list({ page: 1, size: 100, state: 'PUBLISHED' }),
      brewforgeApi.users.directory({ role: 'TRAINEE' }),
    ])
    return { branches: b.items, courses: c.items, trainees: u }
  }, [])
  const lookups = useAsyncLoad(lookupsLoader, { branches: [] as BranchDto[], courses: [] as CourseDto[], trainees: [] as UserDirectoryItemDto[] })

  const action = useAction()
  const [assignCourseId, setAssignCourseId] = useState('')
  const [assignBranchId, setAssignBranchId] = useState('')
  const [assignTraineeIds, setAssignTraineeIds] = useState<number[]>([])
  const [allTrainees, setAllTrainees] = useState(false)
  const [deadline, setDeadline] = useState(addDays(30))
  const [reason, setReason] = useState('Standard onboarding / mandatory recertification')

  const handleAssign = () => {
    void action.run(
      () =>
        brewforgeApi.assignments.assign({
          courseId: Number(assignCourseId),
          branchId: assignBranchId ? Number(assignBranchId) : null,
          employeeIds: allTrainees ? undefined : assignTraineeIds,
          allTrainees,
          deadline: deadline || null,
          reason,
        }),
      (res) => `Assigned! ${res.enrollmentIds.length} new enrollments created.`,
      () => {
        assignments.reload()
        needs.reload()
      },
    )
  }

  return (
    <>
      <PageHeader
        title="Training Needs & Course Assignments"
        description="Monitor unfulfilled regulation training needs and assign courses to individual trainees or whole branches."
      />
      <ErrorBox error={action.error ?? assignments.error ?? needs.error ?? lookups.error} />
      <SuccessBox message={action.message} />

      <Panel title="Assign Training Course">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Course">
            <Select value={assignCourseId} onChange={(e) => setAssignCourseId(e.target.value)}>
              <option value="">— select published course —</option>
              {lookups.data.courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Target Branch (optional scope)">
            <Select value={assignBranchId} onChange={(e) => setAssignBranchId(e.target.value)}>
              <option value="">All Branches</option>
              {lookups.data.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchCode} · {b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Deadline">
            <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label="Assignment Reason">
            <TextInput value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>

        <div className="mt-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={allTrainees} onChange={(e) => setAllTrainees(e.target.checked)} />
            Assign to all trainees in branch / organization
          </label>
        </div>

        {!allTrainees && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Select Individual Trainees</label>
            <div className="max-h-40 overflow-y-auto rounded border p-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {lookups.data.trainees
                .filter((t) => (!assignBranchId ? true : t.branchId === Number(assignBranchId)))
                .map((t) => (
                  <label key={t.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={assignTraineeIds.includes(t.id)}
                      onChange={(e) =>
                        setAssignTraineeIds((prev) =>
                          e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                        )
                      }
                    />
                    {t.fullName} (@{t.username})
                  </label>
                ))}
            </div>
          </div>
        )}

        <Button
          size="sm"
          className="mt-3"
          disabled={action.busy || !assignCourseId || (!allTrainees && assignTraineeIds.length === 0)}
          onClick={handleAssign}
        >
          Dispatch Assignment
        </Button>
      </Panel>

      <Panel title="Identified Training Needs (Regulations)" description="Staff requiring training under current governance rules.">
        <Loading show={needs.loading} />
        <DataTable
          rows={needs.data}
          rowKey={(n) => `${n.userId}-${n.courseId}`}
          empty="No pending training needs detected."
          columns={[
            { header: 'Learner', cell: (n) => `${n.fullName} (@${n.username})` },
            { header: 'Course', cell: (n) => `${n.courseTitle} (${n.courseType})` },
            { header: 'Reason', cell: (n) => n.reason },
            { header: 'Due within', cell: (n) => `${n.dueDays} days` },
            { header: 'State', cell: (n) => <StateBadge value={n.enrollmentState ?? 'UNASSIGNED'} /> },
            {
              header: 'Quick Action',
              cell: (n) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAssignCourseId(String(n.courseId))
                    setAssignTraineeIds([n.userId])
                    setAllTrainees(false)
                  }}
                >
                  Pick
                </Button>
              ),
            },
          ]}
        />
      </Panel>

      <Panel title="Active Assignments Registry">
        <Toolbar>
          <Field label="Branch Filter">
            <Select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}>
              <option value="">All Branches</option>
              {lookups.data.branches.map((b) => <option key={b.id} value={b.id}>{b.branchCode}</option>)}
            </Select>
          </Field>
          <Field label="Course Filter">
            <Select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1) }}>
              <option value="">All Courses</option>
              {lookups.data.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </Field>
        </Toolbar>
        <Loading show={assignments.loading} />
        <DataTable
          rows={assignments.data.items}
          rowKey={(a) => a.enrollmentId}
          columns={[
            { header: 'Enrollment', cell: (a) => `#${a.enrollmentId}` },
            { header: 'Learner', cell: (a) => a.fullName },
            { header: 'Branch', cell: (a) => a.branchCode ?? 'HQ' },
            { header: 'Course', cell: (a) => a.courseTitle },
            { header: 'Progress', cell: (a) => `${a.progressPercent}%` },
            { header: 'Due Date', cell: (a) => a.dueDate ?? '—' },
            { header: 'Status', cell: (a) => <StateBadge value={a.status} /> },
            { header: 'Enrollment State', cell: (a) => <StateBadge value={a.enrollmentState} /> },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={assignments.data.total} onPage={setPage} />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ Practical Grading & Videos

export function PracticalAssessmentsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<ScheduleStatus | ''>('')
  const loader = useCallback(
    () => brewforgeApi.practicalSchedules.list({ page, size: PAGE_SIZE, status: status || undefined }),
    [page, status],
  )
  const schedules = useAsyncLoad(loader, { items: [] as PracticalScheduleDto[], page: 1, size: PAGE_SIZE, total: 0 })

  const enrollmentsLoader = useCallback(async () => {
    const res = await brewforgeApi.assignments.list({ page: 1, size: 100 })
    return res.items
  }, [])
  const learnerEnrollments = useAsyncLoad(enrollmentsLoader, [] as AssignmentDto[])

  const action = useAction()

  // New Practical Schedule Form
  const [schedEnrollmentId, setSchedEnrollmentId] = useState('')
  const [schedDate, setSchedDate] = useState(addDays(1))
  const [schedTime, setSchedTime] = useState('14:00')
  const [schedLocation, setSchedLocation] = useState('Quầy Bar Đào tạo B01')
  const [schedNote, setSchedNote] = useState('Thi thực hành tay nghề SOP')

  const [selectedSchedule, setSelectedSchedule] = useState<PracticalScheduleDto | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videos, setVideos] = useState<PracticalVideoDto[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null)

  // Checklist marks & item descriptions for evaluation
  const [checklistItems, setChecklistItems] = useState<ChecklistItemDto[]>([])
  const [checklistMarks, setChecklistMarks] = useState<ChecklistMarkRequest[]>([])

  const loadVideosAndChecklist = async (enrollmentId: number, courseId: number) => {
    const vList = await brewforgeApi.enrollments.listPracticalVideos(enrollmentId)
    setVideos(vList)
    if (vList.length > 0) setSelectedVideoId(vList[0].id)

    const cDetail = await brewforgeApi.courses.get(courseId)
    setChecklistItems(cDetail.practicalChecklist)
    setChecklistMarks(
      cDetail.practicalChecklist.map((item) => ({
        recipeStepId: item.recipeStepId,
        lessonId: item.lessonId,
        passed: true,
        note: '',
      })),
    )
  }

  const handleSelectSchedule = (sch: PracticalScheduleDto) => {
    setSelectedSchedule(sch)
    void loadVideosAndChecklist(sch.enrollmentId, sch.courseId)
  }

  return (
    <>
      <PageHeader
        title="Practical Schedules & Video Assessment"
        description="Schedule practical exams, upload practical execution video recordings, evaluate step-by-step checklist, and auto-issue certificates."
      />
      <ErrorBox error={action.error ?? schedules.error ?? learnerEnrollments.error} />
      <SuccessBox message={action.message} />

      <Panel title="Schedule New Practical Assessment">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Learner Enrollment" className="md:col-span-2">
            <Select value={schedEnrollmentId} onChange={(e) => setSchedEnrollmentId(e.target.value)}>
              <option value="">— select learner enrollment —</option>
              {learnerEnrollments.data
                .filter((e) => e.enrollmentState !== 'PASSED' && e.enrollmentState !== 'CLOSED')
                .map((e) => (
                  <option key={e.enrollmentId} value={e.enrollmentId}>
                    #{e.enrollmentId} · {e.fullName} ({e.branchCode ?? 'HQ'}) — {e.courseTitle} [{e.enrollmentState}]
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Exam Date">
            <TextInput type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
          </Field>
          <Field label="Start Time">
            <TextInput type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
          </Field>
          <Field label="Location">
            <TextInput value={schedLocation} onChange={(e) => setSchedLocation(e.target.value)} />
          </Field>
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <Field label="Assessment Note" className="flex-1">
            <TextInput value={schedNote} onChange={(e) => setSchedNote(e.target.value)} />
          </Field>
          <Button
            size="sm"
            disabled={action.busy || !schedEnrollmentId || !schedDate || !schedTime || !schedLocation.trim()}
            onClick={() =>
              void action.run(
                () =>
                  brewforgeApi.practicalSchedules.create(Number(schedEnrollmentId), {
                    scheduledAt: `${schedDate}T${schedTime}:00+07:00`,
                    location: schedLocation,
                    note: schedNote || null,
                  }),
                'Practical assessment scheduled.',
                (created) => {
                  schedules.reload()
                  handleSelectSchedule(created)
                },
              )
            }
          >
            Schedule Practical Exam
          </Button>
        </div>
      </Panel>

      <Panel title="Practical Assessment Schedules">
        <Toolbar>
          <Field label="Status">
            <Select value={status} onChange={(e) => { setStatus(e.target.value as ScheduleStatus); setPage(1) }}>
              <option value="">All</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
          </Field>
        </Toolbar>
        <Loading show={schedules.loading} />
        <DataTable
          rows={schedules.data.items}
          rowKey={(s) => s.id}
          selectedKey={selectedSchedule?.id}
          onRowClick={handleSelectSchedule}
          columns={[
            { header: 'Trainee', cell: (s) => s.traineeName },
            { header: 'Course', cell: (s) => s.courseTitle },
            { header: 'Trainer', cell: (s) => s.trainerName },
            { header: 'Date & Time', cell: (s) => fmtDate(s.scheduledAt) },
            { header: 'Location', cell: (s) => s.location },
            { header: 'Status', cell: (s) => <StateBadge value={s.status} /> },
            {
              header: 'Actions',
              cell: (s) =>
                s.status === 'SCHEDULED' ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        void action.run(
                          () => brewforgeApi.practicalSchedules.complete(s.id),
                          'Schedule completed.',
                          schedules.reload,
                        )
                      }}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        void action.run(
                          () => brewforgeApi.practicalSchedules.cancel(s.id),
                          'Schedule cancelled.',
                          schedules.reload,
                        )
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null,
            },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={schedules.data.total} onPage={setPage} />
      </Panel>

      {selectedSchedule && (
        <Panel
          title={`Practical Evaluation: ${selectedSchedule.traineeName} · ${selectedSchedule.courseTitle}`}
          description={`Enrollment #${selectedSchedule.enrollmentId} · Scheduled at: ${fmtDate(selectedSchedule.scheduledAt)}`}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold">1. Upload Practical Video (Trainer Only)</h4>
              <p className="mb-3 text-xs text-muted-foreground">
                BR-14: Trainees cannot upload practical videos; evidence is recorded and submitted by the trainer.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  disabled={action.busy || !videoFile}
                  onClick={() => {
                    if (!videoFile) return
                    void action.run(
                      () => brewforgeApi.enrollments.uploadPracticalVideo(selectedSchedule.enrollmentId, videoFile),
                      'Video uploaded successfully.',
                      (v) => {
                        setVideoFile(null)
                        void loadVideosAndChecklist(selectedSchedule.enrollmentId, selectedSchedule.courseId)
                        setSelectedVideoId(v.id)
                      },
                    )
                  }}
                >
                  Upload Video
                </Button>
              </div>

              {videos.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Select Uploaded Video Recording</label>
                  <Select
                    value={selectedVideoId ?? ''}
                    onChange={(e) => setSelectedVideoId(Number(e.target.value))}
                  >
                    {videos.map((v) => (
                      <option key={v.id} value={v.id}>
                        Video #{v.id} · {v.fileName} ({Math.round(v.sizeBytes / 1024 / 1024)} MB) · {fmtDate(v.uploadedAt)}
                      </option>
                    ))}
                  </Select>

                  {selectedVideoId && (
                    <div className="mt-3">
                      <AuthenticatedVideo videoId={selectedVideoId} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">2. Grade Practical Checklist & Submit</h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Passing all checklist items automatically issues a certified Certificate to the learner.
              </p>

              <div className="space-y-2">
                {checklistMarks.map((mark, idx) => {
                  const info = checklistItems[idx]
                  return (
                    <div key={idx} className="rounded border bg-card p-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold">
                            Step {info?.stepOrder ?? idx + 1}: {info?.actionText ?? `#${mark.recipeStepId ?? mark.lessonId}`}
                          </span>
                          {info?.techniqueGate && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                              {info.techniqueGate}
                            </span>
                          )}
                        </div>
                        <label className="flex shrink-0 items-center gap-1 font-semibold">
                          <input
                            type="checkbox"
                            checked={mark.passed}
                            onChange={(e) => {
                              const val = e.target.checked
                              setChecklistMarks((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, passed: val } : m)),
                              )
                            }}
                          />
                          {mark.passed ? <span className="text-green-700">PASS</span> : <span className="text-destructive">FAIL</span>}
                        </label>
                      </div>
                      <TextInput
                        className="mt-1.5 h-7 text-xs"
                        placeholder="Trainer evaluation notes"
                        value={mark.note ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setChecklistMarks((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, note: val } : m)),
                          )
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              <Button
                size="sm"
                className="mt-4 w-full"
                disabled={action.busy || !selectedVideoId || checklistMarks.length === 0}
                onClick={() => {
                  if (!selectedVideoId) return
                  void action.run(
                    () =>
                      brewforgeApi.enrollments.evaluatePractical(selectedSchedule.enrollmentId, {
                        practicalVideoId: selectedVideoId,
                        items: checklistMarks,
                      }),
                    (res: PracticalEvaluationDto) =>
                      res.passed
                        ? `Evaluation PASSED! Certificate #${res.certificateId ?? 'Issued'} granted.`
                        : 'Evaluation submitted with FAILED status.',
                    () => {
                      schedules.reload()
                      learnerEnrollments.reload()
                    },
                  )
                }}
              >
                Submit Practical Evaluation & Issue Certificate
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Trainer's Own Certifications

export function TrainerLearningPage() {
  const loader = useCallback(async () => {
    const [e, c, s] = await Promise.all([
      brewforgeApi.enrollments.mine(),
      brewforgeApi.certificates.mine(),
      brewforgeApi.certificates.mySkills(),
    ])
    return { enrollments: e, certificates: c, skills: s }
  }, [])
  const data = useAsyncLoad(loader, {
    enrollments: [] as EnrollmentDto[],
    certificates: [] as CertificateDto[],
    skills: [] as SkillDto[],
  })

  const action = useAction()
  const [activeCertificate, setActiveCertificate] = useState<CertificateDto | null>(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentDto | null>(null)
  const [modules, setModules] = useState<EnrollmentModuleDto[]>([])
  const [activeModule, setActiveModule] = useState<EnrollmentModuleDto | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityDto | null>(null)
  const [quizData, setQuizData] = useState<LearnerQuizDto | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [attemptResult, setAttemptResult] = useState<QuizAttemptResultDto | null>(null)

  const loadTrainerEnrollment = async (en: EnrollmentDto) => {
    setSelectedEnrollment(en)
    setQuizData(null)
    setAttemptResult(null)
    const [mList, elig] = await Promise.all([
      brewforgeApi.enrollments.modules(en.id),
      brewforgeApi.enrollments.eligibility(en.id),
    ])
    setModules(mList)
    setEligibility(elig)
    if (mList.length > 0) setActiveModule(mList[0])
  }

  const openQuiz = async (enrollmentId: number) => {
    const q = await brewforgeApi.enrollments.getQuiz(enrollmentId)
    setQuizData(q)
    setAnswers({})
  }

  return (
    <>
      <PageHeader
        title="Trainer Certifications & Skills"
        description="A trainer must complete and hold a valid certificate on a recipe version before teaching it."
      />
      <ErrorBox error={action.error ?? data.error} />
      <SuccessBox message={action.message} />
      <Loading show={data.loading} />
      <Panel title="My Skill Passport (Click a certified row to view Certificate)">
        <DataTable
          rows={data.data.skills}
          rowKey={(s) => s.courseId}
          onRowClick={(s) => {
            const found = data.data.certificates.find(
              (c) => (s.certificateId != null && c.id === s.certificateId) || c.courseId === s.courseId,
            )
            if (found) setActiveCertificate(found)
          }}
          empty="No skills recorded yet."
          columns={[
            { header: 'Course', cell: (s) => s.courseTitle },
            { header: 'Status', cell: (s) => <StateBadge value={s.status} /> },
            {
              header: 'Certificate',
              cell: (s) =>
                s.certificateId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      const found = data.data.certificates.find((c) => c.id === s.certificateId || c.courseId === s.courseId)
                      if (found) setActiveCertificate(found)
                    }}
                  >
                    #{s.certificateId} · Xem chứng chỉ
                  </Button>
                ) : (
                  '—'
                ),
            },
            { header: 'Certified Date', cell: (s) => fmtDate(s.issuedAt) },
          ]}
        />
      </Panel>

      {activeCertificate && (
        <CertificatePreviewModal
          certificate={activeCertificate}
          holderName={activeCertificate.fullName}
          holderRole="TRAINER ACCREDITATION"
          onClose={() => setActiveCertificate(null)}
        />
      )}

      <Panel
        title={`Trainer Accreditation Certificates (${data.data.certificates.length})`}
        description="Official BrewForge Trainer Accreditation badges bound to each released recipe version."
      >
        {data.data.certificates.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trainer certificates issued yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {data.data.certificates.map((cert) => (
              <CertificateBadgeCard
                key={cert.id}
                certificate={cert}
                holderName={cert.fullName}
                holderRole="TRAINER ACCREDITATION"
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="My Enrolled Courses (Click a course to study modules or take the Quiz)">
        <DataTable
          rows={data.data.enrollments}
          rowKey={(e) => e.id}
          selectedKey={selectedEnrollment?.id}
          onRowClick={(e) => void loadTrainerEnrollment(e)}
          empty="You have not enrolled in any trainer certification courses."
          columns={[
            { header: 'Course', cell: (e) => e.courseTitle },
            { header: 'Type', cell: (e) => e.courseType },
            { header: 'Progress', cell: (e) => `${e.progressPercent}%` },
            { header: 'State', cell: (e) => <StateBadge value={e.state} /> },
            { header: 'Enrolled At', cell: (e) => fmtDate(e.enrolledAt) },
          ]}
        />
      </Panel>

      {selectedEnrollment && (
        <Panel
          title={`Course Study: ${selectedEnrollment.courseTitle} (#${selectedEnrollment.id})`}
          description={`State: ${selectedEnrollment.state} · Progress: ${selectedEnrollment.progressPercent}%`}
          action={
            eligibility?.eligible ? (
              <Button size="sm" onClick={() => void openQuiz(selectedEnrollment.id)}>
                Open Theory Quiz
              </Button>
            ) : null
          }
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-1">
              {modules.map((m) => (
                <button
                  key={m.module.id}
                  type="button"
                  onClick={() => setActiveModule(m)}
                  className={`w-full rounded border p-2 text-left text-xs ${
                    activeModule?.module.id === m.module.id ? 'border-primary bg-primary/10 font-bold' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{m.module.moduleOrder}. {m.module.moduleType}</span>
                    {m.completed ? <span className="text-green-700 font-bold">✓</span> : <span>—</span>}
                  </div>
                </button>
              ))}
            </div>
            <div className="md:col-span-2">
              {activeModule && (
                <div className="rounded border p-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="text-sm font-semibold">
                      Module {activeModule.module.moduleOrder}: {activeModule.module.moduleType}
                    </h4>
                    {!activeModule.completed ? (
                      <Button
                        size="sm"
                        disabled={action.busy}
                        onClick={() =>
                          void action.run(
                            () => brewforgeApi.enrollments.completeModule(selectedEnrollment.id, activeModule.module.id),
                            'Module marked completed!',
                            () => {
                              data.reload()
                              void loadTrainerEnrollment(selectedEnrollment)
                            },
                          )
                        }
                      >
                        Mark Module Completed
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-green-700">Completed at {fmtDate(activeModule.completedAt)}</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-3">
                    {activeModule.module.lessons.map((lesson) => (
                      <div key={lesson.id} className="rounded border bg-card p-3 text-xs">
                        <p className="font-semibold text-sm">{lesson.lessonOrder}. {lesson.title}</p>
                        {lesson.content && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{lesson.content}</p>}
                        <LessonReferenceView moduleType={activeModule.module.moduleType} reference={lesson.reference} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {quizData && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-semibold">{quizData.title} (Pass score: {quizData.passScore}%)</h4>
              {attemptResult && (
                <p className="mt-1 text-xs font-semibold">
                  Attempt #{attemptResult.attemptNo}: {attemptResult.passed ? 'PASSED' : 'FAILED'} ({attemptResult.score}%)
                </p>
              )}
              <div className="mt-3 space-y-4">
                {quizData.questions.map((q, idx) => (
                  <div key={q.id} className="rounded border bg-card p-3 text-xs">
                    <p className="font-semibold">Q{idx + 1}. {q.questionText}</p>
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt) => (
                        <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`tq-${q.id}`}
                            checked={answers[q.id] === opt.key}
                            onChange={() => setAnswers({ ...answers, [q.id]: opt.key })}
                          />
                          <span>[{opt.key}] {opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                className="mt-3"
                disabled={action.busy || Object.keys(answers).length < quizData.questions.length}
                onClick={() =>
                  void action.run(
                    () =>
                      brewforgeApi.enrollments.attemptQuiz(
                        selectedEnrollment.id,
                        Object.entries(answers).map(([qId, opt]) => ({ questionId: Number(qId), selectedOption: opt })),
                      ),
                    (res) => `Quiz score: ${res.score}% (${res.passed ? 'PASSED' : 'FAILED'})`,
                    (res) => {
                      setAttemptResult(res)
                      data.reload()
                    },
                  )
                }
              >
                Submit Quiz
              </Button>
            </div>
          )}
        </Panel>
      )}
    </>
  )
}
