import type { Role } from '@/features/auth/authTypes'

export interface PagedResult<T> {
  items: T[]
  page: number
  size: number
  total: number
}

export interface PageQueryParams {
  page?: number
  size?: number
  sort?: string
}

// ---------------- Master Data & Users ----------------
export type UserStatus = 'ACTIVE' | 'INACTIVE'
export type BranchStatus = 'ACTIVE' | 'CLOSED'
export type CatalogStatus = 'ACTIVE' | 'INACTIVE'
export type CategoryKind = 'DRINK' | 'INGREDIENT' | 'TRAINING' | 'EQUIPMENT'
export type IngredientUnit = 'g' | 'ml' | 'pcs'
export type DosingUnit = 'g' | 'ml' | 'sec' | 'degC' | 'bar'

export interface UserDto {
  id: number
  username: string
  email: string
  fullName: string
  role: Role
  branchId: number | null
  status: UserStatus
  createdAt: string
}

export interface UserDirectoryItemDto {
  id: number
  username: string
  fullName: string
  role: Role
  branchId: number | null
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  fullName: string
  role: Role
  branchId?: number | null
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  password?: string
  fullName?: string
  role?: Role
  branchId?: number | null
  status?: UserStatus
}

export interface BranchDto {
  id: number
  branchCode: string
  name: string
  address: string | null
  status: BranchStatus
}

export interface BranchRequest {
  branchCode: string
  name: string
  address?: string | null
  status?: BranchStatus
}

export interface CategoryDto {
  id: number
  kind: CategoryKind
  code: string
  name: string
  status: CatalogStatus
}

export interface CategoryRequest {
  kind: CategoryKind
  code: string
  name: string
  status?: CatalogStatus
}

export interface IngredientDto {
  id: number
  ingredientCode: string
  name: string
  unit: IngredientUnit
  shelfLifeHours: number
  storageRule: string | null
  status: CatalogStatus
}

export interface IngredientRequest {
  ingredientCode: string
  name: string
  unit: IngredientUnit
  shelfLifeHours: number
  storageRule?: string | null
  status?: CatalogStatus
}

export interface EquipmentClassDto {
  id: number
  equipmentCode: string
  equipmentClass: string
  minThreshold: number
  maxThreshold: number
  dosingUnit: DosingUnit
  status: CatalogStatus
}

export interface EquipmentClassRequest {
  equipmentCode: string
  equipmentClass: string
  minThreshold: number
  maxThreshold: number
  dosingUnit: DosingUnit
  status?: CatalogStatus
}

export interface ProductDto {
  id: number
  productCode: string
  name: string
  categoryId: number | null
  categoryName: string | null
  recipeId: number | null
  recipeCode: string | null
  currentVersionId: number | null
  currentVersionNo: number | null
  description: string | null
  imageUrl: string | null
  status: CatalogStatus
}

export interface ProductRequest {
  productCode: string
  name: string
  categoryId?: number | null
  recipeId?: number | null
  description?: string | null
  imageUrl?: string | null
  status?: CatalogStatus
}

export interface SettingDto {
  key: string
  value: string
  updatedAt: string
  updatedBy: number | null
}

// ---------------- Notifications ----------------
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED'

export interface MyNotificationDto {
  id: number
  subject: string
  message: string
  emailStatus: DeliveryStatus
  pushStatus: DeliveryStatus
  createdAt: string
  processedAt: string | null
}

export interface PushConfigDto {
  enabled: boolean
  publicKey: string | null
}

export interface PushSubscriptionDto {
  id: number
  endpoint: string
  createdAt: string
}

// ---------------- Recipes & Versions ----------------
export type RecipeCategory = 'TEA' | 'COFFEE' | 'OTHER'
export type RecipeOrigin = 'NEW' | 'EXISTING'
export type RecipeStatus = 'ACTIVE' | 'DISCONTINUED'
export type VersionState = 'DRAFT' | 'VALIDATED' | 'REJECTED' | 'RELEASED' | 'SUPERSEDED'
export type DependencyType = 'FINISH_TO_START' | 'REQUIRES_OUTPUT'
export type CheckType = 'EQUIPMENT' | 'ORDERING' | 'INGREDIENT'
export type RepairMode = 'AI' | 'MANUAL'
export type ReviewAction = 'ACCEPT' | 'EDIT' | 'REJECT'
export type ReviewOutcome = 'ACCEPTED' | 'EDITED' | 'REJECTED'

export interface RecipeDto {
  id: number
  recipeCode: string
  name: string
  category: RecipeCategory
  origin: RecipeOrigin
  status: RecipeStatus
  createdBy: number
  createdAt: string
  releasedVersionId: number | null
  releasedVersionNo: number | null
  versionCount: number
}

export interface CreateRecipeRequest {
  recipeCode: string
  name: string
  category: RecipeCategory
  origin: RecipeOrigin
}

export interface UpdateRecipeRequest {
  name: string
  category: RecipeCategory
}

export interface RecipeVersionSummaryDto {
  id: number
  recipeId: number
  versionNo: number
  state: VersionState
  isImmutable: boolean
  createdBy: number
  approvedBy: number | null
  releasedAt: string | null
  supersededAt: string | null
  stepCount: number
  lastValidationPassed: boolean | null
  lastValidatedAt: string | null
}

export interface StepIngredientDto {
  ingredientId: number
  ingredientCode: string | null
  ingredientName: string | null
  quantity: number
  unit: string
}

export interface StepDependencyDto {
  stepId: number
  stepOrder: number
  type: DependencyType
}

export interface StepDto {
  id: number
  stepOrder: number
  actionText: string
  equipmentClass: string | null
  techniqueGate: string | null
  durationSeconds: number | null
  ingredients: StepIngredientDto[]
  dependsOn: StepDependencyDto[]
}

export interface RecipeVersionDto {
  id: number
  recipeId: number
  versionNo: number
  state: VersionState
  isImmutable: boolean
  contentHash: string | null
  createdBy: number
  approvedBy: number | null
  releasedAt: string | null
  supersededAt: string | null
  steps: StepDto[]
}

export interface StepIngredientRequest {
  ingredientId?: number | null
  ingredientCode?: string | null
  quantity: number
  unit: string
}

export interface StepDependencyRequest {
  stepOrder?: number | null
  stepId?: number | null
  type: DependencyType
}

export interface StepRequest {
  stepOrder: number
  actionText: string
  equipmentClass?: string | null
  techniqueGate?: string | null
  durationSeconds?: number | null
  ingredients?: StepIngredientRequest[]
  dependsOn?: StepDependencyRequest[]
}

export interface RecipeContentRequest {
  steps: StepRequest[]
}

export interface ViolationDto {
  stepId: number | null
  stepOrder: number | null
  rule: string
  code: string | null
  message: string
  expected: string
  actual: string
}

export interface CheckDto {
  checkType: CheckType
  passed: boolean
  violations: ViolationDto[]
}

export interface ValidationResultDto {
  versionId: number
  passed: boolean
  runAt: string
  checks: CheckDto[]
}

export interface DraftResultDto {
  version: RecipeVersionDto
  validation: ValidationResultDto
  notes: string | null
  servingSizeMl: number | null
  aiRepairsUsed: number
  aiRepairsLeft: number
}

export interface StepDecisionRequest {
  stepId: number
  action: ReviewAction
  editedText?: string | null
}

export interface ReviewResultDto {
  outcome: ReviewOutcome
  version: RecipeVersionDto
}

export interface ReleaseResultDto {
  version: RecipeVersionDto
  supersededVersionId: number | null
  replayed: boolean
}

export interface ImportExistingRecipeRequest {
  recipeCode: string
  name: string
  category: RecipeCategory
  steps: StepRequest[]
}

export interface ImportedRecipeDto {
  recipe: RecipeDto
  version: RecipeVersionDto
  validation: ValidationResultDto
}

// ---------------- Courses & Quiz Authoring ----------------
export type CourseType = 'INDUCTION' | 'PRODUCT' | 'EQUIPMENT' | 'RECERTIFICATION'
export type CourseState = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'OUT_OF_DATE' | 'ARCHIVED'
export type ModuleType =
  | 'PRODUCT_OVERVIEW'
  | 'INGREDIENTS'
  | 'EQUIPMENT'
  | 'SOP'
  | 'TECHNIQUE'
  | 'COMMON_MISTAKES'
  | 'EXCEPTION_HANDLING'
export type ModuleSource = 'GENERATED' | 'AUTHORED' | 'MIXED'
export type ModuleState = 'EMPTY' | 'DRAFT' | 'COMPLETE' | 'NEEDS_REVIEW'
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'

export interface CourseDto {
  id: number
  recipeVersionId: number | null
  courseType: CourseType
  title: string
  totalDurationMin: number | null
  createdBy: number
  approvedBy: number | null
  state: CourseState
  publishedAt: string | null
  recipeId: number | null
  recipeCode: string | null
  recipeName: string | null
  versionNo: number | null
}

export interface LessonDto {
  id: number
  lessonOrder: number
  title: string
  recipeStepId: number | null
  content: string | null
  mediaUrl: string | null
  generated: boolean
  reference: Record<string, unknown> | null
}

export interface CourseModuleDto {
  id: number
  courseId: number
  moduleType: ModuleType
  moduleOrder: number
  source: ModuleSource
  durationMinutes: number | null
  state: ModuleState
  lessons: LessonDto[]
}

export interface QuizDto {
  id: number
  courseId: number
  title: string
  passScore: number
  questionCount: number
}

export interface QuizOption {
  key: string
  text: string
}

export interface QuizQuestionDto {
  id: number
  courseModuleId: number
  moduleType: ModuleType
  questionText: string
  options: QuizOption[]
  correctOption: string
}

export interface ChecklistItemDto {
  lessonId: number
  recipeStepId: number | null
  stepOrder: number
  actionText: string
  techniqueGate: string | null
}

export interface CourseDetailDto extends CourseDto {
  modules: CourseModuleDto[]
  quiz: QuizDto
  practicalChecklist: ChecklistItemDto[]
}

export interface CreateCourseRequest {
  recipeVersionId?: number | null
  courseType: CourseType
  title: string
}

export interface LessonRequest {
  title?: string | null
  content?: string | null
  mediaUrl?: string | null
}

export interface QuizQuestionRequest {
  courseModuleId: number
  questionText: string
  options: QuizOption[]
  correctOption: string
}

export interface QuestionBankDto {
  id: number
  questionType: QuestionType
  questionText: string
  options: QuizOption[]
  correctOptions: string[]
  courseId: number | null
  moduleType: ModuleType | null
  createdBy: number
  createdAt: string
}

export interface QuestionBankRequest {
  questionType: QuestionType
  questionText: string
  options?: QuizOption[]
  correctOptions: string[]
  courseId?: number | null
  moduleType?: ModuleType | null
}

// ---------------- Regulations, Classes, Assignments & Learning ----------------
export type ClassState = 'PLANNED' | 'RUNNING' | 'CLOSED' | 'CANCELLED'
export type EnrollmentState = 'ASSIGNED' | 'IN_PROGRESS' | 'ELIGIBLE' | 'PASSED' | 'LOCKED' | 'CLOSED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED'
export type AssignmentStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'THEORY_COMPLETED'
  | 'QUIZ_PASSED'
  | 'PRACTICAL_PENDING'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'LOCKED'
  | 'CLOSED'
export type ScheduleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
export type CertificateStatus = 'VALID' | 'NEEDS_RECERT' | 'SUPERSEDED'
export type SkillStatus = 'CERTIFIED' | 'NEEDS_RECERT' | 'TRAINING' | 'NOT_CERTIFIED'

export interface TrainingRegulationDto {
  id: number
  courseType: CourseType
  mandatoryForRole: Role | null
  prerequisiteType: CourseType | null
  dueDays: number
  maxRetakes: number
  minAttendancePct: number
  effectiveFrom: string
}

export interface TrainingRegulationRequest {
  courseType: CourseType
  mandatoryForRole?: Role | null
  prerequisiteType?: CourseType | null
  dueDays: number
  maxRetakes: number
  minAttendancePct: number
  effectiveFrom: string
}

export interface TrainingNeedDto {
  userId: number
  username: string
  fullName: string
  branchId: number | null
  courseId: number
  courseTitle: string
  courseType: CourseType
  reason: string
  regulationId: number | null
  dueDays: number
  prerequisiteType: CourseType | null
  enrollmentState: EnrollmentState | null
}

export interface TrainingSessionDto {
  id: number
  trainingClassId: number
  sessionNo: number
  scheduledDate: string
  startTime: string
  durationMinutes: number
  location: string | null
  trainerId: number
  moduleIds: number[]
}

export interface TrainingClassDto {
  id: number
  courseId: number
  branchId: number
  name: string
  startDate: string
  endDate: string
  openedBy: number
  state: ClassState
  enrolledCount: number
  sessions: TrainingSessionDto[]
}

export interface TrainingClassRequest {
  courseId: number
  branchId: number
  name: string
  startDate: string
  endDate: string
}

export interface SessionRequest {
  sessionNo?: number | null
  scheduledDate: string
  startTime: string
  durationMinutes: number
  location?: string | null
  trainerId: number
  moduleIds: number[]
}

export interface OpenClassResultDto {
  class: TrainingClassDto
  enrollmentIds: number[]
  skippedUserIds: number[]
}

export interface AttendanceEntryDto {
  enrollmentId: number
  userId: number
  fullName: string
  status: AttendanceStatus | null
  note: string | null
  recordedAt: string | null
  attendanceStillReachable: boolean
}

export interface AttendanceSheetDto {
  sessionId: number
  trainingClassId: number
  classState: ClassState
  entries: AttendanceEntryDto[]
}

export interface AttendanceEntryRequest {
  enrollmentId: number
  status: AttendanceStatus
  note?: string | null
}

export interface AssignmentRequest {
  courseId: number
  branchId?: number | null
  employeeIds?: number[]
  allTrainees?: boolean
  deadline?: string | null
  reason?: string | null
}

export interface AssignmentResultDto {
  courseId: number
  enrollmentIds: number[]
  alreadyEnrolled: number[]
}

export interface AssignmentDto {
  enrollmentId: number
  userId: number
  fullName: string | null
  branchId: number | null
  branchCode: string | null
  courseId: number
  courseTitle: string
  dueDate: string | null
  progressPercent: number
  status: AssignmentStatus
  enrollmentState: EnrollmentState
}

export interface EnrollmentDto {
  id: number
  courseId: number
  courseTitle: string
  courseType: CourseType
  recipeVersionId: number | null
  trainingClassId: number | null
  userId: number
  dueDate: string | null
  progressPercent: number
  state: EnrollmentState
  enrolledAt: string
  completedAt: string | null
  overdue: boolean
}

export interface EnrollmentModuleDto {
  module: CourseModuleDto
  completed: boolean
  completedAt: string | null
}

export interface MissingModuleDto {
  courseModuleId: number
  moduleType: ModuleType
}

export interface EligibilityDto {
  eligible: boolean
  missingModules: MissingModuleDto[]
  attendancePct: number
  minAttendancePct: number
  attendanceStillReachable: boolean
  retakesLeft: number
  regulationId: number | null
  state: EnrollmentState
}

export interface LearnerQuestionDto {
  id: number
  courseModuleId: number
  moduleType: ModuleType
  questionText: string
  options: QuizOption[]
}

export interface LearnerQuizDto {
  quizId: number
  title: string
  passScore: number
  retakesLeft: number
  questions: LearnerQuestionDto[]
}

export interface ModuleScoreDto {
  moduleType: ModuleType
  correct: number
  total: number
}

export interface QuizAttemptResultDto {
  attemptNo: number
  score: number
  passed: boolean
  passScore: number
  retakesLeft: number
  enrollmentState: EnrollmentState
  perModule: ModuleScoreDto[]
  attemptedAt: string
  certificateId: number | null
}

export interface PracticalScheduleDto {
  id: number
  enrollmentId: number
  courseId: number
  courseTitle: string | null
  userId: number
  traineeName: string | null
  trainerId: number
  trainerName: string | null
  scheduledAt: string
  location: string
  note: string | null
  status: ScheduleStatus
}

export interface PracticalScheduleRequest {
  scheduledAt: string
  location: string
  note?: string | null
}

export interface PracticalVideoDto {
  id: number
  enrollmentId: number
  uploadedBy: number
  fileName: string
  contentType: string
  sizeBytes: number
  sha256: string
  uploadedAt: string
  evaluationId: number | null
}

export interface ChecklistMarkRequest {
  recipeStepId?: number | null
  lessonId?: number | null
  passed: boolean
  note?: string | null
}

export interface PracticalEvaluationRequest {
  practicalVideoId: number
  items: ChecklistMarkRequest[]
}

export interface ChecklistMark {
  recipeStepId: number | null
  passed: boolean
  note: string | null
  lessonId: number | null
}

export interface PracticalEvaluationDto {
  id: number
  enrollmentId: number
  evaluatedBy: number
  passed: boolean
  evaluatedAt: string
  items: ChecklistMark[]
  practicalVideoId: number | null
  enrollmentState: EnrollmentState
  certificateId: number | null
}

export interface CertificateDto {
  id: number
  userId: number
  fullName: string
  branchId: number | null
  courseId: number
  courseTitle: string
  recipeVersionId: number | null
  recipeCode: string | null
  recipeName: string | null
  versionNo: number | null
  issuedAt: string
  status: CertificateStatus
  supersededBy: number | null
}

export interface SkillDto {
  courseId: number
  courseTitle: string
  recipeVersionId: number | null
  status: SkillStatus
  certificateId: number | null
  issuedAt: string | null
}

export interface EmployeeSkillSummaryDto {
  userId: number
  fullName: string
  branchId: number | null
  branchCode: string | null
  certifiedSkills: number
  requiredSkills: number
  inTraining: number
  overdue: number
  status: string
}

// ---------------- Sales & POS Import ----------------
export type SalesSource = 'MANUAL' | 'POS_IMPORT'
export type SalesGrouping = 'BRANCH' | 'DAY' | 'WEEK'

export interface SalesRecordDto {
  id: number
  branchId: number
  branchCode: string | null
  recipeId: number
  recipeCode: string | null
  recipeName: string | null
  recipeVersionId: number | null
  versionNo: number | null
  tradingDate: string
  cupsSold: number
  source: SalesSource
  recordedBy: number
  recordedAt: string
}

export interface SellableDrinkDto {
  recipeId: number
  recipeCode: string
  name: string
  category: RecipeCategory
  recipeVersionId: number
  versionNo: number | null
  coverageMet: boolean
}

export interface PosRowError {
  row: number
  code: string
  message: string
}

export interface PosImportResultDto {
  jobId: string
  fileName: string
  accepted: number
  rejected: number
  replaced: number
  errors: PosRowError[]
  importedAt: string
  replayed: boolean
}

export interface SalesGroupDto {
  key: string
  branchId: number | null
  branchCode: string | null
  from: string
  to: string
  cups: number
  tradingDays: number
  cupsPerDay: number
  changePct: number | null
  controlCups: number | null
  percentOfControl: number | null
}

export interface SalesAggregateDto {
  recipeId: number
  recipeCode: string
  recipeName: string
  recipeVersionId: number | null
  groupBy: SalesGrouping
  from: string | null
  to: string | null
  totalCups: number
  tradingDays: number
  cupsPerDay: number
  controlRecipeId: number | null
  controlRecipeCode: string | null
  controlCups: number | null
  percentOfControl: number | null
  groups: SalesGroupDto[]
}

// ---------------- Pilots & Launches ----------------
export type LaunchStatus = 'PREPARING' | 'READY' | 'LIVE' | 'WITHDRAWN'
export type CriterionType = 'ABSOLUTE' | 'RELATIVE' | 'RETENTION'
export type Verdict = 'PASS' | 'FAIL' | 'INCOMPLETE'
export type PilotState = 'DRAFT' | 'RUNNING' | 'ENDED' | 'CANCELLED'
export type PilotBranchState = 'PREPARING' | 'READY' | 'LIVE'
export type LaunchDecisionType = 'ROLLOUT' | 'REVISE' | 'DISCONTINUE'

export interface PilotCriterion {
  type: CriterionType
  cupsPerDayPerBranch?: number | null
  controlRecipeId?: number | null
  minPercentOfControl?: number | null
  maxDropSecondHalfPct?: number | null
}

export interface PilotRequest {
  recipeVersionId: number
  name: string
  startDate: string
  endDate: string
  minCertifiedStaff: number
  branchIds: number[]
  criteria: PilotCriterion[]
}

export interface PilotBranchDto {
  branchId: number
  branchCode: string | null
  branchName: string | null
  readinessState: PilotBranchState
  wentLiveAt: string | null
}

export interface LaunchDecisionDto {
  decision: LaunchDecisionType
  decidedBy: number
  decidedAt: string
  evaluated: unknown
}

export interface PilotDto {
  id: number
  recipeVersionId: number
  recipeId: number
  recipeCode: string
  recipeName: string
  versionNo: number
  name: string
  startDate: string
  endDate: string
  minCertifiedStaff: number
  state: PilotState
  createdBy: number
  criteria: PilotCriterion[]
  branches: PilotBranchDto[]
  decision: LaunchDecisionDto | null
}

export interface BranchReadinessDto {
  branchId: number
  branchCode: string | null
  readinessState: PilotBranchState
  certifiedCount: number
  minCertifiedStaff: number
  coverageMet: boolean
  launchStatus: LaunchStatus | null
  liveVersionId: number | null
  wentLiveAt: string | null
}

export interface PilotReadinessDto {
  pilotId: number
  state: PilotState
  recipeVersionId: number
  minCertifiedStaff: number
  branches: BranchReadinessDto[]
}

export interface CriterionResult {
  type: CriterionType
  target: number
  actual: number | null
  verdict: Verdict
}

export interface BranchEvaluationResult {
  branchId: number
  expectedDays: number
  tradingDays: number
  cupsTotal: number
  cupsPerDay: number
  coverageComplete: boolean
  verdict: Verdict
  criteria: CriterionResult[]
}

export interface WeekEvaluationResult {
  week: number
  from: string
  to: string
  cups: number
}

export interface PilotEvaluation {
  pilotId: number
  state: PilotState
  from: string
  to: string
  coverageComplete: boolean
  overall: Verdict
  criteria: CriterionResult[]
  byBranch: BranchEvaluationResult[]
  byWeek: WeekEvaluationResult[]
}

export interface BranchLaunchStatusDto {
  id: number
  branchId: number
  branchCode: string | null
  branchName: string | null
  recipeId: number
  recipeCode: string | null
  recipeName: string | null
  origin: RecipeOrigin | null
  recipeVersionId: number | null
  versionNo: number | null
  status: LaunchStatus
  minCertifiedStaff: number
  certifiedCount: number
  coverageMet: boolean
  shortfall: number
  liveSince: string | null
}

// ---------------- Quality Audits & Corrective Actions ----------------
export type AuditResult = 'PASSED' | 'FAILED'
export type CorrectiveActionStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED'

export interface AuditItemDto {
  id: number
  criterion: string
  expected: string | null
  actual: string | null
  passed: boolean
  critical: boolean
  comment: string | null
  evidenceUrl: string | null
}

export interface BranchAuditDto {
  id: number
  branchId: number
  branchCode: string | null
  branchName: string | null
  recipeVersionId: number
  recipeId: number
  recipeCode: string | null
  recipeName: string | null
  versionNo: number
  auditorId: number
  auditorName: string | null
  auditedAt: string
  score: number
  result: AuditResult
  comment: string | null
  items: AuditItemDto[]
  correctiveActionId: number | null
}

export interface AuditItemRequest {
  criterion: string
  expected?: string | null
  actual?: string | null
  passed: boolean
  critical: boolean
  comment?: string | null
  evidenceUrl?: string | null
}

export interface BranchAuditRequest {
  branchId: number
  recipeVersionId: number
  comment?: string | null
  items: AuditItemRequest[]
  retrainingRequired?: boolean
  employeeIds?: number[]
  dueDate?: string | null
}

export interface BranchComplianceDto {
  branchId: number
  branchCode: string | null
  branchName: string | null
  audits: number
  averageScore: number
}

export interface AuditSummaryDto {
  from: string
  to: string
  audits: number
  passed: number
  failed: number
  openCorrectiveActions: number
  lowestCompliance: BranchComplianceDto | null
  branches: BranchComplianceDto[]
}

export interface EvidenceDto {
  key: string
  url: string
  sizeBytes: number
}

export interface CorrectiveActionDto {
  id: number
  branchAuditId: number
  branchId: number
  branchCode: string | null
  description: string
  retrainingRequired: boolean
  employeeIds: number[]
  status: CorrectiveActionStatus
  dueDate: string | null
  createdAt: string
  closedAt: string | null
  closedBy: number | null
  closureNote: string | null
}

// ---------------- Impact, Dashboards, Audit & Trace ----------------
export type ImpactType = 'OUT_OF_DATE' | 'NEEDS_RECERT' | 'BRANCH_AFFECTED'
export type ImpactEntityType = 'Ingredient' | 'StandardEquipment' | 'RecipeVersion'

export interface AffectedCourseDto {
  id: number
  impact: ImpactType
  title: string | null
  recipeVersionId: number | null
  state: CourseState | null
}

export interface AffectedCertificateDto {
  id: number
  impact: ImpactType
  userId: number | null
  fullName: string | null
  branchId: number | null
  recipeVersionId: number | null
  status: CertificateStatus | null
}

export interface AffectedBranchDto {
  branchId: number
  recipeId: number
  impact: ImpactType
  branchCode: string | null
  recipeVersionId: number | null
}

export interface ImpactAnalysisDto {
  runId: string
  trigger: { entityType: string; entityId: number }
  affected: {
    recipeVersions: number[]
    courses: AffectedCourseDto[]
    certificates: AffectedCertificateDto[]
    liveBranches: AffectedBranchDto[]
  }
  committed: boolean
  warning: { code: string; message: string } | null
}

export interface TrainingProgressRowDto {
  branchId: number | null
  branchCode: string | null
  courseId: number
  courseTitle: string
  recipeVersionId: number | null
  assigned: number
  inProgress: number
  eligible: number
  passed: number
  locked: number
  overdue: number
  certifiedValid: number
  needsRecertification: number
}

export interface BranchPerformanceRowDto {
  branchId: number
  branchCode: string | null
  branchName: string | null
  recipeId: number
  recipeCode: string | null
  recipeName: string | null
  recipeVersionId: number | null
  versionNo: number | null
  status: LaunchStatus
  liveSince: string | null
  minCertifiedStaff: number
  certifiedCount: number
  coverageMet: boolean
  cupsTotal: number
  tradingDays: number
  cupsPerDay: number
  lastTradingDate: string | null
}

export interface BranchPerformanceDto {
  from: string
  to: string
  rows: BranchPerformanceRowDto[]
}

export interface ModuleEffectiveness {
  courseModuleId: number
  moduleType: ModuleType
  firstAttempts: number
  passed: number
  passRatePct: number | null
  highlighted: boolean
}

export interface CourseSalesBranchDto {
  branchId: number
  branchCode: string | null
  certifiedStaff: number
  cups: number
  tradingDays: number
  cupsPerDay: number
}

export interface CourseEffectivenessDto {
  courseId: number
  courseTitle: string
  courseType: CourseType
  state: CourseState
  recipeVersionId: number | null
  enrollments: number
  passed: number
  locked: number
  firstAttempts: number
  firstAttemptPassRatePct: number | null
  retakeAttempts: number
  learnersWhoRetook: number
  attendanceRatePct: number | null
  avgDaysToCertification: number | null
  onTimeCompletionRatePct: number | null
  modules: ModuleEffectiveness[]
  cupsSold: number
  salesByBranch: CourseSalesBranchDto[]
}

export interface AuditEntryDto {
  id: number
  userId: number | null
  username: string | null
  entityType: string
  entityId: number
  action: string
  payload: unknown
  createdAt: string
}

export interface PersonDto {
  id: number
  username: string
  fullName: string
  role: Role
}

export interface VersionTraceDto {
  entityType: string
  entityId: number
  version: {
    id: number
    recipeId: number
    recipeCode: string
    recipeName: string
    origin: RecipeOrigin
    versionNo: number
    state: VersionState
    contentHash: string | null
    author: PersonDto | null
    approver: PersonDto | null
    releasedAt: string | null
    supersededAt: string | null
  }
  validation: Array<{
    checkType: CheckType
    passed: boolean
    violations: number
    runAt: string
  }>
  aiDrafts: Array<{
    id: number
    modelName: string
    schemaValid: boolean
    createdAt: string
    promptText: string
  }>
  courses: Array<{
    id: number
    title: string
    courseType: CourseType
    state: CourseState
    createdBy: PersonDto | null
    approvedBy: PersonDto | null
    publishedAt: string | null
  }>
  certifiedStaff: Array<{
    id: number
    userId: number
    username: string | null
    fullName: string | null
    branchId: number | null
    branchCode: string | null
    courseId: number
    status: CertificateStatus
    issuedAt: string
  }>
  branches: Array<{
    branchId: number
    branchCode: string | null
    status: LaunchStatus
    liveSince: string | null
    certifiedCount: number
    coverageMet: boolean
  }>
  cupsSold: number
  events: AuditEntryDto[]
}

// ---------------- AI Intelligence, Sensory Twin & Financial Optimization ----------------

export interface AiModelMetricDto {
  headName: string
  trainR2: number
  testR2: number
  testRmse: number
  testMapePct: number
  featureImportance: Record<string, number>
}

export interface AiModelInfoDto {
  modelId: string
  name: string
  role: string
  algorithm: string
  version: string
  trainingScriptPath: string
  artifactPath: string
  trainingSamples: number
  testSamples: number
  trainedAt: string
  metrics: AiModelMetricDto[]
  capabilities: string[]
}

export interface SensoryAnalyzeRequest {
  recipeId?: number | null
  recipeVersionId?: number | null
  waterTempC?: number | null
  extractionSeconds?: number | null
  iceRatioPct?: number | null
  sugarLevelPct?: number | null
  milkSteamTempC?: number | null
}

export interface SensoryAxesDto {
  aroma: number
  body: number
  sweetness: number
  bitterness: number
  creaminess: number
  refreshment: number
  foamStability: number
  overallHarmony: number
}

export interface BeveragePhysicsDto {
  servingVolumeMl: number
  servingTempC: number
  brixLevel: number
  caffeineMg: number
  caloriesKcal: number
  dilutionPct: number
  activePrepSeconds: number
  shelfLifeWindowMinutes: number
}

export interface SensoryDiagnosticDto {
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK'
  code: string
  parameter: string
  message: string
  recommendation: string
}

export interface SensoryProfileDto {
  modelName: string
  recipeId: number
  recipeCode: string
  recipeName: string
  category: RecipeCategory
  recipeVersionId: number | null
  versionNo: number | null
  axes: SensoryAxesDto
  physics: BeveragePhysicsDto
  estimatedCogsVnd: number
  recommendedPriceVnd: number
  grossMarginPct: number
  diagnostics: SensoryDiagnosticDto[]
  optimizationHints: string[]
}

export interface CashflowPointDto {
  date: string
  isForecast: boolean
  cupsSold: number
  cashInflowVnd: number
  cogsOutflowVnd: number
  wasteOutflowVnd: number
  operatingOutflowVnd: number
  netCashflowVnd: number
  cumulativeCashflowVnd: number
}

export interface BranchFinanceBreakdownDto {
  branchId: number
  branchCode: string
  branchName: string
  totalCupsSold: number
  grossRevenueVnd: number
  totalCogsVnd: number
  wasteCostVnd: number
  laborCostVnd: number
  fixedOverheadVnd: number
  netCashflowVnd: number
  grossMarginPct: number
  certifiedStaffPct: number
  predictedSpoilagePct: number
}

export interface FinanceOverviewDto {
  modelName: string
  modelTrainedAt: string
  modelCashflowR2: number
  historicalDays: number
  forecastDays: number
  totalCupsSold: number
  grossRevenueVnd: number
  totalCogsVnd: number
  spoilageWasteCostVnd: number
  directLaborCostVnd: number
  fixedOverheadVnd: number
  grossProfitVnd: number
  netCashflowVnd: number
  grossMarginPct: number
  spoilageRatePct: number
  cashflowHealthScore: number
  breakEvenDailyCups: number
  forecast30DayInflowVnd: number
  forecast30DayNetCashflowVnd: number
  timeline: CashflowPointDto[]
  branches: BranchFinanceBreakdownDto[]
}

export interface BomIngredientCostDto {
  ingredientCode: string
  name: string
  quantity: number
  unit: string
  unitCostVnd: number
  lineCostVnd: number
  shelfLifeHours: number
  spoilageRisk: string
}

export interface RecipeUnitEconomicsDto {
  recipeId: number
  recipeCode: string
  name: string
  category: RecipeCategory
  releasedVersionId: number | null
  releasedVersionNo: number | null
  ingredientCostVnd: number
  packagingCostVnd: number
  laborCostVnd: number
  utilityCostVnd: number
  estimatedWasteAllowanceVnd: number
  unitCogsVnd: number
  currentPriceVnd: number
  optimalPriceVnd: number
  grossProfitPerCupVnd: number
  grossMarginPct: number
  activePrepSeconds: number
  minShelfLifeHours: number
  recent30DayCupsSold: number
  monthlyContributionProfitVnd: number
  menuQuadrant: 'STAR' | 'PLOWHORSE' | 'PUZZLE' | 'DOG'
  recommendedDailyBatches: number
  bomBreakdown: BomIngredientCostDto[]
}

export interface FinanceOptimizeRequest {
  branchId?: number | null
  priceChangePct: number
  wasteReductionTargetPct: number
  batchPrepFrequency: number
  marketingDemandLiftPct: number
  targetMarginPct?: number
}

export interface BatchPrepScheduleItemDto {
  ingredientCode: string
  ingredientName: string
  shelfLifeHours: number
  spoilageRisk: string
  recommendedBatchesPerDay: number
  prepCadence: string
  estimatedMonthlySavingsVnd: number
}

export interface OptimizationActionDto {
  priority: string
  category: string
  title: string
  impactDescription: string
  estimatedMonthlyGainVnd: number
}

export interface OptimizedTimelinePointDto {
  date: string
  baselineNetCashflowVnd: number
  optimizedNetCashflowVnd: number
  baselineCumulativeVnd: number
  optimizedCumulativeVnd: number
}

export interface FinanceOptimizationResultDto {
  modelName: string
  confidenceR2: number
  baseline30DayRevenueVnd: number
  optimized30DayRevenueVnd: number
  baseline30DayCogsAndWasteVnd: number
  optimized30DayCogsAndWasteVnd: number
  baseline30DayNetCashflowVnd: number
  optimized30DayNetCashflowVnd: number
  netCashflowGain30DayVnd: number
  cashflowImprovementPct: number
  baselineSpoilagePct: number
  optimizedSpoilagePct: number
  expectedDemandChangePct: number
  forecastComparison: OptimizedTimelinePointDto[]
  batchPrepPlan: BatchPrepScheduleItemDto[]
  recommendations: OptimizationActionDto[]
}


