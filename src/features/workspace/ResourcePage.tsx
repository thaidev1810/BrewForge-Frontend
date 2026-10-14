import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState, ErrorState, Notice } from '@/components/common/AsyncState'
import { DataTable, DataView } from '@/components/common/DataView'
import { display } from '@/components/common/presentation'
import { ActionDialog } from '@/components/common/ActionDialog'
import { type FormContext } from '@/components/common/ContractForm'
import { requestFields } from '@/services/backend/formValues'
import { ResourcePicker } from '@/components/common/ContractForm'
import { endpoints } from '@/services/backend/schema'
import { canCall, asRecord, useReadQuery, type RecordData } from '@/services/backend/operations'
import { resourceByKey, type ActionSpec, type Filter } from './resources'
import { RecipeSections, CourseSections, ClassSections, PilotSections, AuditEvidence, AssignmentActions } from './sections'
export function FilterBar({ filters, initial = {}, onApply }: { filters: Filter[]; initial?: RecordData; onApply: (query: RecordData) => void }) {
  const [values, setValues] = useState<RecordData>(initial), [error, setError] = useState('')
  return <form className="filter-bar" onSubmit={e => { e.preventDefault(); if (values.from && values.to && String(values.from) > String(values.to)) { setError('Ngày bắt đầu không sau ngày kết thúc.'); return } setError(''); onApply(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '' && v !== null && v !== undefined))) }}><div className="filter-fields">{filters.map(f => <div className="form-field" key={f.name}><label htmlFor={'filter-' + f.name}>{f.label}</label>{f.options ? <select id={'filter-' + f.name} value={String(values[f.name] ?? '')} onChange={e => setValues({ ...values, [f.name]: e.target.value })}><option value="">Tất cả</option>{f.options.map(o => <option key={o} value={o}>{display(o)}</option>)}</select> : <Input id={'filter-' + f.name} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'search'} min={f.type === 'number' ? 1 : undefined} value={String(values[f.name] ?? '')} onChange={e => setValues({ ...values, [f.name]: f.type === 'number' ? e.target.value ? Number(e.target.value) : null : e.target.value })} />}</div>)}</div><Button variant="outline" type="submit"><Search size={16} />Áp dụng</Button>{error && <p className="field-error" role="alert">{error}</p>}</form>
}
export function ReferenceFilter({ field, value, onChange }: { field: string; value: unknown; onChange: (value: unknown) => void }) {
  return <ResourcePicker field={field} value={value} onChange={onChange} />
}
export function ResourcePage({ resource }: { resource: string }) {
  const spec = resourceByKey[resource], user = useAppSelector(s => s.auth.user), navigate = useNavigate(), { id } = useParams(), location = useLocation()
  const [filters, setFilters] = useState<RecordData>({}), [page, setPage] = useState(1), [size, setSize] = useState(20), [sort, setSort] = useState('')
  const [selected, setSelected] = useState<RecordData | null>(null), [action, setAction] = useState<ActionSpec | null>(null)
  const detailAllowed = !!spec?.detail && canCall(spec.detail, user?.role)
  const paging = spec ? endpoints[spec.list].query.some(q => q.name === 'page') : false
  const result = useReadQuery(id && spec?.detail && detailAllowed ? { operation: spec.detail, params: { id: Number(id) } } : { operation: spec.list, query: { ...filters, ...(paging ? { page, size, ...(sort ? { sort } : {}) } : {}) } }, { skip: !spec || !user || !canCall(id && spec.detail ? spec.detail : spec.list, user.role) })
  if (!spec || !user) return null
  if (!canCall(id && spec.detail ? spec.detail : spec.list, user.role)) return <Notice>Bạn không có quyền đọc màn hình này.</Notice>
  const record = id ? asRecord(result.data) : selected ?? {}, isDetail = !!id || selected !== null
  const itemId = record.id ?? record[spec.rowKey ?? 'id']
  const prefix = roleConfig[user.role].prefix
  const heading = isDetail ? String(record.name ?? record.title ?? record.fullName ?? record.courseTitle ?? spec.title) : spec.title
  const writable = !(resource === 'classes' && record.state !== 'PLANNED' || resource === 'pilots' && record.state !== 'DRAFT')
  const context: FormContext = { courseId: Number(record.courseId ?? (resource === 'courses' ? record.id : undefined)) || undefined, recipeId: Number(record.recipeId ?? (resource === 'recipes' ? record.id : undefined)) || undefined, branchId: Number(record.branchId) || undefined, readOnly: !isDetail ? [] : resource === 'users' ? ['username'] : resource === 'branches' ? ['branchCode'] : resource === 'ingredients' ? ['ingredientCode'] : resource === 'equipment' ? ['equipmentCode', 'equipmentClass'] : resource === 'categories' ? ['kind', 'code'] : resource === 'products' ? ['productCode'] : [] }
  const initial = action && endpoints[action.operation].body ? requestFields(endpoints[action.operation].body!, action.operation === spec.update ? record : {}) : undefined
  function open(row: RecordData) {
    if (spec.detail && canCall(spec.detail, user?.role)) navigate(`${prefix}/${resource}/${row.id}`)
    else setSelected(row)
  }
  return <>
    {isDetail && <Button variant="ghost" className="mb-4" onClick={() => { if (id) navigate(prefix + '/' + resource); else setSelected(null) }}>← {spec.title}</Button>}
    <PageHeader title={heading} description={spec.description} action={<div className="flex gap-2"><Button variant="outline" onClick={() => void result.refetch()} aria-label="Tải lại"><RefreshCw size={16} /></Button>{!isDetail && spec.create && canCall(spec.create, user.role) && <Button onClick={() => setAction({ operation: spec.create!, label: 'Tạo ' + spec.title.toLowerCase() })}><Plus size={16} />Thêm mới</Button>}</div>} />
    {spec.notice && <Notice>{spec.notice}</Notice>}
    {!isDetail && spec.filters?.length ? <FilterBar filters={spec.filters.filter(f => user.role !== 'BRANCH_MANAGER' && user.role !== 'TRAINEE' || f.name !== 'branchId')} onApply={q => { setFilters(q); setPage(1) }} /> : null}
    {result.isFetching ? <LoadingState /> : result.error ? <ErrorState error={result.error} retry={() => void result.refetch()} /> : isDetail ? <>
      <div className="action-bar">{spec.update && writable && canCall(spec.update, user.role) && <Button variant="outline" onClick={() => setAction({ operation: spec.update!, label: 'Cập nhật ' + spec.title.toLowerCase() })}>Chỉnh sửa</Button>}{spec.actions?.filter(a => canCall(a.operation, user.role) && (!a.gate || a.gate(record, Number(user.id)))).map(a => <Button variant={a.danger ? 'outline' : 'default'} key={a.operation} onClick={() => setAction(a)}>{a.label}</Button>)}</div>
      <div className="panel"><DataView value={record} /></div>
      {resource === 'recipes' && <RecipeSections record={record} />}
      {resource === 'courses' && <CourseSections record={record} />}
      {resource === 'classes' && <ClassSections record={record} />}
      {resource === 'pilots' && <PilotSections record={record} />}
      {resource === 'branch-audits' && <AuditEvidence record={record} />}
      {resource === 'assignments' && <AssignmentActions record={record} />}
      {resource === 'agenda' && <Button variant="outline" onClick={() => navigate(`${prefix}/assessment/${record.enrollmentId}`)}>Xem học viên & đánh giá thực hành</Button>}
    </> : <>
      {paging && <div className="list-toolbar"><span className="muted">{Number(asRecord(result.data).total ?? 0).toLocaleString('vi-VN')} mục</span><div className="flex items-center gap-3"><label htmlFor="sort">Sắp xếp</label><select id="sort" value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}><option value="">Mặc định</option>{spec.sort?.flatMap(f => [<option key={f + 'asc'} value={f + ',asc'}>{display(f)} ↑</option>, <option key={f + 'desc'} value={f + ',desc'}>{display(f)} ↓</option>])}</select></div></div>}
      <DataTable data={result.data} columns={spec.columns} onRow={open} />
      {paging && <div className="pagination"><select aria-label="Số dòng mỗi trang" value={size} onChange={e => { setSize(Number(e.target.value)); setPage(1) }}>{[20, 50, 100].map(n => <option key={n} value={n}>{n} dòng</option>)}</select><span>Trang {page} / {Math.max(1, Math.ceil(Number(asRecord(result.data).total ?? 0) / size))}</span><Button variant="outline" aria-label="Trang trước" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></Button><Button variant="outline" aria-label="Trang sau" disabled={page * size >= Number(asRecord(result.data).total ?? 0)} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></Button></div>}
      {resource === 'recipes' && canCall('Recipes.ImportExisting', user.role) && <Button className="mt-6" variant="outline" onClick={() => setAction({ operation: 'Recipes.ImportExisting', label: 'Nhập công thức hiện có', note: 'Nhập các bước từ tài liệu hiện có. Công thức bắt đầu ở trạng thái nháp và cần kiểm tra, phát hành.' })}>Nhập công thức hiện có</Button>}
      {resource === 'sales' && canCall('Sales.Import', user.role) && <Button className="mt-6" variant="outline" onClick={() => setAction({ operation: 'Sales.Import', label: 'Nhập doanh số POS', note: 'CSV/XLSX theo thứ tự branch_code, drink_code, trading_date, quantity. drink_code là mã công thức. Dòng hợp lệ có thể thay số liệu đã tồn tại; dòng lỗi được báo riêng.' })}>Nhập CSV / XLSX</Button>}
    </>}
    {action && <ActionDialog key={action.operation + String(id ?? itemId ?? '') + location.pathname} action={action} record={record} initial={initial} context={{ ...context, creating: !isDetail }} onClose={() => setAction(null)} onSuccess={data => { if (!id && selected && data && typeof data === 'object' && !Array.isArray(data) && (asRecord(data).id !== undefined || asRecord(data).key !== undefined)) setSelected(asRecord(data)); void result.refetch() }} />}
  </>
}
