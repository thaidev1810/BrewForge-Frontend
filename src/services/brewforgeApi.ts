import { apiClient } from './apiClient'
import type { MeProfile } from '@/features/auth/authTypes'
import type {
  AiModelInfoDto,
  AssignmentDto,
  AssignmentRequest,
  AssignmentResultDto,
  AttendanceEntryRequest,
  AttendanceSheetDto,
  AuditEntryDto,
  AuditSummaryDto,
  BranchAuditDto,
  BranchAuditRequest,
  BranchDto,
  BranchLaunchStatusDto,
  BranchPerformanceDto,
  BranchRequest,
  CategoryDto,
  CategoryRequest,
  CertificateDto,
  ChecklistItemDto,
  CorrectiveActionDto,
  CourseDetailDto,
  CourseDto,
  CourseEffectivenessDto,
  CourseModuleDto,
  CreateCourseRequest,
  CreateRecipeRequest,
  CreateUserRequest,
  DraftResultDto,
  EligibilityDto,
  EmployeeSkillSummaryDto,
  EnrollmentDto,
  EnrollmentModuleDto,
  EquipmentClassDto,
  EquipmentClassRequest,
  EvidenceDto,
  FinanceOptimizationResultDto,
  FinanceOptimizeRequest,
  FinanceOverviewDto,
  ImpactAnalysisDto,
  ImpactEntityType,
  ImportedRecipeDto,
  ImportExistingRecipeRequest,
  IngredientDto,
  IngredientRequest,
  LaunchDecisionType,
  LearnerQuizDto,
  LessonDto,
  LessonRequest,
  MyNotificationDto,
  OpenClassResultDto,
  PagedResult,
  PageQueryParams,
  PilotDto,
  PilotEvaluation,
  PilotReadinessDto,
  PilotRequest,
  PosImportResultDto,
  PracticalEvaluationDto,
  PracticalEvaluationRequest,
  PracticalScheduleDto,
  PracticalScheduleRequest,
  PracticalVideoDto,
  ProductDto,
  ProductRequest,
  PushConfigDto,
  PushSubscriptionDto,
  QuestionBankDto,
  QuestionBankRequest,
  QuizAttemptResultDto,
  QuizDto,
  QuizQuestionDto,
  QuizQuestionRequest,
  RecipeContentRequest,
  RecipeDto,
  RecipeUnitEconomicsDto,
  RecipeVersionDto,
  RecipeVersionSummaryDto,
  ReleaseResultDto,
  RepairMode,
  ReviewResultDto,
  SalesAggregateDto,
  SalesGrouping,
  SalesRecordDto,
  SellableDrinkDto,
  SensoryAnalyzeRequest,
  SensoryProfileDto,
  SessionRequest,
  SettingDto,
  SkillDto,
  StepDecisionRequest,
  TrainingClassDto,
  TrainingClassRequest,
  TrainingNeedDto,
  TrainingProgressRowDto,
  TrainingRegulationDto,
  TrainingRegulationRequest,
  TrainingSessionDto,
  UpdateRecipeRequest,
  UpdateUserRequest,
  UserDirectoryItemDto,
  UserDto,
  ValidationResultDto,
  VersionTraceDto,
} from '@/types/backend'

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function downloadBlob(blob: Blob, filename: string) {
  if (typeof window === 'undefined') return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stripApiPrefix(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('/api/v1/')) return pathOrUrl.slice('/api/v1'.length)
  if (pathOrUrl.startsWith('api/v1/')) return pathOrUrl.slice('api/v1'.length)
  return pathOrUrl
}

export const brewforgeApi = {
  auth: {
    me: async () => (await apiClient.get<MeProfile>('/auth/me')).data,
    changePassword: async (currentPassword: string, newPassword: string) => {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword })
    },
  },

  notifications: {
    myNotifications: async (params?: PageQueryParams) =>
      (await apiClient.get<PagedResult<MyNotificationDto>>('/me/notifications', { params })).data,
    getPushConfig: async () => (await apiClient.get<PushConfigDto>('/push/config')).data,
    listPushSubscriptions: async () => (await apiClient.get<PushSubscriptionDto[]>('/me/push-subscriptions')).data,
    subscribePush: async (endpoint: string, p256dh: string, auth: string) =>
      (await apiClient.post<PushSubscriptionDto>('/me/push-subscriptions', { endpoint, keys: { p256dh, auth } })).data,
    unsubscribePush: async (endpoint: string) => {
      await apiClient.delete('/me/push-subscriptions', { params: { endpoint } })
    },
  },

  users: {
    list: async (params?: PageQueryParams & { q?: string; role?: string; branchId?: number; status?: string }) =>
      (await apiClient.get<PagedResult<UserDto>>('/users', { params })).data,
    get: async (id: number) => (await apiClient.get<UserDto>(`/users/${id}`)).data,
    create: async (body: CreateUserRequest) => (await apiClient.post<UserDto>('/users', body)).data,
    update: async (id: number, body: UpdateUserRequest) => (await apiClient.put<UserDto>(`/users/${id}`, body)).data,
    deactivate: async (id: number) => (await apiClient.post<UserDto>(`/users/${id}/deactivate`)).data,
    directory: async (params?: { role?: string; branchId?: number }) =>
      (await apiClient.get<UserDirectoryItemDto[]>('/user-directory', { params })).data,
  },

  branches: {
    list: async (params?: PageQueryParams & { q?: string; status?: string }) =>
      (await apiClient.get<PagedResult<BranchDto>>('/branches', { params })).data,
    get: async (id: number) => (await apiClient.get<BranchDto>(`/branches/${id}`)).data,
    create: async (body: BranchRequest) => (await apiClient.post<BranchDto>('/branches', body)).data,
    update: async (id: number, body: BranchRequest) => (await apiClient.put<BranchDto>(`/branches/${id}`, body)).data,
    deactivate: async (id: number) => (await apiClient.post<BranchDto>(`/branches/${id}/deactivate`)).data,
  },

  categories: {
    list: async (params?: PageQueryParams & { q?: string; kind?: string; status?: string }) =>
      (await apiClient.get<PagedResult<CategoryDto>>('/categories', { params })).data,
    get: async (id: number) => (await apiClient.get<CategoryDto>(`/categories/${id}`)).data,
    create: async (body: CategoryRequest) => (await apiClient.post<CategoryDto>('/categories', body)).data,
    update: async (id: number, body: CategoryRequest) =>
      (await apiClient.put<CategoryDto>(`/categories/${id}`, body)).data,
    deactivate: async (id: number) => (await apiClient.post<CategoryDto>(`/categories/${id}/deactivate`)).data,
  },

  ingredients: {
    list: async (params?: PageQueryParams & { q?: string; unit?: string; status?: string }) =>
      (await apiClient.get<PagedResult<IngredientDto>>('/ingredients', { params })).data,
    get: async (id: number) => (await apiClient.get<IngredientDto>(`/ingredients/${id}`)).data,
    create: async (body: IngredientRequest) => (await apiClient.post<IngredientDto>('/ingredients', body)).data,
    update: async (id: number, body: IngredientRequest) =>
      (await apiClient.put<IngredientDto>(`/ingredients/${id}`, body)).data,
    deactivate: async (id: number) => (await apiClient.post<IngredientDto>(`/ingredients/${id}/deactivate`)).data,
  },

  equipment: {
    list: async (params?: PageQueryParams & { q?: string; status?: string }) =>
      (await apiClient.get<PagedResult<EquipmentClassDto>>('/equipment-classes', { params })).data,
    get: async (id: number) => (await apiClient.get<EquipmentClassDto>(`/equipment-classes/${id}`)).data,
    create: async (body: EquipmentClassRequest) =>
      (await apiClient.post<EquipmentClassDto>('/equipment-classes', body)).data,
    update: async (id: number, body: EquipmentClassRequest) =>
      (await apiClient.put<EquipmentClassDto>(`/equipment-classes/${id}`, body)).data,
    deactivate: async (id: number) =>
      (await apiClient.post<EquipmentClassDto>(`/equipment-classes/${id}/deactivate`)).data,
  },

  products: {
    list: async (params?: PageQueryParams & { q?: string; categoryId?: number; status?: string }) =>
      (await apiClient.get<PagedResult<ProductDto>>('/products', { params })).data,
    get: async (id: number) => (await apiClient.get<ProductDto>(`/products/${id}`)).data,
    create: async (body: ProductRequest) => (await apiClient.post<ProductDto>('/products', body)).data,
    update: async (id: number, body: ProductRequest) =>
      (await apiClient.put<ProductDto>(`/products/${id}`, body)).data,
    deactivate: async (id: number) => (await apiClient.post<ProductDto>(`/products/${id}/deactivate`)).data,
  },

  settings: {
    list: async () => (await apiClient.get<SettingDto[]>('/settings')).data,
    update: async (key: string, value: string) =>
      (await apiClient.put<SettingDto>(`/settings/${encodeURIComponent(key)}`, { value })).data,
  },

  recipes: {
    list: async (params?: PageQueryParams & { q?: string; category?: string; origin?: string; status?: string }) =>
      (await apiClient.get<PagedResult<RecipeDto>>('/recipes', { params })).data,
    get: async (id: number) => (await apiClient.get<RecipeDto>(`/recipes/${id}`)).data,
    create: async (body: CreateRecipeRequest) => (await apiClient.post<RecipeDto>('/recipes', body)).data,
    update: async (id: number, body: UpdateRecipeRequest) =>
      (await apiClient.put<RecipeDto>(`/recipes/${id}`, body)).data,
    discontinue: async (id: number) => (await apiClient.post<RecipeDto>(`/recipes/${id}/discontinue`)).data,
    activate: async (id: number) => (await apiClient.post<RecipeDto>(`/recipes/${id}/activate`)).data,
    importExisting: async (body: ImportExistingRecipeRequest) =>
      (await apiClient.post<ImportedRecipeDto>('/recipes/import-existing', body)).data,
    listVersions: async (recipeId: number) =>
      (await apiClient.get<RecipeVersionSummaryDto[]>(`/recipes/${recipeId}/versions`)).data,
    createVersion: async (recipeId: number, copyFromVersionId?: number | null) =>
      (
        await apiClient.post<RecipeVersionDto>(`/recipes/${recipeId}/versions`, {
          copyFromVersionId: copyFromVersionId ?? null,
        })
      ).data,
  },

  recipeVersions: {
    get: async (id: number) => (await apiClient.get<RecipeVersionDto>(`/recipe-versions/${id}`)).data,
    updateContent: async (id: number, body: RecipeContentRequest) =>
      (await apiClient.put<RecipeVersionDto>(`/recipe-versions/${id}`, body)).data,
    generateDraft: async (id: number, description: string) =>
      (await apiClient.post<DraftResultDto>(`/recipe-versions/${id}/generate-draft`, { description })).data,
    validate: async (id: number) =>
      (await apiClient.post<ValidationResultDto>(`/recipe-versions/${id}/validate`)).data,
    repair: async (id: number, mode: RepairMode, patch?: RecipeContentRequest | null) =>
      (await apiClient.post<DraftResultDto>(`/recipe-versions/${id}/repair`, { mode, patch: patch ?? null })).data,
    submit: async (id: number) => (await apiClient.post<ValidationResultDto>(`/recipe-versions/${id}/submit`)).data,
    review: async (id: number, decisions: StepDecisionRequest[]) =>
      (await apiClient.post<ReviewResultDto>(`/recipe-versions/${id}/review`, { decisions })).data,
    release: async (id: number, idempotencyKey = newIdempotencyKey()) =>
      (
        await apiClient.post<ReleaseResultDto>(`/recipe-versions/${id}/release`, null, {
          headers: { 'Idempotency-Key': idempotencyKey },
        })
      ).data,
    rollback: async (id: number) => (await apiClient.post<RecipeVersionDto>(`/recipe-versions/${id}/rollback`)).data,
  },

  courses: {
    list: async (
      params?: PageQueryParams & { q?: string; state?: string; courseType?: string; recipeVersionId?: number },
    ) => (await apiClient.get<PagedResult<CourseDto>>('/courses', { params })).data,
    get: async (id: number) => (await apiClient.get<CourseDetailDto>(`/courses/${id}`)).data,
    create: async (body: CreateCourseRequest) => (await apiClient.post<CourseDetailDto>('/courses', body)).data,
    modules: async (courseId: number) =>
      (await apiClient.get<CourseModuleDto[]>(`/courses/${courseId}/modules`)).data,
    getQuiz: async (courseId: number) => (await apiClient.get<QuizDto>(`/courses/${courseId}/quiz`)).data,
    updateQuiz: async (courseId: number, body: { title?: string; passScore?: number }) =>
      (await apiClient.put<QuizDto>(`/courses/${courseId}/quiz`, body)).data,
    listQuestions: async (courseId: number) =>
      (await apiClient.get<QuizQuestionDto[]>(`/courses/${courseId}/quiz/questions`)).data,
    addQuestion: async (courseId: number, body: QuizQuestionRequest) =>
      (await apiClient.post<QuizQuestionDto>(`/courses/${courseId}/quiz/questions`, body)).data,
    updateQuestion: async (questionId: number, body: QuizQuestionRequest) =>
      (await apiClient.put<QuizQuestionDto>(`/quiz-questions/${questionId}`, body)).data,
    deleteQuestion: async (questionId: number) => {
      await apiClient.delete(`/quiz-questions/${questionId}`)
    },
    setPracticalChecklist: async (courseId: number, recipeStepIds: number[]) =>
      (
        await apiClient.put<ChecklistItemDto[]>(`/courses/${courseId}/practical-checklist`, {
          items: recipeStepIds.map((recipeStepId) => ({ recipeStepId })),
        })
      ).data,
    submit: async (courseId: number) => (await apiClient.post<CourseDetailDto>(`/courses/${courseId}/submit`)).data,
    approve: async (courseId: number) => (await apiClient.post<CourseDetailDto>(`/courses/${courseId}/approve`)).data,
    returnCourse: async (courseId: number, comment: string) =>
      (await apiClient.post<CourseDetailDto>(`/courses/${courseId}/return`, { comment })).data,
    rebuild: async (courseId: number) => (await apiClient.post<CourseDetailDto>(`/courses/${courseId}/rebuild`)).data,
    archive: async (courseId: number) => (await apiClient.post<CourseDetailDto>(`/courses/${courseId}/archive`)).data,
    aiPopulate: async (courseId: number) =>
      (await apiClient.post<CourseDetailDto>(`/courses/${courseId}/ai-populate`)).data,
    updateModule: async (moduleId: number, durationMinutes: number) =>
      (await apiClient.put<CourseModuleDto>(`/course-modules/${moduleId}`, { durationMinutes })).data,
    regenerateModule: async (moduleId: number) =>
      (await apiClient.post<CourseModuleDto>(`/course-modules/${moduleId}/regenerate`)).data,
    listLessons: async (moduleId: number) =>
      (await apiClient.get<LessonDto[]>(`/course-modules/${moduleId}/lessons`)).data,
    addLesson: async (moduleId: number, body: LessonRequest) =>
      (await apiClient.post<LessonDto>(`/course-modules/${moduleId}/lessons`, body)).data,
    updateLesson: async (lessonId: number, body: LessonRequest) =>
      (await apiClient.put<LessonDto>(`/lessons/${lessonId}`, body)).data,
    deleteLesson: async (lessonId: number) => {
      await apiClient.delete(`/lessons/${lessonId}`)
    },
  },

  questionBank: {
    list: async (
      params?: PageQueryParams & { q?: string; courseId?: number; recipeVersionId?: number; questionType?: string },
    ) => (await apiClient.get<PagedResult<QuestionBankDto>>('/question-bank', { params })).data,
    get: async (id: number) => (await apiClient.get<QuestionBankDto>(`/question-bank/${id}`)).data,
    create: async (body: QuestionBankRequest) =>
      (await apiClient.post<QuestionBankDto>('/question-bank', body)).data,
    update: async (id: number, body: QuestionBankRequest) =>
      (await apiClient.put<QuestionBankDto>(`/question-bank/${id}`, body)).data,
    remove: async (id: number) => {
      await apiClient.delete(`/question-bank/${id}`)
    },
    addToCourse: async (id: number, courseId: number) =>
      (await apiClient.post<QuizQuestionDto>(`/question-bank/${id}/add-to-course/${courseId}`)).data,
  },

  regulations: {
    list: async () => (await apiClient.get<TrainingRegulationDto[]>('/training-regulations')).data,
    create: async (body: TrainingRegulationRequest) =>
      (await apiClient.post<TrainingRegulationDto>('/training-regulations', body)).data,
    update: async (id: number, body: TrainingRegulationRequest) =>
      (await apiClient.put<TrainingRegulationDto>(`/training-regulations/${id}`, body)).data,
  },

  trainingNeeds: {
    list: async (params?: { branchId?: number; courseId?: number }) =>
      (await apiClient.get<TrainingNeedDto[]>('/training-needs', { params })).data,
  },

  classes: {
    list: async (params?: PageQueryParams & { state?: string; branchId?: number; courseId?: number }) =>
      (await apiClient.get<PagedResult<TrainingClassDto>>('/training-classes', { params })).data,
    get: async (id: number) => (await apiClient.get<TrainingClassDto>(`/training-classes/${id}`)).data,
    create: async (body: TrainingClassRequest) =>
      (await apiClient.post<TrainingClassDto>('/training-classes', body)).data,
    update: async (id: number, body: TrainingClassRequest) =>
      (await apiClient.put<TrainingClassDto>(`/training-classes/${id}`, body)).data,
    addSession: async (classId: number, body: SessionRequest) =>
      (await apiClient.post<TrainingSessionDto>(`/training-classes/${classId}/sessions`, body)).data,
    open: async (classId: number, traineeIds?: number[]) =>
      (
        await apiClient.post<OpenClassResultDto>(`/training-classes/${classId}/open`, {
          traineeIds: traineeIds ?? null,
        })
      ).data,
    close: async (classId: number) =>
      (await apiClient.post<TrainingClassDto>(`/training-classes/${classId}/close`)).data,
    updateSession: async (sessionId: number, body: SessionRequest) =>
      (await apiClient.put<TrainingSessionDto>(`/training-sessions/${sessionId}`, body)).data,
    deleteSession: async (sessionId: number) => {
      await apiClient.delete(`/training-sessions/${sessionId}`)
    },
    getAttendance: async (sessionId: number) =>
      (await apiClient.get<AttendanceSheetDto>(`/training-sessions/${sessionId}/attendance`)).data,
    recordAttendance: async (sessionId: number, entries: AttendanceEntryRequest[]) =>
      (await apiClient.put<AttendanceSheetDto>(`/training-sessions/${sessionId}/attendance`, { entries })).data,
  },

  assignments: {
    list: async (params?: PageQueryParams & { branchId?: number; courseId?: number; status?: string }) =>
      (await apiClient.get<PagedResult<AssignmentDto>>('/assignments', { params })).data,
    assign: async (body: AssignmentRequest) =>
      (await apiClient.post<AssignmentResultDto>('/assignments', body)).data,
  },

  enrollments: {
    mine: async () => (await apiClient.get<EnrollmentDto[]>('/me/enrollments')).data,
    get: async (id: number) => (await apiClient.get<EnrollmentDto>(`/enrollments/${id}`)).data,
    modules: async (id: number) => (await apiClient.get<EnrollmentModuleDto[]>(`/enrollments/${id}/modules`)).data,
    completeModule: async (enrollmentId: number, moduleId: number) =>
      (await apiClient.post<EnrollmentDto>(`/enrollments/${enrollmentId}/modules/${moduleId}/complete`)).data,
    eligibility: async (id: number) => (await apiClient.get<EligibilityDto>(`/enrollments/${id}/eligibility`)).data,
    getQuiz: async (id: number) => (await apiClient.get<LearnerQuizDto>(`/enrollments/${id}/quiz`)).data,
    attemptQuiz: async (id: number, answers: Array<{ questionId: number; selectedOption: string }>) =>
      (await apiClient.post<QuizAttemptResultDto>(`/enrollments/${id}/quiz-attempts`, { answers })).data,
    listQuizAttempts: async (id: number) =>
      (await apiClient.get<QuizAttemptResultDto[]>(`/enrollments/${id}/quiz-attempts`)).data,
    uploadPracticalVideo: async (enrollmentId: number, file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await apiClient.post<PracticalVideoDto>(`/enrollments/${enrollmentId}/practical-videos`, form)).data
    },
    listPracticalVideos: async (enrollmentId: number) =>
      (await apiClient.get<PracticalVideoDto[]>(`/enrollments/${enrollmentId}/practical-videos`)).data,
    fetchPracticalVideoBlob: async (videoId: number) =>
      (await apiClient.get<Blob>(`/practical-videos/${videoId}`, { responseType: 'blob' })).data,
    evaluatePractical: async (enrollmentId: number, body: PracticalEvaluationRequest) =>
      (await apiClient.post<PracticalEvaluationDto>(`/enrollments/${enrollmentId}/practical-evaluation`, body)).data,
    close: async (enrollmentId: number) =>
      (await apiClient.post<EnrollmentDto>(`/enrollments/${enrollmentId}/close`)).data,
    reset: async (enrollmentId: number) =>
      (await apiClient.post<EnrollmentDto>(`/enrollments/${enrollmentId}/reset`)).data,
  },

  practicalSchedules: {
    list: async (params?: PageQueryParams & { status?: string; from?: string; to?: string }) =>
      (await apiClient.get<PagedResult<PracticalScheduleDto>>('/practical-schedules', { params })).data,
    forEnrollment: async (enrollmentId: number) =>
      (await apiClient.get<PracticalScheduleDto[]>(`/enrollments/${enrollmentId}/practical-schedules`)).data,
    create: async (enrollmentId: number, body: PracticalScheduleRequest) =>
      (await apiClient.post<PracticalScheduleDto>(`/enrollments/${enrollmentId}/practical-schedules`, body)).data,
    reschedule: async (id: number, body: PracticalScheduleRequest) =>
      (await apiClient.put<PracticalScheduleDto>(`/practical-schedules/${id}`, body)).data,
    cancel: async (id: number) =>
      (await apiClient.post<PracticalScheduleDto>(`/practical-schedules/${id}/cancel`)).data,
    complete: async (id: number) =>
      (await apiClient.post<PracticalScheduleDto>(`/practical-schedules/${id}/complete`)).data,
  },

  certificates: {
    mine: async () => (await apiClient.get<CertificateDto[]>('/me/certificates')).data,
    get: async (id: number) => (await apiClient.get<CertificateDto>(`/certificates/${id}`)).data,
    mySkills: async () => (await apiClient.get<SkillDto[]>('/me/skills')).data,
  },

  sales: {
    list: async (
      params?: PageQueryParams & { branchId?: number; recipeId?: number; from?: string; to?: string },
    ) => (await apiClient.get<PagedResult<SalesRecordDto>>('/sales', { params })).data,
    sellableDrinks: async (params?: { branchId?: number; tradingDate?: string }) =>
      (await apiClient.get<SellableDrinkDto[]>('/sales/drinks', { params })).data,
    create: async (body: { branchId: number; recipeId: number; tradingDate: string; cupsSold: number }) =>
      (await apiClient.post<SalesRecordDto>('/sales', body)).data,
    correct: async (id: number, cupsSold: number) =>
      (await apiClient.put<SalesRecordDto>(`/sales/${id}`, { cupsSold })).data,
    importPos: async (file: File, idempotencyKey = newIdempotencyKey()) => {
      const form = new FormData()
      form.append('file', file)
      return (
        await apiClient.post<PosImportResultDto>('/sales/import', form, {
          headers: { 'Idempotency-Key': idempotencyKey },
        })
      ).data
    },
    getImportJob: async (jobId: string) =>
      (await apiClient.get<PosImportResultDto>(`/sales/import/${encodeURIComponent(jobId)}`)).data,
    aggregate: async (params: {
      recipeVersionId?: number
      recipeId?: number
      groupBy?: SalesGrouping
      branchId?: number
      from?: string
      to?: string
      controlRecipeId?: number
    }) => (await apiClient.get<SalesAggregateDto>('/sales/aggregate', { params })).data,
  },

  pilots: {
    list: async (params?: PageQueryParams & { state?: string; recipeVersionId?: number }) =>
      (await apiClient.get<PagedResult<PilotDto>>('/pilots', { params })).data,
    get: async (id: number) => (await apiClient.get<PilotDto>(`/pilots/${id}`)).data,
    create: async (body: PilotRequest) => (await apiClient.post<PilotDto>('/pilots', body)).data,
    update: async (id: number, body: PilotRequest) => (await apiClient.put<PilotDto>(`/pilots/${id}`, body)).data,
    readiness: async (id: number) => (await apiClient.get<PilotReadinessDto>(`/pilots/${id}/readiness`)).data,
    start: async (id: number) => (await apiClient.post<PilotDto>(`/pilots/${id}/start`)).data,
    cancel: async (id: number) => (await apiClient.post<PilotDto>(`/pilots/${id}/cancel`)).data,
    goLive: async (pilotId: number, branchId: number) =>
      (await apiClient.post<PilotDto>(`/pilots/${pilotId}/branches/${branchId}/go-live`)).data,
    evaluation: async (id: number) => (await apiClient.get<PilotEvaluation>(`/pilots/${id}/evaluation`)).data,
    decide: async (id: number, decision: LaunchDecisionType, note?: string | null) =>
      (await apiClient.post<PilotDto>(`/pilots/${id}/decision`, { decision, note: note ?? null })).data,
    listBranchLaunchStatus: async (params?: { branchId?: number; recipeId?: number; status?: string }) =>
      (await apiClient.get<BranchLaunchStatusDto[]>('/branch-launch-status', { params })).data,
    withdrawBranchLaunch: async (id: number) =>
      (await apiClient.post<BranchLaunchStatusDto>(`/branch-launch-status/${id}/withdraw`)).data,
  },

  quality: {
    listAudits: async (
      params?: PageQueryParams & {
        branchId?: number
        recipeVersionId?: number
        result?: string
        from?: string
        to?: string
      },
    ) => (await apiClient.get<PagedResult<BranchAuditDto>>('/branch-audits', { params })).data,
    getAudit: async (id: number) => (await apiClient.get<BranchAuditDto>(`/branch-audits/${id}`)).data,
    summary: async (params?: { from?: string; to?: string }) =>
      (await apiClient.get<AuditSummaryDto>('/branch-audits/summary', { params })).data,
    uploadEvidence: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await apiClient.post<EvidenceDto>('/branch-audits/evidence', form)).data
    },
    fetchEvidenceBlob: async (urlOrKey: string) => {
      const path = urlOrKey.includes('branch-audits/evidence/')
        ? stripApiPrefix(urlOrKey)
        : `/branch-audits/evidence/${urlOrKey.replace(/^\/+/, '')}`
      return (await apiClient.get<Blob>(path, { responseType: 'blob' })).data
    },
    createAudit: async (body: BranchAuditRequest) =>
      (await apiClient.post<BranchAuditDto>('/branch-audits', body)).data,
    listCorrectiveActions: async (params?: PageQueryParams & { branchId?: number; status?: string }) =>
      (await apiClient.get<PagedResult<CorrectiveActionDto>>('/corrective-actions', { params })).data,
    getCorrectiveAction: async (id: number) =>
      (await apiClient.get<CorrectiveActionDto>(`/corrective-actions/${id}`)).data,
    startCorrectiveAction: async (id: number) =>
      (await apiClient.post<CorrectiveActionDto>(`/corrective-actions/${id}/start`)).data,
    assignRetraining: async (id: number, courseId: number, deadline?: string | null) =>
      (
        await apiClient.post<AssignmentResultDto>(`/corrective-actions/${id}/assign-retraining`, {
          courseId,
          deadline: deadline ?? null,
        })
      ).data,
    closeCorrectiveAction: async (id: number, note: string) =>
      (await apiClient.post<CorrectiveActionDto>(`/corrective-actions/${id}/close`, { note })).data,
  },

  impact: {
    analyze: async (entityType: ImpactEntityType, entityId: number) =>
      (await apiClient.post<ImpactAnalysisDto>('/impact-analysis', { entityType, entityId })).data,
    get: async (runId: string) =>
      (await apiClient.get<ImpactAnalysisDto>(`/impact-analysis/${encodeURIComponent(runId)}`)).data,
    commit: async (runId: string) =>
      (await apiClient.post<ImpactAnalysisDto>(`/impact-analysis/${encodeURIComponent(runId)}/commit`)).data,
  },

  dashboards: {
    employees: async (params?: { branchId?: number }) =>
      (await apiClient.get<EmployeeSkillSummaryDto[]>('/dashboards/employees', { params })).data,
    trainingProgress: async (params?: { branchId?: number; courseId?: number }) =>
      (await apiClient.get<TrainingProgressRowDto[]>('/dashboards/training-progress', { params })).data,
    branchPerformance: async (params?: { branchId?: number; recipeId?: number; from?: string; to?: string }) =>
      (await apiClient.get<BranchPerformanceDto>('/dashboards/branch-performance', { params })).data,
    courseEffectiveness: async (params?: { courseId?: number }) =>
      (await apiClient.get<CourseEffectivenessDto[]>('/dashboards/course-effectiveness', { params })).data,
  },

  audit: {
    listLogs: async (
      params?: PageQueryParams & {
        entityType?: string
        entityId?: number
        action?: string
        userId?: number
        branchId?: number
        from?: string
        to?: string
      },
    ) => (await apiClient.get<PagedResult<AuditEntryDto>>('/audit-log', { params })).data,
    trace: async (entityType: string, entityId: number) =>
      (await apiClient.get<VersionTraceDto>(`/audit-log/trace/${encodeURIComponent(entityType)}/${entityId}`)).data,
    downloadComplianceReport: async (params: {
      format: 'csv' | 'xlsx'
      from?: string
      to?: string
      branchId?: number
      courseId?: number
      recipeVersionId?: number
    }) => {
      const response = await apiClient.get<Blob>('/reports/compliance', {
        params,
        responseType: 'blob',
      })
      const ext = params.format === 'xlsx' ? 'xlsx' : 'csv'
      downloadBlob(response.data, `compliance-report-${new Date().toISOString().slice(0, 10)}.${ext}`)
    },
  },

  intelligence: {
    models: async () => (await apiClient.get<AiModelInfoDto[]>('/intelligence/models')).data,
    analyzeSensory: async (body: SensoryAnalyzeRequest) =>
      (await apiClient.post<SensoryProfileDto>('/intelligence/sensory/analyze', body)).data,
    financeOverview: async (params?: { branchId?: number | null; days?: number }) =>
      (
        await apiClient.get<FinanceOverviewDto>('/intelligence/finance/overview', {
          params: {
            branchId: params?.branchId ?? undefined,
            days: params?.days ?? undefined,
          },
        })
      ).data,
    unitEconomics: async () =>
      (await apiClient.get<RecipeUnitEconomicsDto[]>('/intelligence/finance/unit-economics')).data,
    optimizeFinance: async (body: FinanceOptimizeRequest) =>
      (await apiClient.post<FinanceOptimizationResultDto>('/intelligence/finance/optimize', body)).data,
  },
}

