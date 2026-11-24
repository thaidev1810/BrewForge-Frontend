import { useCallback, useEffect, useState } from 'react'
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
  TextArea,
  TextInput,
  Toolbar,
  fmtDate,
  useAction,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { LessonReferenceView } from '@/components/common/LessonReferenceView'
import { brewforgeApi } from '@/services/brewforgeApi'
import type {
  CourseDetailDto,
  CourseDto,
  CourseType,
  QuestionBankDto,
  QuestionType,
  QuizOption,
  QuizQuestionDto,
  RecipeDto,
} from '@/types/backend'

const PAGE_SIZE = 20
const COURSE_TYPES: CourseType[] = ['INDUCTION', 'PRODUCT', 'EQUIPMENT', 'RECERTIFICATION']

export function TrainerCoursesPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [courseType, setCourseType] = useState('')
  const loader = useCallback(
    () =>
      brewforgeApi.courses.list({
        page,
        size: PAGE_SIZE,
        q: q || undefined,
        state: state || undefined,
        courseType: courseType || undefined,
      }),
    [page, q, state, courseType],
  )
  const courses = useAsyncLoad(loader, { items: [] as CourseDto[], page: 1, size: PAGE_SIZE, total: 0 })

  const recipesLoader = useCallback(async () => (await brewforgeApi.recipes.list({ page: 1, size: 100 })).items, [])
  const recipes = useAsyncLoad<RecipeDto[]>(recipesLoader, [])

  const action = useAction()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<CourseDetailDto | null>(null)

  // New course form
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<CourseType>('PRODUCT')
  const [newVersionId, setNewVersionId] = useState<string>('')

  // Edit module/lessons/quiz state
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null)
  const [moduleDuration, setModuleDuration] = useState<string>('30')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonMedia, setLessonMedia] = useState('')
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)

  // Quiz state
  const [quizTitle, setQuizTitle] = useState('')
  const [quizPassScore, setQuizPassScore] = useState('80')
  const [questionText, setQuestionText] = useState('')
  const [optA, setOptA] = useState('')
  const [optB, setOptB] = useState('')
  const [optC, setOptC] = useState('')
  const [optD, setOptD] = useState('')
  const [correctOption, setCorrectOption] = useState('A')

  // Practical checklist
  const [selectedSteps, setSelectedSteps] = useState<number[]>([])

  const loadDetail = useCallback(async (id: number) => {
    const detail = await brewforgeApi.courses.get(id)
    setSelectedDetail(detail)
    setQuizTitle(detail.quiz.title)
    setQuizPassScore(String(detail.quiz.passScore))
    setSelectedSteps(detail.practicalChecklist.map((c) => c.recipeStepId).filter((s): s is number => s !== null))
    if (detail.modules.length > 0) {
      setActiveModuleId(detail.modules[0].id)
      setModuleDuration(String(detail.modules[0].durationMinutes ?? 30))
    }
  }, [])

  const handleSelect = (course: CourseDto) => {
    setSelectedId(course.id)
    void loadDetail(course.id)
  }

  const handleCreateCourse = () => {
    void action.run(
      () =>
        brewforgeApi.courses.create({
          title: newTitle,
          courseType: newType,
          recipeVersionId: newType === 'PRODUCT' && newVersionId ? Number(newVersionId) : null,
        }),
      'Course created.',
      (c) => {
        setNewTitle('')
        setNewVersionId('')
        courses.reload()
        handleSelect(c)
      },
    )
  }

  const activeModule = selectedDetail?.modules.find((m) => m.id === activeModuleId)

  return (
    <>
      <PageHeader
        title="Courses & Authoring"
        description="Create courses bound to released recipes, author lessons for technique & exception handling, configure quiz questions and select practical checklist."
      />
      <ErrorBox error={action.error ?? courses.error ?? recipes.error} />
      <SuccessBox message={action.message} />

      <Panel title="Create New Course">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Title">
            <TextInput value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Espresso Craft & Standards" />
          </Field>
          <Field label="Course Type">
            <Select value={newType} onChange={(e) => setNewType(e.target.value as CourseType)}>
              {COURSE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label={newType === 'PRODUCT' ? 'Released Recipe Version (Required for PRODUCT)' : 'Recipe Version (Optional)'}>
            <Select value={newVersionId} onChange={(e) => setNewVersionId(e.target.value)}>
              <option value="">— select released version —</option>
              {recipes.data
                .filter((r) => r.releasedVersionId)
                .map((r) => (
                  <option key={r.id} value={r.releasedVersionId ?? ''}>
                    {r.recipeCode} · {r.name} (v{r.releasedVersionNo})
                  </option>
                ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button size="sm" disabled={action.busy || !newTitle.trim()} onClick={handleCreateCourse}>
              Create Draft Course
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Course Catalog">
        <Toolbar>
          <Field label="Search">
            <TextInput value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="course title..." />
          </Field>
          <Field label="State">
            <Select value={state} onChange={(e) => { setState(e.target.value); setPage(1) }}>
              <option value="">All</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="OUT_OF_DATE">OUT_OF_DATE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </Select>
          </Field>
          <Field label="Type">
            <Select value={courseType} onChange={(e) => { setCourseType(e.target.value); setPage(1) }}>
              <option value="">All</option>
              {COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </Toolbar>
        <Loading show={courses.loading} />
        <DataTable
          rows={courses.data.items}
          rowKey={(c) => c.id}
          selectedKey={selectedId}
          onRowClick={handleSelect}
          columns={[
            { header: 'Title', cell: (c) => c.title },
            { header: 'Type', cell: (c) => c.courseType },
            { header: 'Recipe', cell: (c) => (c.recipeCode ? `${c.recipeCode} (v${c.versionNo})` : '—') },
            { header: 'Duration', cell: (c) => (c.totalDurationMin ? `${c.totalDurationMin} min` : '—') },
            { header: 'State', cell: (c) => <StateBadge value={c.state} /> },
            { header: 'Published', cell: (c) => fmtDate(c.publishedAt) },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={courses.data.total} onPage={setPage} />
      </Panel>

      {selectedDetail && (
        <Panel
          title={`Course Studio: #${selectedDetail.id} · ${selectedDetail.title}`}
          description={`State: ${selectedDetail.state} · Type: ${selectedDetail.courseType} · Recipe: ${selectedDetail.recipeCode ?? 'None'}`}
        >
          <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
            {selectedDetail.state === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(
                      () => brewforgeApi.courses.submit(selectedDetail.id),
                      'Course submitted for manager approval.',
                      () => { courses.reload(); void loadDetail(selectedDetail.id) },
                    )
                  }
                >
                  Submit for Approval
                </Button>
                <Button
                  size="sm"
                  variant="accent"
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(
                      () => brewforgeApi.courses.aiPopulate(selectedDetail.id),
                      'Draft modules, practical checklist and quiz generated. Review before submitting.',
                      () => { courses.reload(); void loadDetail(selectedDetail.id) },
                    )
                  }
                >
                  Generate draft content
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={action.busy}
              onClick={() =>
                void action.run(
                  () => brewforgeApi.courses.rebuild(selectedDetail.id),
                  'Course rebuilt from recipe version.',
                  () => { courses.reload(); void loadDetail(selectedDetail.id) },
                )
              }
            >
              Rebuild Modules
            </Button>
            {selectedDetail.state === 'PUBLISHED' && (
              <Button
                size="sm"
                variant="outline"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => brewforgeApi.courses.archive(selectedDetail.id),
                    'Course archived.',
                    () => { courses.reload(); void loadDetail(selectedDetail.id) },
                  )
                }
              >
                Archive Course
              </Button>
            )}
          </div>

          <h3 className="mb-2 text-sm font-semibold">7 Modules Breakdown</h3>
          <div className="mb-4 grid gap-2 md:grid-cols-7">
            {selectedDetail.modules.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`rounded border p-2 text-left text-xs transition-colors ${activeModuleId === m.id ? 'border-primary bg-primary/10 font-bold' : 'hover:bg-muted'
                  }`}
                onClick={() => {
                  setActiveModuleId(m.id)
                  setModuleDuration(String(m.durationMinutes ?? 30))
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{m.moduleOrder}. {m.moduleType}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{m.source}</span>
                  <StateBadge value={m.state} />
                </div>
                <div className="mt-1 text-[10px]">{m.durationMinutes ?? 0}m · {m.lessons.length} lessons</div>
              </button>
            ))}
          </div>

          {activeModule && (
            <div className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div>
                  <span className="font-semibold text-sm">
                    Module {activeModule.moduleOrder}: {activeModule.moduleType} ({activeModule.source})
                  </span>
                  <span className="ml-2"><StateBadge value={activeModule.state} /></span>
                </div>
                <div className="flex items-center gap-2">
                  <Field label="Duration (min)">
                    <TextInput
                      type="number"
                      className="w-20"
                      value={moduleDuration}
                      onChange={(e) => setModuleDuration(e.target.value)}
                    />
                  </Field>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={action.busy || activeModule.source === 'GENERATED'}
                    onClick={() =>
                      void action.run(
                        () => brewforgeApi.courses.updateModule(activeModule.id, Number(moduleDuration)),
                        'Duration updated.',
                        () => void loadDetail(selectedDetail.id),
                      )
                    }
                  >
                    Save Duration
                  </Button>
                  {activeModule.source === 'GENERATED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(
                          () => brewforgeApi.courses.regenerateModule(activeModule.id),
                          'Module regenerated from recipe.',
                          () => void loadDetail(selectedDetail.id),
                        )
                      }
                    >
                      Regenerate
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Lessons in this Module</h4>
                <div className="mt-2 space-y-2">
                  {activeModule.lessons.map((lesson) => (
                    <div key={lesson.id} className="rounded border bg-card p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {lesson.lessonOrder}. {lesson.title} {lesson.generated && <span className="text-xs text-muted-foreground">(Generated)</span>}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingLessonId(lesson.id)
                              setLessonTitle(lesson.title)
                              setLessonContent(lesson.content ?? '')
                              setLessonMedia(lesson.mediaUrl ?? '')
                            }}
                          >
                            Edit
                          </Button>
                          {!lesson.generated && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void action.run(
                                  () => brewforgeApi.courses.deleteLesson(lesson.id),
                                  'Lesson deleted.',
                                  () => void loadDetail(selectedDetail.id),
                                )
                              }
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                      {lesson.content ? (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{lesson.content}</p>
                      ) : (
                        !lesson.reference && <p className="mt-1 text-xs text-muted-foreground">No content</p>
                      )}
                      <LessonReferenceView moduleType={activeModule.moduleType} reference={lesson.reference} />
                      {lesson.mediaUrl && <p className="mt-1 text-xs text-blue-600 underline">{lesson.mediaUrl}</p>}
                    </div>
                  ))}
                  {activeModule.lessons.length === 0 && (
                    <p className="text-xs text-muted-foreground">No lessons added yet.</p>
                  )}
                </div>

                <div className="mt-4 rounded border bg-muted/40 p-3">
                  <h5 className="mb-2 text-xs font-semibold">{editingLessonId ? 'Edit Lesson' : 'Add New Lesson to Module'}</h5>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Field label="Title">
                      <TextInput value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
                    </Field>
                    <Field label="Media URL (optional)">
                      <TextInput value={lessonMedia} onChange={(e) => setLessonMedia(e.target.value)} />
                    </Field>
                    <Field label="Content" className="md:col-span-2">
                      <TextArea value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} />
                    </Field>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      disabled={action.busy || !lessonTitle.trim()}
                      onClick={() => {
                        const payload = { title: lessonTitle, content: lessonContent, mediaUrl: lessonMedia || null }
                        if (editingLessonId) {
                          void action.run(
                            () => brewforgeApi.courses.updateLesson(editingLessonId, payload),
                            'Lesson updated.',
                            () => {
                              setEditingLessonId(null)
                              setLessonTitle('')
                              setLessonContent('')
                              setLessonMedia('')
                              void loadDetail(selectedDetail.id)
                            },
                          )
                        } else {
                          void action.run(
                            () => brewforgeApi.courses.addLesson(activeModule.id, payload),
                            'Lesson added.',
                            () => {
                              setLessonTitle('')
                              setLessonContent('')
                              setLessonMedia('')
                              void loadDetail(selectedDetail.id)
                            },
                          )
                        }
                      }}
                    >
                      {editingLessonId ? 'Save Lesson' : 'Add Lesson'}
                    </Button>
                    {editingLessonId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingLessonId(null)
                          setLessonTitle('')
                          setLessonContent('')
                          setLessonMedia('')
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">Quiz Settings & Questions</h3>
              <div className="mb-3 flex items-end gap-2">
                <Field label="Quiz Title">
                  <TextInput value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
                </Field>
                <Field label="Pass Score (%)">
                  <TextInput
                    type="number"
                    className="w-20"
                    value={quizPassScore}
                    onChange={(e) => setQuizPassScore(e.target.value)}
                  />
                </Field>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void action.run(
                      () =>
                        brewforgeApi.courses.updateQuiz(selectedDetail.id, {
                          title: quizTitle,
                          passScore: Number(quizPassScore),
                        }),
                      'Quiz settings updated.',
                      () => void loadDetail(selectedDetail.id),
                    )
                  }
                >
                  Save Quiz
                </Button>
              </div>

              <div className="space-y-2">
                <QuizQuestionList
                  courseId={selectedDetail.id}
                  questionCount={selectedDetail.quiz.questionCount}
                  onReload={() => void loadDetail(selectedDetail.id)}
                />
              </div>

              <div className="mt-4 rounded border bg-muted/30 p-3">
                <h5 className="mb-2 text-xs font-semibold">Add Question</h5>
                <Field label="Target Module">
                  <Select
                    value={activeModuleId ?? selectedDetail.modules[0]?.id ?? ''}
                    onChange={(e) => setActiveModuleId(Number(e.target.value))}
                  >
                    {selectedDetail.modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.moduleOrder}. {m.moduleType}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Question Text" className="mt-2">
                  <TextInput value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
                </Field>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Option A"><TextInput value={optA} onChange={(e) => setOptA(e.target.value)} /></Field>
                  <Field label="Option B"><TextInput value={optB} onChange={(e) => setOptB(e.target.value)} /></Field>
                  <Field label="Option C"><TextInput value={optC} onChange={(e) => setOptC(e.target.value)} /></Field>
                  <Field label="Option D"><TextInput value={optD} onChange={(e) => setOptD(e.target.value)} /></Field>
                </div>
                <Field label="Correct Option" className="mt-2">
                  <Select value={correctOption} onChange={(e) => setCorrectOption(e.target.value)}>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </Select>
                </Field>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={action.busy || !questionText.trim() || !optA.trim() || !optB.trim()}
                  onClick={() =>
                    void action.run(
                      () =>
                        brewforgeApi.courses.addQuestion(selectedDetail.id, {
                          courseModuleId: activeModuleId ?? selectedDetail.modules[0].id,
                          questionText,
                          options: [
                            { key: 'A', text: optA },
                            { key: 'B', text: optB },
                            ...(optC.trim() ? [{ key: 'C', text: optC }] : []),
                            ...(optD.trim() ? [{ key: 'D', text: optD }] : []),
                          ],
                          correctOption,
                        }),
                      'Question added.',
                      () => {
                        setQuestionText('')
                        setOptA('')
                        setOptB('')
                        setOptC('')
                        setOptD('')
                        void loadDetail(selectedDetail.id)
                      },
                    )
                  }
                >
                  Add Question to Course Quiz
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">Practical Assessment Checklist</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Select recipe steps that must be evaluated during practical examination.
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded border p-2">
                {selectedDetail.practicalChecklist.map((item) => (
                  <label key={item.lessonId} className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={item.recipeStepId ? selectedSteps.includes(item.recipeStepId) : true}
                      onChange={(e) => {
                        if (!item.recipeStepId) return
                        const stepId = item.recipeStepId
                        setSelectedSteps((prev) =>
                          e.target.checked ? [...prev, stepId] : prev.filter((id) => id !== stepId),
                        )
                      }}
                    />
                    <div>
                      <span className="font-medium">Step {item.stepOrder}: {item.actionText}</span>
                      {item.techniqueGate && (
                        <span className="ml-2 rounded bg-amber-100 px-1 text-[10px] text-amber-800">
                          {item.techniqueGate}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <Button
                size="sm"
                className="mt-3"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => brewforgeApi.courses.setPracticalChecklist(selectedDetail.id, selectedSteps),
                    'Checklist saved.',
                    () => void loadDetail(selectedDetail.id),
                  )
                }
              >
                Save Practical Checklist
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </>
  )
}

function QuizQuestionList({
  courseId,
  questionCount,
  onReload,
}: {
  courseId: number
  questionCount: number
  onReload: () => void
}) {
  const loader = useCallback(() => brewforgeApi.courses.listQuestions(courseId), [courseId])
  const questions = useAsyncLoad(loader, [] as QuizQuestionDto[])
  const reload = questions.reload
  const action = useAction()

  useEffect(() => {
    reload()
  }, [questionCount, reload])

  return (
    <div className="space-y-2">
      <Loading show={questions.loading} />
      {questions.data.map((q) => (
        <div key={q.id} className="rounded border bg-card p-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{q.questionText}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void action.run(
                  () => brewforgeApi.courses.deleteQuestion(q.id),
                  'Question removed.',
                  () => { questions.reload(); onReload() },
                )
              }
            >
              Delete
            </Button>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-muted-foreground">
            {q.options.map((opt) => (
              <span key={opt.key} className={opt.key === q.correctOption ? 'font-bold text-green-700 mr-2' : 'mr-2'}>
                [{opt.key}] {opt.text}
              </span>
            ))}
          </div>
        </div>
      ))}
      {questions.data.length === 0 && !questions.loading && (
        <p className="text-xs text-muted-foreground">No questions in quiz yet.</p>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ Question Bank

const QUESTION_TYPES: QuestionType[] = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']

export function QuestionBankPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [qType, setQType] = useState('')
  const loader = useCallback(
    () => brewforgeApi.questionBank.list({ page, size: PAGE_SIZE, q: q || undefined, questionType: qType || undefined }),
    [page, q, qType],
  )
  const questions = useAsyncLoad(loader, { items: [] as QuestionBankDto[], page: 1, size: PAGE_SIZE, total: 0 })
  const action = useAction()

  const [formText, setFormText] = useState('')
  const [formType, setFormType] = useState<QuestionType>('SINGLE_CHOICE')
  const [optA, setOptA] = useState('')
  const [optB, setOptB] = useState('')
  const [optC, setOptC] = useState('')
  const [optD, setOptD] = useState('')
  const [correct, setCorrect] = useState('A')

  // Copy to course modal/input
  const [targetCourseId, setTargetCourseId] = useState('')

  const handleCreate = () => {
    let opts: QuizOption[] = []
    let correctOpts: string[] = []

    if (formType === 'TRUE_FALSE') {
      opts = [{ key: 'TRUE', text: 'True' }, { key: 'FALSE', text: 'False' }]
      correctOpts = [correct === 'FALSE' ? 'FALSE' : 'TRUE']
    } else {
      opts = [
        { key: 'A', text: optA },
        { key: 'B', text: optB },
        ...(optC ? [{ key: 'C', text: optC }] : []),
        ...(optD ? [{ key: 'D', text: optD }] : []),
      ]
      correctOpts = [correct]
    }

    void action.run(
      () =>
        brewforgeApi.questionBank.create({
          questionText: formText,
          questionType: formType,
          options: opts,
          correctOptions: correctOpts,
        }),
      'Question added to Question Bank.',
      () => {
        setFormText('')
        setOptA('')
        setOptB('')
        setOptC('')
        setOptD('')
        questions.reload()
      },
    )
  }

  return (
    <>
      <PageHeader title="Question Bank" description="Central repository of quiz questions across recipes and topics." />
      <ErrorBox error={action.error ?? questions.error} />
      <SuccessBox message={action.message} />

      <Panel title="Create Bank Question">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Question Type">
            <Select value={formType} onChange={(e) => setFormType(e.target.value as QuestionType)}>
              {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Question Text" className="md:col-span-2">
            <TextInput value={formText} onChange={(e) => setFormText(e.target.value)} />
          </Field>
        </div>

        {formType !== 'TRUE_FALSE' ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="Option A"><TextInput value={optA} onChange={(e) => setOptA(e.target.value)} /></Field>
            <Field label="Option B"><TextInput value={optB} onChange={(e) => setOptB(e.target.value)} /></Field>
            <Field label="Option C"><TextInput value={optC} onChange={(e) => setOptC(e.target.value)} /></Field>
            <Field label="Option D"><TextInput value={optD} onChange={(e) => setOptD(e.target.value)} /></Field>
            <Field label="Correct Option" className="col-span-2">
              <Select value={correct} onChange={(e) => setCorrect(e.target.value)}>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </Select>
            </Field>
          </div>
        ) : (
          <Field label="Correct Answer" className="mt-3">
            <Select value={correct} onChange={(e) => setCorrect(e.target.value)}>
              <option value="TRUE">True</option>
              <option value="FALSE">False</option>
            </Select>
          </Field>
        )}

        <Button size="sm" className="mt-3" disabled={action.busy || !formText.trim()} onClick={handleCreate}>
          Save to Question Bank
        </Button>
      </Panel>

      <Panel title="Repository Questions">
        <Toolbar>
          <Field label="Search">
            <TextInput value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </Field>
          <Field label="Type">
            <Select value={qType} onChange={(e) => { setQType(e.target.value); setPage(1) }}>
              <option value="">All</option>
              {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Add to Course ID">
            <TextInput className="w-24" value={targetCourseId} onChange={(e) => setTargetCourseId(e.target.value)} placeholder="e.g. 1" />
          </Field>
        </Toolbar>
        <Loading show={questions.loading} />
        <DataTable
          rows={questions.data.items}
          rowKey={(q) => q.id}
          columns={[
            { header: 'ID', cell: (q) => q.id },
            { header: 'Type', cell: (q) => q.questionType },
            { header: 'Question', cell: (q) => q.questionText },
            {
              header: 'Options',
              cell: (q) => (
                <div className="text-xs">
                  {q.options.map((o) => (
                    <span key={o.key} className={q.correctOptions.includes(o.key) ? 'font-bold text-green-700 mr-2' : 'mr-2'}>
                      [{o.key}] {o.text}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              header: 'Actions',
              cell: (q) => (
                <div className="flex gap-1">
                  {targetCourseId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void action.run(
                          () => brewforgeApi.questionBank.addToCourse(q.id, Number(targetCourseId)),
                          `Added to course #${targetCourseId}.`,
                        )
                      }
                    >
                      + Course
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void action.run(
                        () => brewforgeApi.questionBank.remove(q.id),
                        'Question deleted.',
                        questions.reload,
                      )
                    }
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={questions.data.total} onPage={setPage} />
      </Panel>
    </>
  )
}

