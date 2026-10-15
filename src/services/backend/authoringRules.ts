import { asRecord, type RecordData } from './operations'
import type { FieldIssue } from './validation'
export function changeQuestionField(schema: string, value: RecordData, field: string, nextValue: unknown): RecordData {
  if (schema === 'QuizOptionRequest' && field === 'key' && typeof nextValue === 'string') nextValue = nextValue.trim()
  const next = { ...value, [field]: nextValue }
  if (!['QuizQuestionRequest', 'QuestionBankRequest'].includes(schema)) return next
  const keys = (Array.isArray(next.options) ? next.options : []).map(o => asRecord(o).key).filter(k => typeof k === 'string' && k.trim())
  if (schema === 'QuizQuestionRequest' && !keys.includes(next.correctOption)) next.correctOption = null
  if (schema === 'QuestionBankRequest') {
    const allowed = next.questionType === 'TRUE_FALSE' ? ['TRUE', 'FALSE'] : keys
    next.correctOptions = (Array.isArray(next.correctOptions) ? next.correctOptions : []).filter(k => allowed.includes(k))
  }
  return next
}
export function courseReadiness(course: RecordData): FieldIssue[] {
  const issues: FieldIssue[] = [], modules = Array.isArray(course.modules) ? course.modules.map(asRecord) : []
  for (const m of modules) {
    const path = `modules[${m.moduleType}]`, lessons = Array.isArray(m.lessons) ? m.lessons.map(asRecord) : []
    if (!lessons.length) issues.push({ field: path, issue: 'Chưa có bài học.' })
    if (m.source !== 'GENERATED') lessons.forEach(l => { if (!String(l.content ?? '').trim()) issues.push({ field: `${path}.lessons[${l.id}].content`, issue: `Bài “${l.title}” thiếu nội dung giảng viên. Tham chiếu SOP không thay thế phần này.` }) })
    if (!(typeof m.durationMinutes === 'number' && m.durationMinutes > 0)) issues.push({ field: path + '.durationMinutes', issue: 'Chưa thiết lập thời lượng phút lớn hơn 0.' })
    if (m.state === 'NEEDS_REVIEW') issues.push({ field: path, issue: 'Cần rà soát sau cập nhật SOP.' })
  }
  const quiz = asRecord(course.quiz)
  if (!(Number(quiz.questionCount) > 0)) issues.push({ field: 'quiz', issue: 'Bài kiểm tra chưa có câu hỏi.' })
  if (!Array.isArray(course.practicalChecklist) || !course.practicalChecklist.length) issues.push({ field: 'practicalChecklist', issue: 'Checklist thực hành phải có ít nhất một mục.' })
  return issues
}
