import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { schemas, enumValues } from '@/services/backend/schema'
import { asRecord, rowsOf, canCall, useReadQuery, type OperationCall, type RecordData } from '@/services/backend/operations'
import { fieldLimit, requiredField, type FieldIssue } from '@/services/backend/validation'
import { label, display } from './presentation'
import { ErrorState } from './AsyncState'
import { EvidenceInput } from './EvidenceInput'
export interface Choice { value: string | number; label: string }
export interface FormContext { courseId?: number; recipeId?: number; branchId?: number; enrollmentId?: number; choices?: Record<string, Choice[]>; readOnly?: string[]; creating?: boolean }
import { fieldsFor, formDefaults, type SchemaField } from '@/services/backend/formValues'
function IdPicker({ field, value, onChange, context, multiple = false, root }: { field: string; value: unknown; onChange: (v: unknown) => void; context: FormContext; multiple?: boolean; root: RecordData }) {
  const user = useAppSelector(s => s.auth.user)
  const [search, setSearch] = useState(''), [page, setPage] = useState(1), [recipe, setRecipe] = useState<number | undefined>(context.recipeId ?? (Number(root.recipeId) || undefined))
  let call: OperationCall | undefined
  const branchId = Number(root.branchId ?? context.branchId ?? user?.branchId) || undefined
  if (['branchId', 'branchIds'].includes(field)) call = { operation: 'Branches.List', query: { q: search, page, size: 100 } }
  if (['recipeId', 'controlRecipeId'].includes(field)) call = user?.role === 'BRANCH_MANAGER' && field === 'recipeId' ? { operation: 'Sales.Drinks', query: { branchId, tradingDate: root.tradingDate ?? undefined } } : { operation: 'Recipes.List', query: { q: search, page, size: 100 } }
  if (field === 'ingredientId') call = { operation: 'Ingredients.List', query: { q: search, page, size: 100, status: 'ACTIVE' } }
  if (field === 'equipmentId') call = { operation: 'EquipmentClasses.List', query: { q: search, page, size: 100 } }
  if (field === 'categoryId') call = { operation: 'Categories.List', query: { q: search, kind: 'DRINK', status: 'ACTIVE', page, size: 100 } }
  if (field === 'courseId') call = { operation: 'Courses.List', query: { q: search, page, size: 100 } }
  if (['employeeIds', 'traineeIds', 'userId'].includes(field)) call = { operation: 'Skills.Employees', query: { branchId } }
  if (['courseModuleId', 'moduleIds'].includes(field) && context.courseId) call = { operation: 'Courses.Modules', params: { id: context.courseId } }
  if (['recipeVersionId', 'copyFromVersionId'].includes(field) && recipe) call = { operation: 'Recipes.ListVersions', params: { id: recipe } }
  const data = useReadQuery(call ?? { operation: 'Branches.List' }, { skip: !call || !canCall(call.operation, user?.role) || !!context.choices?.[field] })
  const recipes = useReadQuery({ operation: 'Recipes.List', query: { q: search, page, size: 100 } }, { skip: !['recipeVersionId', 'copyFromVersionId'].includes(field) || !canCall('Recipes.List', user?.role) || !!context.choices?.[field] || !!context.recipeId })
  let choices = context.choices?.[field] ?? rowsOf(data.data).filter(r => field !== 'recipeVersionId' || r.state === 'RELEASED').map(r => ({ value: Number(r.id ?? r.userId ?? r.recipeId), label: [r.name ?? r.fullName ?? r.title ?? r.equipmentClass ?? r.actionText ?? r.moduleType ?? (r.versionNo ? `v${r.versionNo}` : undefined), r.recipeCode ?? r.branchCode, r.state].filter(Boolean).map(display).join(' · ') }))
  if (field === 'trainerId' && user) choices = [{ value: Number(user.id), label: `${user.name} (bạn)` }]
  if (value !== null && value !== undefined && value !== '' && !multiple && !choices.some(c => String(c.value) === String(value))) choices = [{ value: String(value), label: `Tham chiếu hiện tại #${value}` }, ...choices]
  const selection = multiple ? (Array.isArray(value) ? value.map(String) : []) : String(value ?? '')
  return <div className="lookup-control">
    {['recipeVersionId', 'copyFromVersionId'].includes(field) && !context.choices?.[field] && !context.recipeId && <select aria-label="Chọn công thức để xem phiên bản" value={recipe ?? ''} onChange={e => { setRecipe(Number(e.target.value) || undefined); onChange(null) }}><option value="">Chọn công thức…</option>{rowsOf(recipes.data).map(r => <option key={String(r.id)} value={Number(r.id)}>{display(r.name)} · {display(r.recipeCode)}</option>)}</select>}
    {call && endpointsSearchable(call.operation) && !context.choices?.[field] && <div className="flex gap-2"><Input aria-label={`Tìm ${label(field)}`} placeholder={`Tìm ${label(field).toLowerCase()}…`} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /><Button type="button" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button><Button type="button" variant="outline" disabled={rowsOf(data.data).length < 100 && !['recipeVersionId', 'copyFromVersionId'].includes(field)} onClick={() => setPage(p => p + 1)}>›</Button></div>}
    <select multiple={multiple} value={selection} disabled={data.isFetching || context.readOnly?.includes(field)} onChange={e => onChange(multiple ? [...e.target.selectedOptions].map(o => Number(o.value)) : e.target.value ? Number(e.target.value) : null)} aria-label={label(field)}>{!multiple && <option value="">{data.isFetching ? 'Đang tải…' : 'Chọn…'}</option>}{choices.map(c => <option key={String(c.value)} value={c.value}>{c.label}</option>)}</select>
    {multiple && <p className="field-help">Có thể chọn nhiều mục (Ctrl/⌘ hoặc thao tác chọn trên điện thoại).</p>}
    {field === 'trainerId' && <p className="field-help">Chỉ chọn được chính bạn; hệ thống chưa cung cấp danh sách giảng viên.</p>}
    {call && !canCall(call.operation, user?.role) && <p className="field-error">Tài khoản này chưa được cấp API danh sách tương ứng; không thể chọn mới.</p>}
    {data.error && <ErrorState error={data.error} retry={() => void data.refetch()} />}
  </div>
}
export function ResourcePicker({ field, value, onChange, context = {}, root = {}, multiple = false }: { field: string; value: unknown; onChange: (value: unknown) => void; context?: FormContext; root?: RecordData; multiple?: boolean }) {
  return <IdPicker field={field} value={value} onChange={onChange} context={context} root={root} multiple={multiple} />
}
function endpointsSearchable(operation: string) { return ['Branches.List', 'Recipes.List', 'Products.List', 'Courses.List', 'Categories.List', 'Ingredients.List', 'EquipmentClasses.List'].includes(operation) }
function EquipmentPicker({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [q, setQ] = useState(''), [page, setPage] = useState(1)
  const data = useReadQuery({ operation: 'EquipmentClasses.List', query: { q, page, size: 100, status: 'ACTIVE' } }), rows = rowsOf(data.data)
  return <><div className="flex gap-2"><Input aria-label="Tìm thiết bị" placeholder="Tìm nhóm thiết bị…" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} /><Button type="button" variant="outline" disabled={page === 1 || data.isFetching} onClick={() => setPage(p => p - 1)}>‹</Button><Button type="button" variant="outline" disabled={page * 100 >= Number(asRecord(data.data).total ?? 0) || data.isFetching} onClick={() => setPage(p => p + 1)}>›</Button></div><select value={String(value ?? '')} disabled={data.isFetching} aria-label="Nhóm thiết bị" onChange={e => onChange(e.target.value || null)}><option value="">Không dùng thiết bị</option>{value && !rows.some(r => r.equipmentClass === value) ? <option value={String(value)}>{display(value)} (đã chọn)</option> : null}{rows.map(r => <option key={String(r.id)} value={String(r.equipmentClass)}>{display(r.equipmentClass)}</option>)}</select>{data.error && <ErrorState error={data.error} retry={() => void data.refetch()} />}</>
}
function StringArray({ value, onChange, field }: { value: unknown; onChange: (v: unknown) => void; field: string }) {
  const values = Array.isArray(value) ? value : []
  return <div className="space-y-2">{values.map((item, i) => <div className="flex gap-2" key={i}><Input value={String(item)} aria-label={`${label(field)} ${i + 1}`} onChange={e => onChange(values.map((v, n) => n === i ? e.target.value : v))} /><Button type="button" variant="outline" aria-label="Bỏ mục" onClick={() => onChange(values.filter((_, n) => n !== i))}><Trash2 size={14} /></Button></div>)}<Button type="button" variant="outline" onClick={() => onChange([...values, ''])}><Plus size={14} />Thêm mục</Button></div>
}
function FieldControl({ field, schema, value, onChange, context, root, path, issues }: { field: SchemaField; schema: string; value: unknown; onChange: (v: unknown) => void; context: FormContext; root: RecordData; path: string; issues: FieldIssue[] }) {
  const type = field.type.replace(/\?$/, ''), array = type.match(/^IReadOnlyList<(.+)>$/)
  if (field.name === 'evidenceUrl') return <EvidenceInput value={value} onChange={onChange} />
  if (array) {
    if (array[1] === 'long') return <IdPicker field={field.name} value={value} onChange={onChange} context={context} multiple root={root} />
    if (array[1] === 'string') return <StringArray field={field.name} value={value} onChange={onChange} />
    const rows = Array.isArray(value) ? value : []
    return <div className="nested-form space-y-3">{rows.map((row, i) => <fieldset key={i} className="nested-card"><legend>{label(field.name)} {i + 1}</legend><ContractFields schema={array[1]} value={asRecord(row)} onChange={v => onChange(rows.map((r, n) => n === i ? v : r))} context={context} root={root} prefix={`${path}[${i}].`} issues={issues} /><Button type="button" variant="outline" className="mt-3" onClick={() => onChange(rows.filter((_, n) => n !== i))}><Trash2 size={14} />Bỏ mục</Button></fieldset>)}<Button type="button" variant="outline" onClick={() => { const item = formDefaults(array[1]); if (array[1] === 'StepRequest') item.stepOrder = rows.length + 1; onChange([...rows, item]) }}><Plus size={14} />Thêm {label(field.name).toLowerCase()}</Button></div>
  }
  if (type in schemas) return <div className="nested-card"><ContractFields schema={type} value={asRecord(value)} onChange={onChange} context={context} root={root} prefix={path + '.'} issues={issues} /></div>
  const enums = enumValues[type as keyof typeof enumValues] as readonly string[] | undefined
  if (enums) return <select id={path} value={String(value ?? '')} onChange={e => onChange(e.target.value || null)} disabled={context.readOnly?.includes(field.name)}><option value="">Chọn…</option>{enums.map(v => <option value={v} key={v}>{display(v)}</option>)}</select>
  if (field.name === 'entityType') return <select id={path} value={String(value ?? '')} onChange={e => onChange(e.target.value || null)}><option value="">Chọn tài nguyên</option>{['Ingredient', 'StandardEquipment', 'RecipeVersion'].map(v => <option key={v} value={v}>{v === 'Ingredient' ? 'Nguyên liệu' : v === 'StandardEquipment' ? 'Thiết bị' : 'Phiên bản SOP'}</option>)}</select>
  if (field.name === 'equipmentClass' && schema === 'StepRequest') return <EquipmentPicker value={value} onChange={onChange} />
  if (type === 'long' && field.name.endsWith('Id') && !['stepId', 'recipeStepId', 'lessonId', 'questionId', 'practicalVideoId', 'enrollmentId', 'entityId'].includes(field.name) || context.choices?.[field.name]) return <IdPicker field={field.name} value={value} onChange={onChange} context={context} root={root} />
  if (field.name === 'entityId' && root.entityType) {
    const target = root.entityType === 'Ingredient' ? 'ingredientId' : root.entityType === 'RecipeVersion' ? 'recipeVersionId' : 'equipmentId'
    if (target !== 'equipmentId') return <IdPicker field={target} value={value} onChange={onChange} context={context} root={root} />
    return <EquipmentIdPicker value={value} onChange={onChange} />
  }
  if (type === 'bool') return <select id={path} value={value === null || value === undefined ? '' : value ? 'true' : 'false'} onChange={e => onChange(e.target.value === '' ? null : e.target.value === 'true')}><option value="">Mặc định</option><option value="true">Có / Đạt</option><option value="false">Không / Không đạt</option></select>
  if (['content', 'description', 'actionText', 'questionText', 'editedText', 'comment', 'note', 'reason'].includes(field.name)) return <textarea id={path} rows={3} maxLength={fieldLimit(schema, field.name)} value={String(value ?? '')} onChange={e => onChange(e.target.value || null)} />
  const inputType = field.name === 'password' ? 'password' : field.name === 'email' ? 'email' : type === 'DateOnly' ? 'date' : type === 'TimeOnly' ? 'time' : type === 'DateTimeOffset' ? 'datetime-local' : ['int', 'long', 'decimal'].includes(type) ? 'number' : 'text'
  const localTime = inputType === 'datetime-local' && value ? new Date(Date.parse(String(value)) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined
  return <Input id={path} type={inputType} step={type === 'decimal' ? '0.001' : type === 'TimeOnly' ? '60' : '1'} value={localTime ?? String(value ?? '')} maxLength={fieldLimit(schema, field.name)} disabled={context.readOnly?.includes(field.name)} onChange={e => onChange(e.target.value === '' ? null : inputType === 'number' ? Number(e.target.value) : inputType === 'datetime-local' ? new Date(e.target.value).toISOString() : e.target.value)} />
}
function EquipmentIdPicker({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  return <IdPicker field="equipmentId" value={value} onChange={onChange} context={{}} root={{}} />
}
export function ContractFields({ schema, value, onChange, context = {}, root = value, prefix = '', issues = [] }: { schema: string; value: RecordData; onChange: (v: RecordData) => void; context?: FormContext; root?: RecordData; prefix?: string; issues?: FieldIssue[] }) {
  let fields = fieldsFor(schema)
  if (schema === 'RepairRequest' && value.mode !== 'MANUAL') fields = fields.filter(f => f.name !== 'patch')
  if (schema === 'StepIngredientRequest') fields = fields.filter(f => f.name !== 'ingredientCode')
  if (schema === 'StepDependencyRequest') fields = fields.filter(f => f.name !== 'stepId')
  if (schema === 'QuestionBankRequest' && value.questionType === 'TRUE_FALSE') fields = fields.filter(f => f.name !== 'options')
  if (schema === 'StepDecisionRequest' && value.action !== 'EDIT') fields = fields.filter(f => f.name !== 'editedText')
  if (schema === 'PilotCriterionRequest') fields = fields.filter(f => f.name === 'type' || value.type === 'ABSOLUTE' && f.name === 'cupsPerDayPerBranch' || value.type === 'RELATIVE' && ['controlRecipeId', 'minPercentOfControl'].includes(f.name) || value.type === 'RETENTION' && f.name === 'maxDropSecondHalfPct')
  return <div className="form-grid">{fields.map(field => { const path = prefix + field.name, arrayOrRecord = field.type.startsWith('IReadOnlyList') || field.type.replace(/\?$/, '') in schemas
    return <div key={path} className={arrayOrRecord || ['content', 'description', 'actionText', 'comment'].includes(field.name) ? 'form-field span-full' : 'form-field'}><label htmlFor={path}>{label(field.name)}{requiredField(schema, field.name, context.creating) && <span aria-label="bắt buộc"> *</span>}</label><FieldControl field={field} schema={schema} value={value[field.name]} onChange={v => { const next = { ...value, [field.name]: v }; if (schema === 'PilotCriterionRequest' && field.name === 'type') Object.assign(next, { cupsPerDayPerBranch: null, controlRecipeId: null, minPercentOfControl: null, maxDropSecondHalfPct: null }); if (schema.includes('UserRequest') && field.name === 'role' && !['TRAINEE', 'BRANCH_MANAGER', 'TRAINER'].includes(String(v))) next.branchId = null; onChange(next) }} context={context} root={root} path={path} issues={issues} />{issues.filter(i => i.field === path).map((i, n) => <p className="field-error" key={n}>{i.issue}</p>)}</div>
  })}</div>
}
