import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { endpoints } from '@/services/backend/schema'
import { backendApi, canCall, executeOperation, useExecuteMutation, asRecord, type RecordData } from '@/services/backend/operations'
import { normalizeApiError, type ApiError } from '@/services/apiError'
import { validateRequest, type FieldIssue } from '@/services/backend/validation'
import type { ActionSpec } from '@/features/workspace/resources'
import { ContractFields, type FormContext } from './ContractForm'
import { courseReadiness } from '@/services/backend/authoringRules'
import { mutationTags } from '@/services/backend/cachePolicy'
import { formDefaults } from '@/services/backend/formValues'
import { confinedBranch } from '@/services/backend/learningFlow'
import { ErrorState, Notice } from './AsyncState'
import { DataView } from './DataView'

export function ActionDialog({ action, record = {}, initial, context = {}, onClose, onSuccess, onFailure, disabledReason }: { action: ActionSpec; record?: RecordData; initial?: RecordData; context?: FormContext; onClose: () => void; onSuccess?: (data: unknown) => void; onFailure?: (error: ApiError) => void; disabledReason?: string }) {
  const user = useAppSelector(s => s.auth.user), dispatch = useAppDispatch(), endpoint = endpoints[action.operation]
  const [body, setBody] = useState<RecordData>(() => {
    const defaults = endpoint.body ? formDefaults(endpoint.body) : {}
    return { ...defaults, ...(['AssignmentRequest', 'SalesRecordRequest', 'TrainingClassRequest', 'BranchAuditRequest'].includes(endpoint.body ?? '') && user?.branchId ? { branchId: Number(user.branchId) } : {}), ...initial, ...action.initial?.(record), ...(confinedBranch(user) && 'branchId' in defaults ? { branchId: confinedBranch(user) } : {}) }
  })
  const [issues, setIssues] = useState<FieldIssue[]>([]), [upload, setUpload] = useState<File | null>(null), [progress, setProgress] = useState(0), [uploading, setUploading] = useState(false), [error, setError] = useState<unknown>(null), [result, setResult] = useState<unknown>(undefined)
  const submitting = useRef(false)
  const key = useRef(crypto.randomUUID()), [mutate, mutation] = useExecuteMutation()
  const [extra, setExtra] = useState<string>('')
  const busy = mutation.isLoading || uploading
  const dialog = useRef<HTMLElement>(null), close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLElement>('button,input,select,textarea')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) close.current()
      if (event.key !== 'Tab') return
      const elements = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]') ?? [])]
      const first = elements[0], last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); previous?.focus() }
  }, [busy])
  const needsCourse = action.operation === 'QuestionBank.AddToCourse'
  const params = action.params?.(record) ?? (action.operation === 'Settings.Update' ? { key: String(record.key) } : { id: Number(record.id ?? record.enrollmentId) })
  const maxBytes = action.operation === 'Enrollments.UploadPracticalVideo' ? 200 * 1024 * 1024 : 5 * 1024 * 1024
  const accept = action.operation === 'Enrollments.UploadPracticalVideo' ? '.mp4,.mov,.webm' : action.operation === 'BranchAudits.UploadEvidence' ? '.jpg,.jpeg,.png,.webp' : '.csv,.xlsx'
  const blocked = action.operation === 'CorrectiveActions.AssignRetraining' && !context.retrainingCourseIds?.length || !!disabledReason
  async function submit() {
    if (submitting.current || busy) return
    setError(null)
    let checked = endpoint.body ? validateRequest(endpoint.body, body, context.creating) : []
    if (action.operation === 'CorrectiveActions.AssignRetraining' && !context.retrainingCourseIds?.includes(Number(body.courseId))) checked.push({ field: 'courseId', issue: 'Chọn khóa đã công bố từ danh sách học lại hợp lệ của action.' })
    if (action.operation === 'Courses.Submit' && Array.isArray(record.modules)) checked.push(...courseReadiness(record))
    if (action.operation === 'Settings.Update') {
      const value = String(body.value ?? '').trim()
      if (record.key === 'audit.pass_mark' && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100)) checked.push({ field: 'value', issue: 'Ngưỡng đạt phải là số nguyên từ 1 đến 100.' })
      if (record.key === 'company.name' && (!value || value.length > 120)) checked.push({ field: 'value', issue: 'Tên công ty 1–120 ký tự.' })
    }
    if (needsCourse && !extra) checked = [{ field: 'courseId', issue: 'Chọn khóa học để sao chép câu hỏi.' }]
    setIssues(checked)
    if (checked.length || blocked) return
    submitting.current = true
    try {
      let data: unknown
      if (endpoint.upload) {
        if (!upload || upload.size === 0 || upload.size > maxBytes || !accept.split(',').includes('.' + upload.name.split('.').at(-1)?.toLowerCase())) throw new Error(`Chọn tệp hợp lệ, không rỗng, tối đa ${maxBytes / 1024 / 1024} MB (${accept}).`)
        const form = new FormData(); form.append('file', upload)
        setUploading(true)
        data = await executeOperation(action.operation, { params, body: form, idempotencyKey: endpoint.idempotency ? key.current : undefined }, { onUploadProgress: event => setProgress(event.total ? Math.round(event.loaded / event.total * 100) : 0) })
        dispatch(backendApi.util.invalidateTags(mutationTags(action.operation)))
      } else data = await mutate({ operation: action.operation, params: { ...params, ...(needsCourse ? { courseId: Number(extra) } : {}) }, body: endpoint.body ? body : undefined, idempotencyKey: endpoint.idempotency ? key.current : undefined }).unwrap()
      setResult(data ?? null); onSuccess?.(data)
    } catch (e) { const normalized = normalizeApiError(e); setError(normalized); onFailure?.(normalized) } finally { submitting.current = false; setUploading(false) }
  }
  return <div className="modal-backdrop"><section ref={dialog} className="dialog" role="dialog" aria-modal="true" aria-labelledby="action-title"><header><h2 id="action-title">{action.label}</h2><Button variant="ghost" aria-label="Đóng" disabled={busy} onClick={onClose}><X size={20} /></Button></header><div className="dialog-body">{result !== undefined ? <><div className="success-box" role="status">Máy chủ đã xử lý yêu cầu.</div>{result !== null && <DataView value={result} />}</> : <form id="action-form" onSubmit={e => { e.preventDefault(); void submit() }}><fieldset disabled={busy} className="min-w-0">
    {action.note && <Notice>{action.note}</Notice>}{blocked && <Notice>{disabledReason ?? 'Thiếu dữ liệu lookup hợp lệ cho thao tác này. Không dùng lịch sử chứng chỉ thay roster active.'}</Notice>}
    {action.danger && <Notice>Thao tác này thay đổi trạng thái tài nguyên. Kiểm tra thông tin trước khi xác nhận.</Notice>}
    {endpoint.body && !blocked && <ContractFields schema={endpoint.body} value={body} onChange={setBody} context={{ ...context, peopleRoles: ['AssignmentRequest', 'OpenClassRequest'].includes(endpoint.body) ? ['TRAINEE', 'TRAINER'] : context.peopleRoles, readOnly: [...(context.readOnly ?? []), ...(endpoint.body === 'UpdateUserRequest' ? ['username'] : [])] }} issues={issues} />}
    {needsCourse && <ContractFields schema="RetrainingRequest" value={{ courseId: extra ? Number(extra) : null }} onChange={v => setExtra(String(v.courseId ?? ''))} issues={issues} />}
    {endpoint.upload && <div className="form-field"><label htmlFor="upload-file">Tệp ({accept}; tối đa {maxBytes / 1024 / 1024} MB)</label><input id="upload-file" type="file" accept={accept} onChange={e => { setUpload(e.target.files?.[0] ?? null); setError(null); key.current = crypto.randomUUID() }} />{uploading && <div role="status"><progress value={progress} max={100} /> Đang tải lên {progress}%</div>}</div>}
    {issues.length > 0 && <ul role="alert" className="field-error">{issues.map((i, n) => <li key={n}>{i.field}: {i.issue}</li>)}</ul>}
    {error !== null && <ErrorState error={asRecord(error).message ? error : normalizeApiError(error)} />}
    {!canCall(action.operation, user?.role) && <Notice>Bạn không có quyền thực hiện thao tác này.</Notice>}
    </fieldset></form>}</div><footer><Button variant="outline" disabled={busy} onClick={onClose}>{result !== undefined ? 'Đóng' : 'Hủy'}</Button>{result === undefined && !blocked && <Button type="submit" form="action-form" disabled={busy || !canCall(action.operation, user?.role)}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button>}</footer></section></div>
}
