// Generated from checked-in BrewForge C# controller/DTO source. Run npm run contracts:generate.
// Dates/times are wire strings; IDs are JSON numbers, never strings in requests.

export interface PagedResult<T> { items: T[]; page: number; size: number; total: number }

/** backend/src/BrewForge.Application/Impact/ImpactAnalysisService.cs */
export interface AffectedBranchDto {
  branchId: number
  recipeId: number
  impact: ImpactType
  branchCode: string | null
  recipeVersionId: number | null
}

/** backend/src/BrewForge.Application/Impact/ImpactAnalysisService.cs */
export interface AffectedCertificateDto {
  id: number
  impact: ImpactType
  userId: number | null
  fullName: string | null
  branchId: number | null
  recipeVersionId: number | null
  status: CertificateStatus | null
}

/** backend/src/BrewForge.Application/Impact/ImpactAnalysisService.cs */
export interface AffectedCourseDto {
  id: number
  impact: ImpactType
  title: string | null
  recipeVersionId: number | null
  state: CourseState | null
}

/** backend/src/BrewForge.Application/Impact/ImpactAnalysisService.cs */
export interface AffectedDto {
  recipeVersions: Array<number>
  courses: Array<AffectedCourseDto>
  certificates: Array<AffectedCertificateDto>
  liveBranches: Array<AffectedBranchDto>
}

/** backend/src/BrewForge.Application/Training/AssignmentService.cs */
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

/** backend/src/BrewForge.Application/Training/AssignmentService.cs */
export interface AssignmentRequest {
  courseId: number | null
  branchId: number | null
  employeeIds: Array<number> | null
  allTrainees: boolean | null
  deadline: string | null
  reason: string | null
}

/** backend/src/BrewForge.Application/Training/AssignmentService.cs */
export interface AssignmentResultDto {
  courseId: number
  enrollmentIds: Array<number>
  alreadyEnrolled: Array<number>
}

export const AssignmentStatusValues = ["ASSIGNED","IN_PROGRESS","THEORY_COMPLETED","QUIZ_PASSED","PRACTICAL_PENDING","COMPLETED","OVERDUE","LOCKED","CLOSED"] as const
export type AssignmentStatus = typeof AssignmentStatusValues[number]

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface AttendanceEntryDto {
  enrollmentId: number
  userId: number
  fullName: string
  status: AttendanceStatus | null
  note: string | null
  recordedAt: string | null
  attendanceStillReachable: boolean
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface AttendanceEntryRequest {
  enrollmentId: number | null
  status: AttendanceStatus | null
  note: string | null
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface AttendanceRequest {
  entries: Array<AttendanceEntryRequest> | null
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface AttendanceSheetDto {
  sessionId: number
  trainingClassId: number
  classState: ClassState
  entries: Array<AttendanceEntryDto>
}

export const AttendanceStatusValues = ["PRESENT","ABSENT","EXCUSED"] as const
export type AttendanceStatus = typeof AttendanceStatusValues[number]

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface AuditEntryDto {
  id: number
  userId: number | null
  username: string | null
  entityType: string
  entityId: number
  action: string
  payload: unknown | null
  createdAt: string
}

/** backend/src/BrewForge.Application/Quality/QualityAuditService.cs */
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

/** backend/src/BrewForge.Application/Quality/QualityAuditService.cs */
export interface AuditItemRequest {
  criterion: string | null
  expected: string | null
  actual: string | null
  passed: boolean | null
  critical: boolean | null
  comment: string | null
  evidenceUrl: string | null
}

export const AuditResultValues = ["PASSED","FAILED"] as const
export type AuditResult = typeof AuditResultValues[number]

/** backend/src/BrewForge.Application/Quality/QualityAuditService.cs */
export interface AuditSummaryDto {
  from: string
  to: string
  audits: number
  passed: number
  failed: number
  openCorrectiveActions: number
  lowestCompliance: BranchComplianceDto | null
  branches: Array<BranchComplianceDto>
}

/** backend/src/BrewForge.Application/Quality/QualityAuditService.cs */
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
  items: Array<AuditItemDto>
  correctiveActionId: number | null
}

/** backend/src/BrewForge.Application/Quality/QualityAuditService.cs */
export interface BranchAuditRequest {
  branchId: number | null
  recipeVersionId: number | null
  comment: string | null
  items: Array<AuditItemRequest> | null
  retrainingRequired: boolean | null
  employeeIds: Array<number> | null
  dueDate: string | null
}

/** backend/src/BrewForge.Application/Quality/QualityAuditService.cs */
export interface BranchComplianceDto {
  branchId: number
  branchCode: string | null
  branchName: string | null
  audits: number
  averageScore: number
}

/** backend/src/BrewForge.Application/MasterData/BranchService.cs */
export interface BranchDto {
  id: number
  branchCode: string
  name: string
  address: string | null
  status: BranchStatus
}

/** backend/src/BrewForge.Application/Launch/LaunchStatusService.cs */
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

/** backend/src/BrewForge.Application/Dashboards/DashboardService.cs */
export interface BranchPerformanceDto {
  from: string
  to: string
  rows: Array<BranchPerformanceRowDto>
}

/** backend/src/BrewForge.Application/Dashboards/DashboardService.cs */
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

/** backend/src/BrewForge.Application/Launch/PilotService.cs */
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

/** backend/src/BrewForge.Application/MasterData/BranchService.cs */
export interface BranchRequest {
  branchCode: string | null
  name: string | null
  address: string | null
  status: BranchStatus | null
}

/** backend/src/BrewForge.Domain/Launch/PilotEvaluation.cs */
export interface BranchResult {
  branchId: number
  expectedDays: number
  tradingDays: number
  cupsTotal: number
  cupsPerDay: number
  coverageComplete: boolean
  verdict: Verdict
  criteria: Array<CriterionResult>
}

export const BranchStatusValues = ["ACTIVE","CLOSED"] as const
export type BranchStatus = typeof BranchStatusValues[number]

export const CatalogStatusValues = ["ACTIVE","INACTIVE"] as const
export type CatalogStatus = typeof CatalogStatusValues[number]

/** backend/src/BrewForge.Application/MasterData/CategoryService.cs */
export interface CategoryDto {
  id: number
  kind: CategoryKind
  code: string
  name: string
  status: CatalogStatus
}

export const CategoryKindValues = ["DRINK","INGREDIENT","TRAINING","EQUIPMENT"] as const
export type CategoryKind = typeof CategoryKindValues[number]

/** backend/src/BrewForge.Application/MasterData/CategoryService.cs */
export interface CategoryRequest {
  kind: CategoryKind | null
  code: string | null
  name: string | null
  status: CatalogStatus | null
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
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

export const CertificateStatusValues = ["VALID","NEEDS_RECERT","SUPERSEDED"] as const
export type CertificateStatus = typeof CertificateStatusValues[number]

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface CheckDto {
  checkType: CheckType
  passed: boolean
  violations: Array<ViolationDto>
}

export const CheckTypeValues = ["EQUIPMENT","ORDERING","INGREDIENT"] as const
export type CheckType = typeof CheckTypeValues[number]

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface ChecklistItemDto {
  lessonId: number
  recipeStepId: number | null
  stepOrder: number
  actionText: string
  techniqueGate: string | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface ChecklistItemRequest {
  recipeStepId: number | null
}

/** backend/src/BrewForge.Domain/Training/Assessment.cs */
export interface ChecklistMark {
  recipeStepId: number | null
  passed: boolean
  note: string | null
  lessonId: number | null
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface ChecklistMarkRequest {
  recipeStepId: number | null
  lessonId: number | null
  passed: boolean | null
  note: string | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface ChecklistRequest {
  items: Array<ChecklistItemRequest> | null
}

export const ClassStateValues = ["PLANNED","RUNNING","CLOSED","CANCELLED"] as const
export type ClassState = typeof ClassStateValues[number]

/** backend/src/BrewForge.Application/Quality/CorrectiveActionService.cs */
export interface CloseCorrectiveActionRequest {
  note: string | null
}

/** backend/src/BrewForge.Application/Quality/CorrectiveActionService.cs */
export interface CorrectiveActionDto {
  id: number
  branchAuditId: number
  branchId: number
  branchCode: string | null
  description: string
  retrainingRequired: boolean
  employeeIds: Array<number>
  status: CorrectiveActionStatus
  dueDate: string | null
  createdAt: string
  closedAt: string | null
  closedBy: number | null
  closureNote: string | null
}

export const CorrectiveActionStatusValues = ["OPEN","IN_PROGRESS","CLOSED"] as const
export type CorrectiveActionStatus = typeof CorrectiveActionStatusValues[number]

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface CourseDetailDto {
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
  modules: Array<CourseModuleDto>
  quiz: QuizDto
  practicalChecklist: Array<ChecklistItemDto>
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
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

/** backend/src/BrewForge.Application/Dashboards/DashboardService.cs */
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
  modules: Array<ModuleEffectiveness>
  cupsSold: number
  salesByBranch: Array<CourseSalesBranchDto>
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface CourseModuleDto {
  id: number
  courseId: number
  moduleType: ModuleType
  moduleOrder: number
  source: ModuleSource
  durationMinutes: number | null
  state: ModuleState
  lessons: Array<LessonDto>
}

/** backend/src/BrewForge.Application/Dashboards/DashboardService.cs */
export interface CourseSalesBranchDto {
  branchId: number
  branchCode: string | null
  certifiedStaff: number
  cups: number
  tradingDays: number
  cupsPerDay: number
}

export const CourseStateValues = ["DRAFT","PENDING_APPROVAL","PUBLISHED","OUT_OF_DATE","ARCHIVED"] as const
export type CourseState = typeof CourseStateValues[number]

export const CourseTypeValues = ["INDUCTION","PRODUCT","EQUIPMENT","RECERTIFICATION"] as const
export type CourseType = typeof CourseTypeValues[number]

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface CreateCourseRequest {
  recipeVersionId: number | null
  courseType: CourseType | null
  title: string | null
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface CreateRecipeRequest {
  recipeCode: string | null
  name: string | null
  category: RecipeCategory | null
  origin: RecipeOrigin | null
}

/** backend/src/BrewForge.Application/Users/UserService.cs */
export interface CreateUserRequest {
  username: string | null
  email: string | null
  password: string | null
  fullName: string | null
  role: RoleName | null
  branchId: number | null
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface CreateVersionRequest {
  copyFromVersionId: number | null
}

/** backend/src/BrewForge.Domain/Launch/PilotEvaluation.cs */
export interface CriterionResult {
  type: CriterionType
  target: number
  actual: number | null
  verdict: Verdict
}

export const CriterionTypeValues = ["ABSOLUTE","RELATIVE","RETENTION"] as const
export type CriterionType = typeof CriterionTypeValues[number]

/** backend/src/BrewForge.Application/Launch/PilotService.cs */
export interface DecisionRequest {
  decision: LaunchDecisionType | null
  note: string | null
}

export const DependencyTypeValues = ["FINISH_TO_START","REQUIRES_OUTPUT"] as const
export type DependencyType = typeof DependencyTypeValues[number]

export const DosingUnitValues = ["g","ml","sec","degC","bar"] as const
export type DosingUnit = typeof DosingUnitValues[number]

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface DraftResultDto {
  version: RecipeVersionDto
  validation: ValidationResultDto
  notes: string | null
  servingSizeMl: number | null
  aiRepairsUsed: number
  aiRepairsLeft: number
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface EligibilityDto {
  eligible: boolean
  missingModules: Array<MissingModuleDto>
  attendancePct: number
  minAttendancePct: number
  attendanceStillReachable: boolean
  retakesLeft: number
  regulationId: number | null
  state: EnrollmentState
}

/** backend/src/BrewForge.Application/Training/SkillService.cs */
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

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
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

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface EnrollmentModuleDto {
  module: CourseModuleDto
  completed: boolean
  completedAt: string | null
}

export const EnrollmentStateValues = ["ASSIGNED","IN_PROGRESS","ELIGIBLE","PASSED","LOCKED","CLOSED"] as const
export type EnrollmentState = typeof EnrollmentStateValues[number]

/** backend/src/BrewForge.Application/MasterData/EquipmentClassService.cs */
export interface EquipmentClassDto {
  id: number
  equipmentCode: string
  equipmentClass: string
  minThreshold: number
  maxThreshold: number
  dosingUnit: DosingUnit
  status: CatalogStatus
}

/** backend/src/BrewForge.Application/MasterData/EquipmentClassService.cs */
export interface EquipmentClassRequest {
  equipmentCode: string | null
  equipmentClass: string | null
  minThreshold: number | null
  maxThreshold: number | null
  dosingUnit: DosingUnit | null
  status: CatalogStatus | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface EquipmentListReference {
  equipment: Array<EquipmentReference>
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface EquipmentReference {
  equipmentClass: string
  equipmentCode: string | null
  minThreshold: number | null
  maxThreshold: number | null
  dosingUnit: DosingUnit | null
  usedInSteps: Array<number>
}

/** backend/src/BrewForge.Domain/Common/DomainException.cs */
export interface ErrorDetail {
  field: string
  issue: string
}

/** backend/src/BrewForge.Api/Errors/ErrorEnvelope.cs */
export interface ErrorEnvelope {
  code: string
  message: string
  rule: string | null
  details: Array<ErrorDetail>
  traceId: string
}

/** backend/src/BrewForge.Application/Quality/EvidenceService.cs */
export interface EvidenceDto {
  key: string
  url: string
  sizeBytes: number
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface GenerateDraftRequest {
  description: string | null
}

/** backend/src/BrewForge.Application/Impact/ImpactAnalysisService.cs */
export interface ImpactAnalysisDto {
  runId: string
  trigger: ImpactTriggerDto
  affected: AffectedDto
  committed: boolean
  warning: ImpactWarningDto | null
}

/** backend/src/BrewForge.Application/Impact/ImpactAnalysisService.cs */
export interface ImpactRequest {
  entityType: string | null
  entityId: number | null
}

/** backend/src/BrewForge.Application/Impact/ImpactAnalysisService.cs */
export interface ImpactTriggerDto {
  entityType: string
  entityId: number
}

export const ImpactTypeValues = ["OUT_OF_DATE","NEEDS_RECERT","BRANCH_AFFECTED"] as const
export type ImpactType = typeof ImpactTypeValues[number]

/** backend/src/BrewForge.Application/Impact/ImpactAnalysisService.cs */
export interface ImpactWarningDto {
  code: string
  message: string
}

/** backend/src/BrewForge.Application/Recipes/RecipeReleaseService.cs */
export interface ImportExistingRecipeRequest {
  recipeCode: string | null
  name: string | null
  category: RecipeCategory | null
  steps: Array<StepRequest> | null
}

/** backend/src/BrewForge.Application/Recipes/RecipeReleaseService.cs */
export interface ImportedRecipeDto {
  recipe: RecipeDto
  version: RecipeVersionDto
  validation: ValidationResultDto
}

/** backend/src/BrewForge.Application/MasterData/IngredientService.cs */
export interface IngredientDto {
  id: number
  ingredientCode: string
  name: string
  unit: IngredientUnit
  shelfLifeHours: number
  storageRule: string | null
  status: CatalogStatus
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface IngredientReference {
  ingredientCode: string
  name: string
  totalQuantity: number
  unit: string
  shelfLifeHours: number
  storageRule: string | null
  status: CatalogStatus
  usedInSteps: Array<number>
}

/** backend/src/BrewForge.Application/MasterData/IngredientService.cs */
export interface IngredientRequest {
  ingredientCode: string | null
  name: string | null
  unit: IngredientUnit | null
  shelfLifeHours: number | null
  storageRule: string | null
  status: CatalogStatus | null
}

export const IngredientUnitValues = ["g","ml","pcs"] as const
export type IngredientUnit = typeof IngredientUnitValues[number]

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface IngredientsReference {
  ingredients: Array<IngredientReference>
}

/** backend/src/BrewForge.Application/Launch/PilotService.cs */
export interface LaunchDecisionDto {
  decision: LaunchDecisionType
  decidedBy: number
  decidedAt: string
  evaluated: unknown
}

export const LaunchDecisionTypeValues = ["ROLLOUT","REVISE","DISCONTINUE"] as const
export type LaunchDecisionType = typeof LaunchDecisionTypeValues[number]

export const LaunchStatusValues = ["PREPARING","READY","LIVE","WITHDRAWN"] as const
export type LaunchStatus = typeof LaunchStatusValues[number]

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface LearnerQuestionDto {
  id: number
  courseModuleId: number
  moduleType: ModuleType
  questionText: string
  options: Array<QuizOption>
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface LearnerQuizDto {
  quizId: number
  title: string
  passScore: number
  retakesLeft: number
  questions: Array<LearnerQuestionDto>
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface LessonDto {
  id: number
  lessonOrder: number
  title: string
  recipeStepId: number | null
  content: string | null
  mediaUrl: string | null
  generated: boolean
  reference: unknown | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface LessonRequest {
  title: string | null
  content: string | null
  mediaUrl: string | null
}

/** backend/src/BrewForge.Application/Auth/AuthService.cs */
export interface LoginRequest {
  username: string | null
  password: string | null
}

/** backend/src/BrewForge.Application/Auth/AuthService.cs */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserDto
}

/** backend/src/BrewForge.Application/Auth/AuthService.cs */
export interface MeResponse {
  id: number
  username: string
  email: string
  fullName: string
  role: RoleName
  branchId: number | null
  status: UserStatus
  permissions: Array<string>
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface MissingModuleDto {
  courseModuleId: number
  moduleType: ModuleType
}

/** backend/src/BrewForge.Domain/Training/CourseEffectiveness.cs */
export interface ModuleEffectiveness {
  courseModuleId: number
  moduleType: ModuleType
  firstAttempts: number
  passed: number
  passRatePct: number | null
  highlighted: boolean
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface ModuleScoreDto {
  moduleType: ModuleType
  correct: number
  total: number
}

export const ModuleSourceValues = ["GENERATED","AUTHORED","MIXED"] as const
export type ModuleSource = typeof ModuleSourceValues[number]

export const ModuleStateValues = ["EMPTY","DRAFT","COMPLETE","NEEDS_REVIEW"] as const
export type ModuleState = typeof ModuleStateValues[number]

export const ModuleTypeValues = ["PRODUCT_OVERVIEW","INGREDIENTS","EQUIPMENT","SOP","TECHNIQUE","COMMON_MISTAKES","EXCEPTION_HANDLING"] as const
export type ModuleType = typeof ModuleTypeValues[number]

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface OpenClassRequest {
  traineeIds: Array<number> | null
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface OpenClassResultDto {
  class: TrainingClassDto
  enrollmentIds: Array<number>
  skippedUserIds: Array<number>
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface OverviewReference {
  recipeCode: string
  recipeName: string
  category: RecipeCategory
  versionNo: number
  stepCount: number
  totalDurationSeconds: number
}

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface PersonDto {
  id: number
  username: string
  fullName: string
  role: RoleName
}

/** backend/src/BrewForge.Application/Launch/PilotService.cs */
export interface PilotBranchDto {
  branchId: number
  branchCode: string | null
  branchName: string | null
  readinessState: PilotBranchState
  wentLiveAt: string | null
}

export const PilotBranchStateValues = ["PREPARING","READY","LIVE"] as const
export type PilotBranchState = typeof PilotBranchStateValues[number]

/** backend/src/BrewForge.Domain/Launch/PilotCriteria.cs */
export interface PilotCriterion {
  type: CriterionType
  cupsPerDayPerBranch: number | null
  controlRecipeId: number | null
  minPercentOfControl: number | null
  maxDropSecondHalfPct: number | null
}

/** backend/src/BrewForge.Application/Launch/PilotService.cs */
export interface PilotCriterionRequest {
  type: CriterionType | null
  cupsPerDayPerBranch: number | null
  controlRecipeId: number | null
  minPercentOfControl: number | null
  maxDropSecondHalfPct: number | null
}

/** backend/src/BrewForge.Application/Launch/PilotService.cs */
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
  criteria: Array<PilotCriterion>
  branches: Array<PilotBranchDto>
  decision: LaunchDecisionDto | null
}

/** backend/src/BrewForge.Domain/Launch/PilotEvaluation.cs */
export interface PilotEvaluation {
  pilotId: number
  state: PilotState
  from: string
  to: string
  coverageComplete: boolean
  overall: Verdict
  criteria: Array<CriterionResult>
  byBranch: Array<BranchResult>
  byWeek: Array<WeekResult>
}

/** backend/src/BrewForge.Application/Launch/PilotService.cs */
export interface PilotReadinessDto {
  pilotId: number
  state: PilotState
  recipeVersionId: number
  minCertifiedStaff: number
  branches: Array<BranchReadinessDto>
}

/** backend/src/BrewForge.Application/Launch/PilotService.cs */
export interface PilotRequest {
  recipeVersionId: number | null
  name: string | null
  startDate: string | null
  endDate: string | null
  minCertifiedStaff: number | null
  branchIds: Array<number> | null
  criteria: Array<PilotCriterionRequest> | null
}

export const PilotStateValues = ["DRAFT","RUNNING","ENDED","CANCELLED"] as const
export type PilotState = typeof PilotStateValues[number]

/** backend/src/BrewForge.Application/Sales/PosImportService.cs */
export interface PosImportResultDto {
  jobId: string
  fileName: string
  accepted: number
  rejected: number
  replaced: number
  errors: Array<PosRowError>
  importedAt: string
  replayed: boolean
}

/** backend/src/BrewForge.Domain/Sales/PosImportLine.cs */
export interface PosRowError {
  row: number
  code: string
  message: string
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface PracticalEvaluationDto {
  id: number
  enrollmentId: number
  evaluatedBy: number
  passed: boolean
  evaluatedAt: string
  items: Array<ChecklistMark>
  practicalVideoId: number | null
  enrollmentState: EnrollmentState
  certificateId: number | null
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface PracticalEvaluationRequest {
  practicalVideoId: number | null
  items: Array<ChecklistMarkRequest> | null
}

/** backend/src/BrewForge.Application/Training/PracticalScheduleService.cs */
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

/** backend/src/BrewForge.Application/Training/PracticalScheduleService.cs */
export interface PracticalScheduleRequest {
  scheduledAt: string | null
  location: string | null
  note: string | null
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
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

/** backend/src/BrewForge.Application/MasterData/ProductService.cs */
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

/** backend/src/BrewForge.Application/MasterData/ProductService.cs */
export interface ProductRequest {
  productCode: string | null
  name: string | null
  categoryId: number | null
  recipeId: number | null
  description: string | null
  imageUrl: string | null
  status: CatalogStatus | null
}

/** backend/src/BrewForge.Application/Notifications/NotificationService.cs */
export interface PushConfigDto {
  enabled: boolean
  publicKey: string | null
}

/** backend/src/BrewForge.Application/Notifications/NotificationService.cs */
export interface PushSubscriptionDto {
  id: number
  endpoint: string
  createdAt: string
}

/** backend/src/BrewForge.Application/Notifications/NotificationService.cs */
export interface PushSubscriptionKeys {
  p256dh: string | null
  auth: string | null
}

/** backend/src/BrewForge.Application/Notifications/NotificationService.cs */
export interface PushSubscriptionRequest {
  endpoint: string | null
  keys: PushSubscriptionKeys | null
}

/** backend/src/BrewForge.Application/Training/QuestionBankService.cs */
export interface QuestionBankDto {
  id: number
  questionType: QuestionType
  questionText: string
  options: Array<QuizOption>
  correctOptions: Array<string>
  courseId: number | null
  moduleType: ModuleType | null
  createdBy: number
  createdAt: string
}

/** backend/src/BrewForge.Application/Training/QuestionBankService.cs */
export interface QuestionBankRequest {
  questionType: QuestionType | null
  questionText: string | null
  options: Array<QuizOptionRequest> | null
  correctOptions: Array<string> | null
  courseId: number | null
  moduleType: ModuleType | null
}

export const QuestionTypeValues = ["SINGLE_CHOICE","MULTIPLE_CHOICE","TRUE_FALSE"] as const
export type QuestionType = typeof QuestionTypeValues[number]

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface QuizAnswerRequest {
  questionId: number | null
  selectedOption: string | null
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface QuizAttemptRequest {
  answers: Array<QuizAnswerRequest> | null
}

/** backend/src/BrewForge.Application/Training/AssessmentService.cs */
export interface QuizAttemptResultDto {
  attemptNo: number
  score: number
  passed: boolean
  passScore: number
  retakesLeft: number
  enrollmentState: EnrollmentState
  perModule: Array<ModuleScoreDto>
  attemptedAt: string
  certificateId: number | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface QuizDto {
  id: number
  courseId: number
  title: string
  passScore: number
  questionCount: number
}

/** backend/src/BrewForge.Domain/Courses/Quiz.cs */
export interface QuizOption {
  key: string
  text: string
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface QuizOptionRequest {
  key: string | null
  text: string | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface QuizQuestionDto {
  id: number
  courseModuleId: number
  moduleType: ModuleType
  questionText: string
  options: Array<QuizOption>
  correctOption: string
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface QuizQuestionRequest {
  courseModuleId: number | null
  questionText: string | null
  options: Array<QuizOptionRequest> | null
  correctOption: string | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface QuizRequest {
  title: string | null
  passScore: number | null
}

export const RecipeCategoryValues = ["TEA","COFFEE","OTHER"] as const
export type RecipeCategory = typeof RecipeCategoryValues[number]

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface RecipeContentRequest {
  steps: Array<StepRequest> | null
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
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

export const RecipeOriginValues = ["NEW","EXISTING"] as const
export type RecipeOrigin = typeof RecipeOriginValues[number]

export const RecipeStatusValues = ["ACTIVE","DISCONTINUED"] as const
export type RecipeStatus = typeof RecipeStatusValues[number]

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
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
  steps: Array<StepDto>
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
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

/** backend/src/BrewForge.Application/Auth/AuthService.cs */
export interface RefreshRequest {
  refreshToken: string | null
}

/** backend/src/BrewForge.Application/Recipes/RecipeReleaseService.cs */
export interface ReleaseResultDto {
  version: RecipeVersionDto
  supersededVersionId: number | null
  replayed: boolean
}

export const RepairModeValues = ["AI","MANUAL"] as const
export type RepairMode = typeof RepairModeValues[number]

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface RepairRequest {
  mode: RepairMode | null
  patch: RecipeContentRequest | null
}

/** backend/src/BrewForge.Application/Quality/CorrectiveActionService.cs */
export interface RetrainingRequest {
  courseId: number | null
  deadline: string | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface ReturnCourseRequest {
  comment: string | null
}

export const ReviewActionValues = ["ACCEPT","EDIT","REJECT"] as const
export type ReviewAction = typeof ReviewActionValues[number]

export const ReviewOutcomeValues = ["ACCEPTED","EDITED","REJECTED"] as const
export type ReviewOutcome = typeof ReviewOutcomeValues[number]

/** backend/src/BrewForge.Application/Recipes/RecipeReleaseService.cs */
export interface ReviewRequest {
  decisions: Array<StepDecisionRequest> | null
}

/** backend/src/BrewForge.Application/Recipes/RecipeReleaseService.cs */
export interface ReviewResultDto {
  outcome: ReviewOutcome
  version: RecipeVersionDto
}

export const RoleNameValues = ["ADMIN","RD_SPECIALIST","RD_MANAGER","TRAINER","TRAINEE","QUALITY_AUDITOR","BRANCH_MANAGER","TRAINING_MANAGER"] as const
export type RoleName = typeof RoleNameValues[number]

/** backend/src/BrewForge.Application/Sales/SalesAnalyticsService.cs */
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
  groups: Array<SalesGroupDto>
}

/** backend/src/BrewForge.Application/Sales/SalesService.cs */
export interface SalesCorrectionRequest {
  cupsSold: number | null
}

/** backend/src/BrewForge.Application/Sales/SalesAnalyticsService.cs */
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

export const SalesGroupingValues = ["BRANCH","DAY","WEEK"] as const
export type SalesGrouping = typeof SalesGroupingValues[number]

/** backend/src/BrewForge.Application/Sales/SalesService.cs */
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

/** backend/src/BrewForge.Application/Sales/SalesService.cs */
export interface SalesRecordRequest {
  branchId: number | null
  recipeId: number | null
  tradingDate: string | null
  cupsSold: number | null
}

export const SalesSourceValues = ["MANUAL","POS_IMPORT"] as const
export type SalesSource = typeof SalesSourceValues[number]

export const ScheduleStatusValues = ["SCHEDULED","COMPLETED","CANCELLED"] as const
export type ScheduleStatus = typeof ScheduleStatusValues[number]

/** backend/src/BrewForge.Application/Sales/SalesService.cs */
export interface SellableDrinkDto {
  recipeId: number
  recipeCode: string
  name: string
  category: RecipeCategory
  recipeVersionId: number
  versionNo: number | null
  coverageMet: boolean
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface SessionRequest {
  sessionNo: number | null
  scheduledDate: string | null
  startTime: string | null
  durationMinutes: number | null
  location: string | null
  trainerId: number | null
  moduleIds: Array<number> | null
}

/** backend/src/BrewForge.Application/MasterData/SettingsService.cs */
export interface SettingDto {
  key: string
  value: string
  updatedAt: string
  updatedBy: number | null
}

/** backend/src/BrewForge.Application/MasterData/SettingsService.cs */
export interface SettingRequest {
  value: string | null
}

/** backend/src/BrewForge.Application/Training/SkillService.cs */
export interface SkillDto {
  courseId: number
  courseTitle: string
  recipeVersionId: number | null
  status: SkillStatus
  certificateId: number | null
  issuedAt: string | null
}

export const SkillStatusValues = ["CERTIFIED","NEEDS_RECERT","TRAINING","NOT_CERTIFIED"] as const
export type SkillStatus = typeof SkillStatusValues[number]

/** backend/src/BrewForge.Application/Recipes/RecipeReleaseService.cs */
export interface StepDecisionRequest {
  stepId: number | null
  action: ReviewAction | null
  editedText: string | null
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface StepDependencyDto {
  stepId: number
  stepOrder: number
  type: DependencyType
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface StepDependencyRequest {
  stepOrder: number | null
  stepId: number | null
  type: DependencyType | null
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface StepDto {
  id: number
  stepOrder: number
  actionText: string
  equipmentClass: string | null
  techniqueGate: string | null
  durationSeconds: number | null
  ingredients: Array<StepIngredientDto>
  dependsOn: Array<StepDependencyDto>
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface StepIngredientDto {
  ingredientId: number
  ingredientCode: string | null
  ingredientName: string | null
  quantity: number
  unit: string
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface StepIngredientReference {
  ingredientCode: string
  name: string
  quantity: number
  unit: string
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface StepIngredientRequest {
  ingredientId: number | null
  ingredientCode: string | null
  quantity: number | null
  unit: string | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface StepReference {
  stepOrder: number
  actionText: string
  equipmentClass: string | null
  techniqueGate: string | null
  durationSeconds: number | null
  ingredients: Array<StepIngredientReference>
  dependsOnSteps: Array<number>
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface StepRequest {
  stepOrder: number | null
  actionText: string | null
  equipmentClass: string | null
  techniqueGate: string | null
  durationSeconds: number | null
  ingredients: Array<StepIngredientRequest> | null
  dependsOn: Array<StepDependencyRequest> | null
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface TechniqueGateReference {
  stepOrder: number
  actionText: string
  techniqueGate: string | null
}

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface TraceAiDraftDto {
  id: number
  modelName: string
  schemaValid: boolean
  createdAt: string
  promptText: string
}

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface TraceBranchDto {
  branchId: number
  branchCode: string | null
  status: LaunchStatus
  liveSince: string | null
  certifiedCount: number
  coverageMet: boolean
}

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface TraceCertificateDto {
  id: number
  userId: number
  username: string | null
  fullName: string | null
  branchId: number | null
  branchCode: string | null
  courseId: number
  status: CertificateStatus
  issuedAt: string
}

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface TraceCheckDto {
  checkType: CheckType
  passed: boolean
  violations: number
  runAt: string
}

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface TraceCourseDto {
  id: number
  title: string
  courseType: CourseType
  state: CourseState
  createdBy: PersonDto | null
  approvedBy: PersonDto | null
  publishedAt: string | null
}

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface TraceVersionDto {
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

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
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
  sessions: Array<TrainingSessionDto>
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface TrainingClassRequest {
  courseId: number | null
  branchId: number | null
  name: string | null
  startDate: string | null
  endDate: string | null
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
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

/** backend/src/BrewForge.Application/Dashboards/DashboardService.cs */
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

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface TrainingRegulationDto {
  id: number
  courseType: CourseType
  mandatoryForRole: RoleName | null
  prerequisiteType: CourseType | null
  dueDays: number
  maxRetakes: number
  minAttendancePct: number
  effectiveFrom: string
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface TrainingRegulationRequest {
  courseType: CourseType | null
  mandatoryForRole: RoleName | null
  prerequisiteType: CourseType | null
  dueDays: number | null
  maxRetakes: number | null
  minAttendancePct: number | null
  effectiveFrom: string | null
}

/** backend/src/BrewForge.Application/Training/TrainingDtos.cs */
export interface TrainingSessionDto {
  id: number
  trainingClassId: number
  sessionNo: number
  scheduledDate: string
  startTime: string
  durationMinutes: number
  location: string | null
  trainerId: number
  moduleIds: Array<number>
}

/** backend/src/BrewForge.Application/Courses/CourseDtos.cs */
export interface UpdateModuleRequest {
  durationMinutes: number | null
}

/** backend/src/BrewForge.Application/Users/UserService.cs */
export interface UpdateUserRequest {
  username: string | null
  email: string | null
  password: string | null
  fullName: string | null
  role: RoleName | null
  branchId: number | null
  status: UserStatus | null
}

/** backend/src/BrewForge.Application/Users/UserService.cs */
export interface UserDto {
  id: number
  username: string
  email: string
  fullName: string
  role: RoleName
  branchId: number | null
  status: UserStatus
  createdAt: string
}

export const UserStatusValues = ["ACTIVE","INACTIVE"] as const
export type UserStatus = typeof UserStatusValues[number]

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface ValidationResultDto {
  versionId: number
  passed: boolean
  runAt: string
  checks: Array<CheckDto>
}

export const VerdictValues = ["PASS","FAIL","INCOMPLETE"] as const
export type Verdict = typeof VerdictValues[number]

export const VersionStateValues = ["DRAFT","VALIDATED","REJECTED","RELEASED","SUPERSEDED"] as const
export type VersionState = typeof VersionStateValues[number]

/** backend/src/BrewForge.Application/Audit/AuditService.cs */
export interface VersionTraceDto {
  entityType: string
  entityId: number
  version: TraceVersionDto
  validation: Array<TraceCheckDto>
  aiDrafts: Array<TraceAiDraftDto>
  courses: Array<TraceCourseDto>
  certifiedStaff: Array<TraceCertificateDto>
  branches: Array<TraceBranchDto>
  cupsSold: number
  events: Array<AuditEntryDto>
}

/** backend/src/BrewForge.Application/Recipes/RecipeDtos.cs */
export interface ViolationDto {
  stepId: number | null
  stepOrder: number | null
  rule: string
  code: string | null
  message: string
  expected: string
  actual: string
}

/** backend/src/BrewForge.Domain/Launch/PilotEvaluation.cs */
export interface WeekResult {
  week: number
  from: string
  to: string
  cups: number
}

export type LessonReference = OverviewReference | IngredientsReference | EquipmentListReference | StepReference | TechniqueGateReference | null

export interface EndpointContracts {
  'ImpactAnalysis.Analyze': { request: ImpactRequest; response: ImpactAnalysisDto; params: Record<string, never>; query: Record<string, never> }
  'ImpactAnalysis.Get': { request: never; response: ImpactAnalysisDto; params: {runId: string;}; query: Record<string, never> }
  'ImpactAnalysis.Commit': { request: never; response: ImpactAnalysisDto; params: {runId: string;}; query: Record<string, never> }
  'AuditLog.List': { request: never; response: PagedResult<AuditEntryDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;entityType?: string | null;entityId?: number | null;action?: string | null;userId?: number | null;branchId?: number | null;from?: string | null;to?: string | null;} }
  'AuditLog.Trace': { request: never; response: VersionTraceDto; params: {entityType: string;entityId: number;}; query: Record<string, never> }
  'Reports.Compliance': { request: never; response: Blob; params: Record<string, never>; query: {format?: string | null;from?: string | null;to?: string | null;branchId?: number | null;courseId?: number | null;recipeVersionId?: number | null;} }
  'Auth.Login': { request: LoginRequest; response: LoginResponse; params: Record<string, never>; query: Record<string, never> }
  'Auth.Refresh': { request: RefreshRequest; response: LoginResponse; params: Record<string, never>; query: Record<string, never> }
  'Auth.Logout': { request: RefreshRequest; response: Blob; params: Record<string, never>; query: Record<string, never> }
  'Auth.Me': { request: never; response: MeResponse; params: Record<string, never>; query: Record<string, never> }
  'Branches.List': { request: never; response: PagedResult<BranchDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;status?: string | null;} }
  'Branches.Get': { request: never; response: BranchDto; params: {id: number;}; query: Record<string, never> }
  'Branches.Create': { request: BranchRequest; response: BranchDto; params: Record<string, never>; query: Record<string, never> }
  'Branches.Update': { request: BranchRequest; response: BranchDto; params: {id: number;}; query: Record<string, never> }
  'Branches.Deactivate': { request: never; response: BranchDto; params: {id: number;}; query: Record<string, never> }
  'Products.List': { request: never; response: PagedResult<ProductDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;categoryId?: number | null;status?: string | null;} }
  'Products.Get': { request: never; response: ProductDto; params: {id: number;}; query: Record<string, never> }
  'Products.Create': { request: ProductRequest; response: ProductDto; params: Record<string, never>; query: Record<string, never> }
  'Products.Update': { request: ProductRequest; response: ProductDto; params: {id: number;}; query: Record<string, never> }
  'Products.Deactivate': { request: never; response: ProductDto; params: {id: number;}; query: Record<string, never> }
  'QuestionBank.List': { request: never; response: PagedResult<QuestionBankDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;courseId?: number | null;recipeVersionId?: number | null;questionType?: string | null;} }
  'QuestionBank.Get': { request: never; response: QuestionBankDto; params: {id: number;}; query: Record<string, never> }
  'QuestionBank.Create': { request: QuestionBankRequest; response: QuestionBankDto; params: Record<string, never>; query: Record<string, never> }
  'QuestionBank.Update': { request: QuestionBankRequest; response: QuestionBankDto; params: {id: number;}; query: Record<string, never> }
  'QuestionBank.Delete': { request: never; response: Blob; params: {id: number;}; query: Record<string, never> }
  'QuestionBank.AddToCourse': { request: never; response: QuizQuestionDto; params: {id: number;courseId: number;}; query: Record<string, never> }
  'Assignments.List': { request: never; response: PagedResult<AssignmentDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;branchId?: number | null;courseId?: number | null;status?: string | null;} }
  'Assignments.Assign': { request: AssignmentRequest; response: AssignmentResultDto; params: Record<string, never>; query: Record<string, never> }
  'PracticalSchedules.List': { request: never; response: PagedResult<PracticalScheduleDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;status?: string | null;from?: string | null;to?: string | null;} }
  'PracticalSchedules.ForEnrollment': { request: never; response: Array<PracticalScheduleDto>; params: {id: number;}; query: Record<string, never> }
  'PracticalSchedules.Create': { request: PracticalScheduleRequest; response: PracticalScheduleDto; params: {id: number;}; query: Record<string, never> }
  'PracticalSchedules.Reschedule': { request: PracticalScheduleRequest; response: PracticalScheduleDto; params: {id: number;}; query: Record<string, never> }
  'PracticalSchedules.Cancel': { request: never; response: PracticalScheduleDto; params: {id: number;}; query: Record<string, never> }
  'PracticalSchedules.Complete': { request: never; response: PracticalScheduleDto; params: {id: number;}; query: Record<string, never> }
  'Skills.Mine': { request: never; response: Array<SkillDto>; params: Record<string, never>; query: Record<string, never> }
  'Skills.Employees': { request: never; response: Array<EmployeeSkillSummaryDto>; params: Record<string, never>; query: {branchId?: number | null;} }
  'Settings.List': { request: never; response: Array<SettingDto>; params: Record<string, never>; query: Record<string, never> }
  'Settings.Update': { request: SettingRequest; response: SettingDto; params: {key: string;}; query: Record<string, never> }
  'Categories.List': { request: never; response: PagedResult<CategoryDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;kind?: string | null;status?: string | null;} }
  'Categories.Get': { request: never; response: CategoryDto; params: {id: number;}; query: Record<string, never> }
  'Categories.Create': { request: CategoryRequest; response: CategoryDto; params: Record<string, never>; query: Record<string, never> }
  'Categories.Update': { request: CategoryRequest; response: CategoryDto; params: {id: number;}; query: Record<string, never> }
  'Categories.Deactivate': { request: never; response: CategoryDto; params: {id: number;}; query: Record<string, never> }
  'Certificates.Mine': { request: never; response: Array<CertificateDto>; params: Record<string, never>; query: Record<string, never> }
  'Certificates.Get': { request: never; response: CertificateDto; params: {id: number;}; query: Record<string, never> }
  'Dashboards.TrainingProgress': { request: never; response: Array<TrainingProgressRowDto>; params: Record<string, never>; query: {branchId?: number | null;courseId?: number | null;} }
  'Dashboards.BranchPerformance': { request: never; response: BranchPerformanceDto; params: Record<string, never>; query: {branchId?: number | null;recipeId?: number | null;from?: string | null;to?: string | null;} }
  'Dashboards.CourseEffectiveness': { request: never; response: Array<CourseEffectivenessDto>; params: Record<string, never>; query: {courseId?: number | null;} }
  'Courses.List': { request: never; response: PagedResult<CourseDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;state?: string | null;courseType?: string | null;recipeVersionId?: number | null;} }
  'Courses.Create': { request: CreateCourseRequest; response: CourseDetailDto; params: Record<string, never>; query: Record<string, never> }
  'Courses.Get': { request: never; response: CourseDetailDto; params: {id: number;}; query: Record<string, never> }
  'Courses.Modules': { request: never; response: Array<CourseModuleDto>; params: {id: number;}; query: Record<string, never> }
  'Courses.GetQuiz': { request: never; response: QuizDto; params: {id: number;}; query: Record<string, never> }
  'Courses.UpdateQuiz': { request: QuizRequest; response: QuizDto; params: {id: number;}; query: Record<string, never> }
  'Courses.ListQuestions': { request: never; response: Array<QuizQuestionDto>; params: {id: number;}; query: Record<string, never> }
  'Courses.AddQuestion': { request: QuizQuestionRequest; response: QuizQuestionDto; params: {id: number;}; query: Record<string, never> }
  'Courses.SetPracticalChecklist': { request: ChecklistRequest; response: Array<ChecklistItemDto>; params: {id: number;}; query: Record<string, never> }
  'Courses.Submit': { request: never; response: CourseDetailDto; params: {id: number;}; query: Record<string, never> }
  'Courses.Approve': { request: never; response: CourseDetailDto; params: {id: number;}; query: Record<string, never> }
  'Courses.Return': { request: ReturnCourseRequest; response: CourseDetailDto; params: {id: number;}; query: Record<string, never> }
  'Courses.Rebuild': { request: never; response: CourseDetailDto; params: {id: number;}; query: Record<string, never> }
  'CourseModules.Update': { request: UpdateModuleRequest; response: CourseModuleDto; params: {id: number;}; query: Record<string, never> }
  'CourseModules.Regenerate': { request: never; response: CourseModuleDto; params: {id: number;}; query: Record<string, never> }
  'CourseModules.ListLessons': { request: never; response: Array<LessonDto>; params: {id: number;}; query: Record<string, never> }
  'CourseModules.AddLesson': { request: LessonRequest; response: LessonDto; params: {id: number;}; query: Record<string, never> }
  'Lessons.Update': { request: LessonRequest; response: LessonDto; params: {id: number;}; query: Record<string, never> }
  'Lessons.Delete': { request: never; response: Blob; params: {id: number;}; query: Record<string, never> }
  'EquipmentClasses.List': { request: never; response: PagedResult<EquipmentClassDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;status?: string | null;} }
  'EquipmentClasses.Get': { request: never; response: EquipmentClassDto; params: {id: number;}; query: Record<string, never> }
  'EquipmentClasses.Create': { request: EquipmentClassRequest; response: EquipmentClassDto; params: Record<string, never>; query: Record<string, never> }
  'EquipmentClasses.Update': { request: EquipmentClassRequest; response: EquipmentClassDto; params: {id: number;}; query: Record<string, never> }
  'EquipmentClasses.Deactivate': { request: never; response: EquipmentClassDto; params: {id: number;}; query: Record<string, never> }
  'Ingredients.List': { request: never; response: PagedResult<IngredientDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;unit?: string | null;status?: string | null;} }
  'Ingredients.Get': { request: never; response: IngredientDto; params: {id: number;}; query: Record<string, never> }
  'Ingredients.Create': { request: IngredientRequest; response: IngredientDto; params: Record<string, never>; query: Record<string, never> }
  'Ingredients.Update': { request: IngredientRequest; response: IngredientDto; params: {id: number;}; query: Record<string, never> }
  'Ingredients.Deactivate': { request: never; response: IngredientDto; params: {id: number;}; query: Record<string, never> }
  'Notifications.PushConfig': { request: never; response: PushConfigDto; params: Record<string, never>; query: Record<string, never> }
  'Notifications.Mine': { request: never; response: Array<PushSubscriptionDto>; params: Record<string, never>; query: Record<string, never> }
  'Notifications.Subscribe': { request: PushSubscriptionRequest; response: PushSubscriptionDto; params: Record<string, never>; query: Record<string, never> }
  'Notifications.Unsubscribe': { request: never; response: Blob; params: Record<string, never>; query: {endpoint?: string | null;} }
  'Pilots.List': { request: never; response: PagedResult<PilotDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;state?: string | null;recipeVersionId?: number | null;} }
  'Pilots.Create': { request: PilotRequest; response: PilotDto; params: Record<string, never>; query: Record<string, never> }
  'Pilots.Get': { request: never; response: PilotDto; params: {id: number;}; query: Record<string, never> }
  'Pilots.Update': { request: PilotRequest; response: PilotDto; params: {id: number;}; query: Record<string, never> }
  'Pilots.Readiness': { request: never; response: PilotReadinessDto; params: {id: number;}; query: Record<string, never> }
  'Pilots.Start': { request: never; response: PilotDto; params: {id: number;}; query: Record<string, never> }
  'Pilots.Cancel': { request: never; response: PilotDto; params: {id: number;}; query: Record<string, never> }
  'Pilots.GoLive': { request: never; response: PilotDto; params: {id: number;branchId: number;}; query: Record<string, never> }
  'Pilots.Evaluation': { request: never; response: PilotEvaluation; params: {id: number;}; query: Record<string, never> }
  'Pilots.Decide': { request: DecisionRequest; response: PilotDto; params: {id: number;}; query: Record<string, never> }
  'BranchLaunchStatus.List': { request: never; response: Array<BranchLaunchStatusDto>; params: Record<string, never>; query: {branchId?: number | null;recipeId?: number | null;status?: string | null;} }
  'BranchLaunchStatus.Withdraw': { request: never; response: BranchLaunchStatusDto; params: {id: number;}; query: Record<string, never> }
  'BranchAudits.List': { request: never; response: PagedResult<BranchAuditDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;branchId?: number | null;recipeVersionId?: number | null;result?: string | null;from?: string | null;to?: string | null;} }
  'BranchAudits.Summary': { request: never; response: AuditSummaryDto; params: Record<string, never>; query: {from?: string | null;to?: string | null;} }
  'BranchAudits.UploadEvidence': { request: FormData; response: EvidenceDto; params: Record<string, never>; query: Record<string, never> }
  'BranchAudits.Evidence': { request: never; response: Blob; params: {key: string;}; query: Record<string, never> }
  'BranchAudits.Get': { request: never; response: BranchAuditDto; params: {id: number;}; query: Record<string, never> }
  'BranchAudits.Create': { request: BranchAuditRequest; response: BranchAuditDto; params: Record<string, never>; query: Record<string, never> }
  'CorrectiveActions.List': { request: never; response: PagedResult<CorrectiveActionDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;branchId?: number | null;status?: string | null;} }
  'CorrectiveActions.Get': { request: never; response: CorrectiveActionDto; params: {id: number;}; query: Record<string, never> }
  'CorrectiveActions.Start': { request: never; response: CorrectiveActionDto; params: {id: number;}; query: Record<string, never> }
  'CorrectiveActions.AssignRetraining': { request: RetrainingRequest; response: AssignmentResultDto; params: {id: number;}; query: Record<string, never> }
  'CorrectiveActions.Close': { request: CloseCorrectiveActionRequest; response: CorrectiveActionDto; params: {id: number;}; query: Record<string, never> }
  'Recipes.List': { request: never; response: PagedResult<RecipeDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;category?: string | null;origin?: string | null;status?: string | null;} }
  'Recipes.Create': { request: CreateRecipeRequest; response: RecipeDto; params: Record<string, never>; query: Record<string, never> }
  'Recipes.ImportExisting': { request: ImportExistingRecipeRequest; response: ImportedRecipeDto; params: Record<string, never>; query: Record<string, never> }
  'Recipes.Get': { request: never; response: RecipeDto; params: {id: number;}; query: Record<string, never> }
  'Recipes.ListVersions': { request: never; response: Array<RecipeVersionSummaryDto>; params: {id: number;}; query: Record<string, never> }
  'Recipes.CreateVersion': { request: CreateVersionRequest; response: RecipeVersionDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.Get': { request: never; response: RecipeVersionDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.Update': { request: RecipeContentRequest; response: RecipeVersionDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.GenerateDraft': { request: GenerateDraftRequest; response: DraftResultDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.Validate': { request: never; response: ValidationResultDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.Repair': { request: RepairRequest; response: DraftResultDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.Submit': { request: never; response: ValidationResultDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.Review': { request: ReviewRequest; response: ReviewResultDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.Release': { request: never; response: ReleaseResultDto; params: {id: number;}; query: Record<string, never> }
  'RecipeVersions.Rollback': { request: never; response: RecipeVersionDto; params: {id: number;}; query: Record<string, never> }
  'Sales.List': { request: never; response: PagedResult<SalesRecordDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;branchId?: number | null;recipeId?: number | null;from?: string | null;to?: string | null;} }
  'Sales.Drinks': { request: never; response: Array<SellableDrinkDto>; params: Record<string, never>; query: {branchId?: number | null;tradingDate?: string | null;} }
  'Sales.Create': { request: SalesRecordRequest; response: SalesRecordDto; params: Record<string, never>; query: Record<string, never> }
  'Sales.Correct': { request: SalesCorrectionRequest; response: SalesRecordDto; params: {id: number;}; query: Record<string, never> }
  'Sales.Import': { request: FormData; response: PosImportResultDto; params: Record<string, never>; query: Record<string, never> }
  'Sales.ImportResult': { request: never; response: PosImportResultDto; params: {jobId: string;}; query: Record<string, never> }
  'Sales.Aggregate': { request: never; response: SalesAggregateDto; params: Record<string, never>; query: {recipeVersionId?: number | null;recipeId?: number | null;groupBy?: string | null;branchId?: number | null;from?: string | null;to?: string | null;controlRecipeId?: number | null;} }
  'TrainingRegulations.List': { request: never; response: Array<TrainingRegulationDto>; params: Record<string, never>; query: Record<string, never> }
  'TrainingRegulations.Create': { request: TrainingRegulationRequest; response: TrainingRegulationDto; params: Record<string, never>; query: Record<string, never> }
  'TrainingRegulations.Update': { request: TrainingRegulationRequest; response: TrainingRegulationDto; params: {id: number;}; query: Record<string, never> }
  'TrainingNeeds.List': { request: never; response: Array<TrainingNeedDto>; params: Record<string, never>; query: {branchId?: number | null;courseId?: number | null;} }
  'TrainingClasses.List': { request: never; response: PagedResult<TrainingClassDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;state?: string | null;branchId?: number | null;courseId?: number | null;} }
  'TrainingClasses.Create': { request: TrainingClassRequest; response: TrainingClassDto; params: Record<string, never>; query: Record<string, never> }
  'TrainingClasses.Get': { request: never; response: TrainingClassDto; params: {id: number;}; query: Record<string, never> }
  'TrainingClasses.Update': { request: TrainingClassRequest; response: TrainingClassDto; params: {id: number;}; query: Record<string, never> }
  'TrainingClasses.AddSession': { request: SessionRequest; response: TrainingSessionDto; params: {id: number;}; query: Record<string, never> }
  'TrainingClasses.Open': { request: OpenClassRequest; response: OpenClassResultDto; params: {id: number;}; query: Record<string, never> }
  'TrainingClasses.Close': { request: never; response: TrainingClassDto; params: {id: number;}; query: Record<string, never> }
  'TrainingSessions.Update': { request: SessionRequest; response: TrainingSessionDto; params: {id: number;}; query: Record<string, never> }
  'TrainingSessions.Delete': { request: never; response: Blob; params: {id: number;}; query: Record<string, never> }
  'TrainingSessions.GetAttendance': { request: never; response: AttendanceSheetDto; params: {id: number;}; query: Record<string, never> }
  'TrainingSessions.RecordAttendance': { request: AttendanceRequest; response: AttendanceSheetDto; params: {id: number;}; query: Record<string, never> }
  'Enrollments.Mine': { request: never; response: Array<EnrollmentDto>; params: Record<string, never>; query: Record<string, never> }
  'Enrollments.Get': { request: never; response: EnrollmentDto; params: {id: number;}; query: Record<string, never> }
  'Enrollments.Modules': { request: never; response: Array<EnrollmentModuleDto>; params: {id: number;}; query: Record<string, never> }
  'Enrollments.CompleteModule': { request: never; response: EnrollmentDto; params: {id: number;moduleId: number;}; query: Record<string, never> }
  'Enrollments.Eligibility': { request: never; response: EligibilityDto; params: {id: number;}; query: Record<string, never> }
  'Enrollments.Quiz': { request: never; response: LearnerQuizDto; params: {id: number;}; query: Record<string, never> }
  'Enrollments.AttemptQuiz': { request: QuizAttemptRequest; response: QuizAttemptResultDto; params: {id: number;}; query: Record<string, never> }
  'Enrollments.QuizAttempts': { request: never; response: Array<QuizAttemptResultDto>; params: {id: number;}; query: Record<string, never> }
  'Enrollments.UploadPracticalVideo': { request: FormData; response: PracticalVideoDto; params: {id: number;}; query: Record<string, never> }
  'Enrollments.PracticalVideos': { request: never; response: Array<PracticalVideoDto>; params: {id: number;}; query: Record<string, never> }
  'Enrollments.PracticalVideoContent': { request: never; response: Blob; params: {id: number;}; query: Record<string, never> }
  'Enrollments.EvaluatePractical': { request: PracticalEvaluationRequest; response: PracticalEvaluationDto; params: {id: number;}; query: Record<string, never> }
  'Enrollments.Close': { request: never; response: EnrollmentDto; params: {id: number;}; query: Record<string, never> }
  'Enrollments.Reset': { request: never; response: EnrollmentDto; params: {id: number;}; query: Record<string, never> }
  'Users.List': { request: never; response: PagedResult<UserDto>; params: Record<string, never>; query: {page?: number | null;size?: number | null;sort?: string | null;q?: string | null;role?: string | null;branchId?: number | null;status?: string | null;} }
  'Users.Get': { request: never; response: UserDto; params: {id: number;}; query: Record<string, never> }
  'Users.Create': { request: CreateUserRequest; response: UserDto; params: Record<string, never>; query: Record<string, never> }
  'Users.Update': { request: UpdateUserRequest; response: UserDto; params: {id: number;}; query: Record<string, never> }
  'Users.Deactivate': { request: never; response: UserDto; params: {id: number;}; query: Record<string, never> }
}
export type Operation = keyof EndpointContracts
