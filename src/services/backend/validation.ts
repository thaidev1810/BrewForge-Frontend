import { schemas } from './schema'
import type { RecordData } from './operations'
export type FieldIssue = { field: string; issue: string }
const required: Record<string, string[]> = {
  CreateUserRequest: ['username', 'email', 'password', 'fullName', 'role'], UpdateUserRequest: ['email', 'fullName', 'role'],
  BranchRequest: ['name'], IngredientRequest: ['name', 'unit', 'shelfLifeHours'], EquipmentClassRequest: ['minThreshold', 'maxThreshold', 'dosingUnit'],
  CategoryRequest: ['name'], ProductRequest: ['name'], CreateRecipeRequest: ['recipeCode', 'name', 'category'], ImportExistingRecipeRequest: ['recipeCode', 'name', 'category', 'steps'],
  RecipeContentRequest: ['steps'], StepRequest: ['stepOrder', 'actionText'], StepIngredientRequest: ['quantity', 'unit'], GenerateDraftRequest: ['description'], RepairRequest: ['mode'],
  ReviewRequest: ['decisions'], StepDecisionRequest: ['stepId', 'action'], CreateCourseRequest: ['courseType', 'title'], LessonRequest: ['title'],
  QuizQuestionRequest: ['courseModuleId', 'questionText', 'options', 'correctOption'], QuizOptionRequest: ['key', 'text'], ChecklistRequest: ['items'], ChecklistItemRequest: ['recipeStepId'], ReturnCourseRequest: ['comment'],
  TrainingRegulationRequest: ['courseType', 'dueDays', 'effectiveFrom'], TrainingClassRequest: ['name'], SessionRequest: ['scheduledDate', 'startTime', 'durationMinutes', 'trainerId'],
  AttendanceRequest: ['entries'], AttendanceEntryRequest: ['enrollmentId', 'status'], AssignmentRequest: ['courseId', 'branchId'], QuestionBankRequest: ['questionType', 'questionText', 'correctOptions'],
  PracticalScheduleRequest: ['scheduledAt', 'location'], QuizAttemptRequest: [], QuizAnswerRequest: ['questionId'], PracticalEvaluationRequest: ['items', 'practicalVideoId'], ChecklistMarkRequest: ['passed'],
  SalesRecordRequest: ['branchId', 'recipeId', 'tradingDate', 'cupsSold'], SalesCorrectionRequest: ['cupsSold'], PilotRequest: ['name', 'startDate', 'endDate', 'branchIds', 'criteria'], PilotCriterionRequest: ['type'],
  DecisionRequest: ['decision'], ImpactRequest: ['entityType', 'entityId'], BranchAuditRequest: ['branchId', 'recipeVersionId', 'items'], AuditItemRequest: ['criterion', 'passed'],
  CancelClassRequest: ['reason'], RetrainingRequest: ['courseId'], SettingRequest: ['value'], PushSubscriptionRequest: ['endpoint', 'keys'], PushSubscriptionKeys: ['p256dh', 'auth'],
}
const limits: Record<string, number> = { username: 64, email: 160, fullName: 120, branchCode: 16, ingredientCode: 24, equipmentCode: 24, recipeCode: 24, productCode: 24, equipmentClass: 40, name: 120, address: 255, storageRule: 255, actionText: 500, techniqueGate: 255, unit: 12, description: 1000, imageUrl: 500, title: 160, mediaUrl: 500, questionText: 500, correctOption: 8, key: 8, reason: 255, criterion: 160, expected: 255, actual: 255, evidenceUrl: 500, location: 160, editedText: 500 }
const maxBySchema: Record<string, Record<string, number>> = { CancelClassRequest: { reason: 500 }, GenerateDraftRequest: { description: 4000 }, CategoryRequest: { code: 40 }, SessionRequest: { location: 120 }, AttendanceEntryRequest: { note: 255 }, BranchAuditRequest: { comment: 1000 }, AuditItemRequest: { comment: 500 }, ReturnCourseRequest: { comment: 1000 } }
export function requiredField(schema: string, field: string, creating = false): boolean {
  return (required[schema] ?? []).includes(field) || creating && ({ BranchRequest: ['branchCode'], IngredientRequest: ['ingredientCode'], EquipmentClassRequest: ['equipmentCode', 'equipmentClass'], CategoryRequest: ['kind', 'code'], ProductRequest: ['productCode'], TrainingClassRequest: ['courseId', 'branchId', 'startDate', 'endDate'], PilotRequest: ['recipeVersionId'] }[schema] ?? []).includes(field)
}
export function fieldLimit(schema: string, field: string): number | undefined { return maxBySchema[schema]?.[field] ?? (/note|comment/.test(field) ? 500 : limits[field]) }
export function todayUtc() { return new Date().toISOString().slice(0, 10) }
export function tradingToday() { return new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10) }
export function validateRequest(schema: string, body: RecordData, creating = false, prefix = ''): FieldIssue[] {
  const issues: FieldIssue[] = [], add = (field: string, issue: string) => issues.push({ field: prefix + field, issue })
  const fields = schemas[schema as keyof typeof schemas] ?? []
  for (const field of fields) {
    const value = body[field.name], type = field.type.replace(/\?$/, ''), max = fieldLimit(schema, field.name)
    if (requiredField(schema, field.name, creating) && (value === null || value === undefined || typeof value === 'string' && !value.trim())) add(field.name, 'Trường này bắt buộc.')
    if (typeof value === 'string' && max && value.trim().length > max) add(field.name, `Tối đa ${max} ký tự.`)
    if (typeof value === 'number' && !Number.isFinite(value)) add(field.name, 'Số không hợp lệ.')
    if (typeof value === 'number' && /^(int|long)$/.test(type) && !Number.isSafeInteger(value)) add(field.name, 'Cần số nguyên trong phạm vi an toàn.')
    if (typeof value === 'number' && type === 'int' && (value > 2147483647 || value < -2147483648)) add(field.name, 'Số nguyên vượt phạm vi Int32 của API.')
    if (type === 'DateOnly' && value && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) add(field.name, 'Ngày phải có dạng YYYY-MM-DD.')
    const arr = type.match(/^IReadOnlyList<(.+)>$/)
    if (arr && Array.isArray(value)) value.forEach((item, i) => { if (item && typeof item === 'object') issues.push(...validateRequest(arr[1], item as RecordData, false, `${prefix}${field.name}[${i}].`)) })
    if (!arr && type in schemas && value && typeof value === 'object' && !Array.isArray(value)) issues.push(...validateRequest(type, value as RecordData, false, `${prefix}${field.name}.`))
  }
  const n = (f: string) => typeof body[f] === 'number' ? body[f] as number : null
  for (const f of ['durationMinutes', 'durationSeconds', 'shelfLifeHours', 'dueDays', 'quantity', 'sessionNo', 'stepOrder']) if (n(f) !== null && n(f)! <= 0) add(f, 'Phải lớn hơn 0.')
  for (const f of ['cupsSold', 'minThreshold', 'maxRetakes']) if (n(f) !== null && n(f)! < 0) add(f, 'Không được âm.')
  for (const f of ['passScore', 'minAttendancePct']) if (n(f) !== null && (n(f)! < 0 || n(f)! > 100)) add(f, 'Giá trị từ 0 đến 100.')
  if (n('maxThreshold') !== null && n('minThreshold') !== null && n('maxThreshold')! < n('minThreshold')!) add('maxThreshold', 'Phải lớn hơn hoặc bằng ngưỡng tối thiểu.')
  if (body.startDate && body.endDate && String(body.endDate) < String(body.startDate)) add('endDate', 'Ngày kết thúc không trước ngày bắt đầu.')
  if (body.from && body.to && String(body.from) > String(body.to)) add('from', 'Ngày bắt đầu không sau ngày kết thúc.')
  if (body.tradingDate && String(body.tradingDate) > tradingToday()) add('tradingDate', 'Không nhập doanh số trong tương lai (UTC+7).')
  if (body.deadline && String(body.deadline) < todayUtc()) add('deadline', 'Hạn học không nằm trong quá khứ (UTC).')
  if (schema.includes('UserRequest')) {
    if (body.username && /\s/.test(String(body.username))) add('username', 'Tên đăng nhập không có khoảng trắng.')
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) add('email', 'Địa chỉ email không hợp lệ.')
    if (body.password && (String(body.password).length < 8 || String(body.password).length > 128)) add('password', 'Mật khẩu 8–128 ký tự.')
    if (['TRAINEE', 'BRANCH_MANAGER'].includes(String(body.role)) && !body.branchId) add('branchId', 'Role này bắt buộc thuộc một chi nhánh.')
    if (body.role && !['TRAINER', 'TRAINEE', 'BRANCH_MANAGER'].includes(String(body.role)) && body.branchId) add('branchId', 'Role văn phòng không gắn chi nhánh.')
  }
  if (body.mediaUrl && !/^https?:\/\//.test(String(body.mediaUrl))) add('mediaUrl', 'Đường dẫn http hoặc https.')
  if (schema === 'CreateCourseRequest' && body.courseType === 'PRODUCT' && !body.recipeVersionId) add('recipeVersionId', 'Khóa sản phẩm phải gắn SOP đã phát hành.')
  if (schema === 'AssignmentRequest' && body.allTrainees !== true && !(Array.isArray(body.employeeIds) && body.employeeIds.length)) add('employeeIds', 'Chọn nhân viên hoặc giao cho toàn bộ học viên.')
  if (schema === 'RepairRequest' && body.mode === 'MANUAL' && !body.patch) add('patch', 'Cần nội dung công thức sửa thủ công.')
  if (schema === 'StepIngredientRequest') {
    if (!body.ingredientId && !body.ingredientCode) add('ingredientId', 'Chọn nguyên liệu.')
    if (n('quantity') !== null && (n('quantity')! > 9999999.999 || Math.abs(n('quantity')! * 1000 - Math.round(n('quantity')! * 1000)) > 0.000001)) add('quantity', 'Tối đa 9.999.999,999 với 3 số thập phân.')
  }
  if (schema === 'StepDependencyRequest' && !body.stepOrder && !body.stepId) add('stepOrder', 'Chọn thứ tự bước phụ thuộc.')
  if (schema === 'RecipeContentRequest' || schema === 'ImportExistingRecipeRequest') {
    const steps = Array.isArray(body.steps) ? body.steps as RecordData[] : []
    if (steps.length > 40) add('steps', 'Công thức tối đa 40 bước.')
    steps.forEach((step, i) => { if (step.stepOrder !== i + 1) add(`steps[${i}].stepOrder`, 'Các bước liên tục từ 1.'); if (Array.isArray(step.dependsOn) && step.dependsOn.some(d => (d as RecordData).stepOrder === step.stepOrder)) add(`steps[${i}].dependsOn`, 'Bước không phụ thuộc chính nó.') })
  }
  if (schema === 'StepDecisionRequest' && body.action === 'EDIT' && !String(body.editedText ?? '').trim()) add('editedText', 'Nhập nội dung chỉnh sửa.')
  if (schema === 'PracticalScheduleRequest' && (!body.scheduledAt || !Number.isFinite(Date.parse(String(body.scheduledAt))) || Date.parse(String(body.scheduledAt)) <= Date.now())) add('scheduledAt', 'Đặt thời gian hợp lệ trong tương lai.')
  if (schema === 'TrainingRegulationRequest' && body.prerequisiteType && body.prerequisiteType === body.courseType) add('prerequisiteType', 'Loại khóa học không là tiên quyết của chính nó.')
  if (schema === 'QuizQuestionRequest' || schema === 'QuestionBankRequest') {
    const options = Array.isArray(body.options) ? body.options as RecordData[] : [], keys = options.map(o => typeof o.key === 'string' ? o.key.trim() : o.key)
    if (body.questionType !== 'TRUE_FALSE' && options.length < 2) add('options', 'Cần ít nhất hai lựa chọn.')
    if (new Set(keys).size !== keys.length) add('options', 'Mã lựa chọn không trùng.')
    if (schema === 'QuizQuestionRequest' && !keys.includes(typeof body.correctOption === 'string' ? body.correctOption.trim() : body.correctOption)) add('correctOption', 'Chọn đáp án từ các mã lựa chọn đã tạo.')
    if (schema === 'QuestionBankRequest') {
      const allowed = body.questionType === 'TRUE_FALSE' ? ['TRUE', 'FALSE'] : keys
      const answers = Array.isArray(body.correctOptions) ? body.correctOptions : []
      if (!answers.length || answers.some(v => !allowed.includes(v))) add('correctOptions', 'Đáp án đúng phải thuộc lựa chọn.')
      if (body.questionType !== 'MULTIPLE_CHOICE' && answers.length !== 1) add('correctOptions', 'Loại câu hỏi này chỉ có một đáp án đúng.')
    }
  }
  if (schema === 'PilotRequest') {
    if (!Array.isArray(body.branchIds) || !body.branchIds.length) add('branchIds', 'Chọn ít nhất một chi nhánh.')
    if (!Array.isArray(body.criteria) || !body.criteria.length) add('criteria', 'Cần ít nhất một tiêu chí.')
    if (n('minCertifiedStaff') !== null && n('minCertifiedStaff')! < 1) add('minCertifiedStaff', 'Cần ít nhất một nhân viên đạt chứng chỉ.')
    if (Array.isArray(body.criteria) && new Set(body.criteria.map(c => (c as RecordData).type)).size !== body.criteria.length) add('criteria', 'Mỗi loại tiêu chí chỉ xuất hiện một lần.')
  }
  if (schema === 'PilotCriterionRequest') {
    if (body.type === 'ABSOLUTE' && !(n('cupsPerDayPerBranch')! > 0 && n('cupsPerDayPerBranch')! <= 100000)) add('cupsPerDayPerBranch', 'Số ly >0 và ≤100.000.')
    if (body.type === 'RELATIVE' && (!body.controlRecipeId || !(n('minPercentOfControl')! > 0 && n('minPercentOfControl')! <= 1000))) add('minPercentOfControl', 'Chọn đồ uống đối chứng và tỷ lệ >0, ≤1000%.')
    if (body.type === 'RETENTION' && (n('maxDropSecondHalfPct') === null || n('maxDropSecondHalfPct')! < 0 || n('maxDropSecondHalfPct')! > 100)) add('maxDropSecondHalfPct', 'Mức giảm từ 0 đến 100%.')
  }
  if (schema === 'BranchAuditRequest' && !(Array.isArray(body.items) && body.items.length)) add('items', 'Cần ít nhất một tiêu chí kiểm định.')
  return issues
}
