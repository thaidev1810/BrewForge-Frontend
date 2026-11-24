import { useCallback, useState } from 'react'
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
  fmtDate,
  today,
  useAction,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { LessonReferenceView } from '@/components/common/LessonReferenceView'
import { brewforgeApi } from '@/services/brewforgeApi'
import { ROLES, type Role } from '@/features/auth/authTypes'
import { AuthenticatedVideo } from '@/components/common/AuthenticatedMedia'
import { CourseEffectivenessPanel } from '@/features/rd/RdManagerPages'
import type {
  AssignmentDto,
  CourseDetailDto,
  CourseDto,
  CourseType,
  PracticalVideoDto,
  QuizQuestionDto,
  TrainingRegulationDto,
} from '@/types/backend'

const PAGE_SIZE = 20
const COURSE_TYPES: CourseType[] = ['INDUCTION', 'PRODUCT', 'EQUIPMENT', 'RECERTIFICATION']

// ------------------------------------------------------------------ Course Approvals

export function CourseApprovalsPage() {
  const [page, setPage] = useState(1)
  const [stateFilter, setStateFilter] = useState('PENDING_APPROVAL')
  const loader = useCallback(
    () =>
      brewforgeApi.courses.list({
        page,
        size: PAGE_SIZE,
        state: stateFilter === 'ALL' ? undefined : stateFilter,
      }),
    [page, stateFilter],
  )
  const pendingCourses = useAsyncLoad(loader, { items: [] as CourseDto[], page: 1, size: PAGE_SIZE, total: 0 })
  const action = useAction()

  const [selectedCourse, setSelectedCourse] = useState<CourseDetailDto | null>(null)
  const [questions, setQuestions] = useState<QuizQuestionDto[]>([])
  const [returnComment, setReturnComment] = useState('')

  const loadDetail = async (id: number) => {
    const [detail, qs] = await Promise.all([
      brewforgeApi.courses.get(id),
      brewforgeApi.courses.listQuestions(id),
    ])
    setSelectedCourse(detail)
    setQuestions(qs)
  }

  return (
    <>
      <PageHeader
        title="Course Approvals & Governance"
        description="Inspect submitted course modules, lessons, quiz questions, and practical checklists before publishing to branches."
      />
      <ErrorBox error={action.error ?? pendingCourses.error} />
      <SuccessBox message={action.message} />

      <Panel title="Course Governance Registry">
        <Toolbar>
          <Field label="Course State Filter">
            <Select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value)
                setPage(1)
                setSelectedCourse(null)
              }}
            >
              <option value="PENDING_APPROVAL">PENDING_APPROVAL (Awaiting Review)</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="OUT_OF_DATE">OUT_OF_DATE</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="ALL">All States</option>
            </Select>
          </Field>
        </Toolbar>
        <Loading show={pendingCourses.loading} />
        <DataTable
          rows={pendingCourses.data.items}
          rowKey={(c) => c.id}
          selectedKey={selectedCourse?.id}
          onRowClick={(c) => void loadDetail(c.id)}
          empty="No courses matching this state filter."
          columns={[
            { header: 'Title', cell: (c) => c.title },
            { header: 'Type', cell: (c) => c.courseType },
            { header: 'Recipe', cell: (c) => (c.recipeCode ? `${c.recipeCode} (v${c.versionNo})` : '—') },
            { header: 'Duration', cell: (c) => (c.totalDurationMin ? `${c.totalDurationMin} min` : '—') },
            { header: 'Created By', cell: (c) => `Trainer #${c.createdBy}` },
            { header: 'State', cell: (c) => <StateBadge value={c.state} /> },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={pendingCourses.data.total} onPage={setPage} />
      </Panel>

      {selectedCourse && (
        <Panel
          title={`Course Inspection: ${selectedCourse.title} (#${selectedCourse.id})`}
          description={`Type: ${selectedCourse.courseType} · State: ${selectedCourse.state} · Bound Version: #${selectedCourse.recipeVersionId ?? 'None'}`}
        >
          {selectedCourse.state === 'PENDING_APPROVAL' && (
            <>
              <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
                <Button
                  size="sm"
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(
                      () => brewforgeApi.courses.approve(selectedCourse.id),
                      'Course approved and PUBLISHED across all branches!',
                      () => {
                        pendingCourses.reload()
                        setSelectedCourse(null)
                      },
                    )
                  }
                >
                  Approve & Publish Course
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={action.busy || !returnComment.trim()}
                  onClick={() =>
                    void action.run(
                      () => brewforgeApi.courses.returnCourse(selectedCourse.id, returnComment),
                      'Course returned to Trainer in DRAFT state.',
                      () => {
                        pendingCourses.reload()
                        setSelectedCourse(null)
                        setReturnComment('')
                      },
                    )
                  }
                >
                  Return with Changes
                </Button>
              </div>

              <div className="mb-4">
                <Field label="Return comment (if rejecting / requesting changes)">
                  <TextInput
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    placeholder="Explain why the course was returned to DRAFT..."
                  />
                </Field>
              </div>
            </>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold">7 Modules & Lesson Content</h4>
              <div className="space-y-3">
                {selectedCourse.modules.map((m) => (
                  <div key={m.id} className="rounded border p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{m.moduleOrder}. {m.moduleType} ({m.source})</span>
                      <StateBadge value={m.state} />
                    </div>
                    <p className="text-muted-foreground mt-0.5">{m.durationMinutes ?? 0} minutes</p>
                    <div className="mt-2 space-y-2">
                      {m.lessons.map((l) => (
                        <div key={l.id} className="rounded bg-muted/50 p-2.5">
                          <p className="font-medium">{l.lessonOrder}. {l.title}</p>
                          {l.content && <p className="mt-1 whitespace-pre-wrap text-[11px] text-muted-foreground">{l.content}</p>}
                          <LessonReferenceView moduleType={m.moduleType} reference={l.reference} />
                        </div>
                      ))}
                      {m.lessons.length === 0 && <p className="italic text-muted-foreground">No lessons</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Quiz ({selectedCourse.quiz.title})</h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Passing Score: <strong>{selectedCourse.quiz.passScore}%</strong> · Total Questions: <strong>{selectedCourse.quiz.questionCount}</strong>
              </p>

              <div className="max-h-96 space-y-2 overflow-y-auto rounded border p-3 text-xs">
                {questions.map((q, idx) => (
                  <div key={q.id} className="rounded border bg-card p-2.5">
                    <p className="font-semibold">Q{idx + 1}. {q.questionText}</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px]">
                      {q.options.map((opt) => (
                        <span
                          key={opt.key}
                          className={`rounded px-1.5 py-0.5 ${
                            opt.key === q.correctOption ? 'bg-green-100 font-bold text-green-900' : 'text-muted-foreground'
                          }`}
                        >
                          [{opt.key}] {opt.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {questions.length === 0 && <p className="text-muted-foreground italic">No quiz questions authored.</p>}
              </div>

              <h4 className="mt-4 mb-2 text-sm font-semibold">Practical Assessment Checklist</h4>
              <div className="space-y-2 rounded border p-3 text-xs">
                {selectedCourse.practicalChecklist.map((item, idx) => (
                  <div key={item.lessonId ?? idx} className="flex items-center justify-between border-b pb-1">
                    <span>Step {item.stepOrder}: {item.actionText}</span>
                    {item.techniqueGate && <span className="rounded bg-amber-100 px-1 text-amber-800">{item.techniqueGate}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Regulations

export function TrainingRegulationsPage() {
  const loader = useCallback(() => brewforgeApi.regulations.list(), [])
  const regulations = useAsyncLoad(loader, [] as TrainingRegulationDto[])
  const action = useAction()

  const [formType, setFormType] = useState<CourseType>('PRODUCT')
  const [formRole, setFormRole] = useState<string>('TRAINEE')
  const [formPrereq, setFormPrereq] = useState<string>('')
  const [dueDays, setDueDays] = useState('30')
  const [maxRetakes, setMaxRetakes] = useState('3')
  const [minAttendance, setMinAttendance] = useState('80')
  const [effectiveFrom, setEffectiveFrom] = useState(today())

  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSave = () => {
    const payload = {
      courseType: formType,
      mandatoryForRole: formRole ? (formRole as Role) : null,
      prerequisiteType: formPrereq ? (formPrereq as CourseType) : null,
      dueDays: Number(dueDays),
      maxRetakes: Number(maxRetakes),
      minAttendancePct: Number(minAttendance),
      effectiveFrom,
    }

    if (editingId) {
      void action.run(
        () => brewforgeApi.regulations.update(editingId, payload),
        'Regulation updated.',
        () => {
          setEditingId(null)
          regulations.reload()
        },
      )
    } else {
      void action.run(
        () => brewforgeApi.regulations.create(payload),
        'New regulation established.',
        regulations.reload,
      )
    }
  }

  return (
    <>
      <PageHeader
        title="Training Regulations & Standards"
        description="Establish organizational rules: mandatory courses per role, due days, retake limits, and minimum class attendance (80%)."
      />
      <ErrorBox error={action.error ?? regulations.error} />
      <SuccessBox message={action.message} />

      <Panel title={editingId ? `Edit Regulation #${editingId}` : 'Establish Regulation'}>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Course Type">
            <Select value={formType} onChange={(e) => setFormType(e.target.value as CourseType)}>
              {COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Mandatory For Role">
            <Select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
              <option value="">— None —</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Prerequisite Course Type">
            <Select value={formPrereq} onChange={(e) => setFormPrereq(e.target.value)}>
              <option value="">— None —</option>
              {COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Due Days"><TextInput type="number" value={dueDays} onChange={(e) => setDueDays(e.target.value)} /></Field>
          <Field label="Max Quiz Retakes"><TextInput type="number" value={maxRetakes} onChange={(e) => setMaxRetakes(e.target.value)} /></Field>
          <Field label="Min Attendance %"><TextInput type="number" value={minAttendance} onChange={(e) => setMinAttendance(e.target.value)} /></Field>
          <Field label="Effective From"><TextInput type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} /></Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={action.busy} onClick={handleSave}>
            {editingId ? 'Save Changes' : 'Establish Regulation'}
          </Button>
          {editingId && (
            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          )}
        </div>
      </Panel>

      <Panel title="Active Training Regulations">
        <Loading show={regulations.loading} />
        <DataTable
          rows={regulations.data}
          rowKey={(r) => r.id}
          columns={[
            { header: 'ID', cell: (r) => `#${r.id}` },
            { header: 'Course Type', cell: (r) => r.courseType },
            { header: 'Mandatory Role', cell: (r) => r.mandatoryForRole ?? 'All' },
            { header: 'Prerequisite', cell: (r) => r.prerequisiteType ?? '—' },
            { header: 'Due Period', cell: (r) => `${r.dueDays} days` },
            { header: 'Max Retakes', cell: (r) => `${r.maxRetakes} retakes` },
            { header: 'Min Attendance', cell: (r) => `${r.minAttendancePct}%` },
            { header: 'Effective', cell: (r) => r.effectiveFrom },
            {
              header: 'Actions',
              cell: (r) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(r.id)
                    setFormType(r.courseType)
                    setFormRole(r.mandatoryForRole ?? '')
                    setFormPrereq(r.prerequisiteType ?? '')
                    setDueDays(String(r.dueDays))
                    setMaxRetakes(String(r.maxRetakes))
                    setMinAttendance(String(r.minAttendancePct))
                    setEffectiveFrom(r.effectiveFrom)
                  }}
                >
                  Edit
                </Button>
              ),
            },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ Enrollment Governance

export function EnrollmentGovernancePage() {
  const [page, setPage] = useState(1)
  const loader = useCallback(
    () => brewforgeApi.assignments.list({ page, size: PAGE_SIZE }),
    [page],
  )
  const enrollments = useAsyncLoad(loader, { items: [] as AssignmentDto[], page: 1, size: PAGE_SIZE, total: 0 })
  const action = useAction()

  // Practical videos viewer modal
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | null>(null)
  const [videos, setVideos] = useState<PracticalVideoDto[]>([])

  const viewVideos = async (enrollmentId: number) => {
    setSelectedEnrollmentId(enrollmentId)
    const list = await brewforgeApi.enrollments.listPracticalVideos(enrollmentId)
    setVideos(list)
  }

  return (
    <>
      <PageHeader
        title="Enrollment Governance & Oversight"
        description="Monitor learner progression, unlock/reset LOCKED enrollments after retakes exhaustion, close abandoned courses, and inspect audit videos."
      />
      <ErrorBox error={action.error ?? enrollments.error} />
      <SuccessBox message={action.message} />

      <Panel title="All Trainee Enrollments">
        <Loading show={enrollments.loading} />
        <DataTable
          rows={enrollments.data.items}
          rowKey={(e) => e.enrollmentId}
          columns={[
            { header: 'ID', cell: (e) => `#${e.enrollmentId}` },
            { header: 'Learner', cell: (e) => e.fullName },
            { header: 'Branch', cell: (e) => e.branchCode ?? 'HQ' },
            { header: 'Course', cell: (e) => e.courseTitle },
            { header: 'Progress', cell: (e) => `${e.progressPercent}%` },
            { header: 'Enrollment State', cell: (e) => <StateBadge value={e.enrollmentState} /> },
            {
              header: 'Governance Actions',
              cell: (e) => (
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => void viewVideos(e.enrollmentId)}>
                    Videos
                  </Button>
                  {e.enrollmentState === 'LOCKED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(
                          () => brewforgeApi.enrollments.reset(e.enrollmentId),
                          `Enrollment #${e.enrollmentId} reset to IN_PROGRESS.`,
                          enrollments.reload,
                        )
                      }
                    >
                      Reset Retakes
                    </Button>
                  )}
                  {e.enrollmentState !== 'CLOSED' && e.enrollmentState !== 'PASSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(
                          () => brewforgeApi.enrollments.close(e.enrollmentId),
                          `Enrollment #${e.enrollmentId} closed.`,
                          enrollments.reload,
                        )
                      }
                    >
                      Close
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={enrollments.data.total} onPage={setPage} />
      </Panel>

      {selectedEnrollmentId && (
        <Panel
          title={`Practical Videos for Enrollment #${selectedEnrollmentId}`}
          action={
            <Button size="sm" variant="ghost" onClick={() => setSelectedEnrollmentId(null)}>
              Close
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {videos.map((v) => (
              <div key={v.id} className="rounded border p-3 text-xs">
                <p className="font-semibold">Video #{v.id} · {v.fileName}</p>
                <p className="text-muted-foreground">Uploaded at {fmtDate(v.uploadedAt)} by Trainer #{v.uploadedBy}</p>
                <div className="mt-2">
                  <AuthenticatedVideo videoId={v.id} />
                </div>
              </div>
            ))}
            {videos.length === 0 && <p className="text-xs text-muted-foreground">No practical videos uploaded for this enrollment.</p>}
          </div>
        </Panel>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Effectiveness

export function TrainingEffectivenessPage() {
  return (
    <>
      <PageHeader
        title="Training Effectiveness & Analytics"
        description="Analyze module pass rates, identified bottlenecks (weak modules highlighted), and correlation with branch sales."
      />
      <CourseEffectivenessPanel />
    </>
  )
}
