import { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { asRecord, canCall, rowsOf, useReadQuery } from '@/services/backend/operations'
import type { FormContext } from './ContractForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorState } from './AsyncState'
import { display, label } from './presentation'
import { mergePeopleSelection } from '@/services/backend/lookupRules'
import { confinedBranch } from '@/services/backend/learningFlow'

export function PeoplePicker({ field, value, onChange, context, multiple = false }: { field: string; value: unknown; onChange: (v: unknown) => void; context: FormContext; multiple?: boolean }) {
  const user = useAppSelector(s => s.auth.user)
  const trainer = field === 'trainerId', operation = trainer ? 'Courses.EligibleTrainers' : 'UserLookup.Lookup'
  const allowed = canCall(operation, user?.role) && (!trainer || !!context.courseId)
  const [search, setSearch] = useState(''), [q, setQ] = useState(''), [page, setPage] = useState(1), [role, setRole] = useState('')
  const [savedLabels, setSavedLabels] = useState<Record<string, string>>({})
  useEffect(() => { const timer = setTimeout(() => { setQ(search); setPage(1) }, 300); return () => clearTimeout(timer) }, [search])
  const data = useReadQuery(trainer ? { operation, params: { id: context.courseId! } } : { operation, query: { q, role: role || undefined, branchId: confinedBranch(user) ?? context.branchId, page, size: 20, includeInactive: false, sort: 'fullName,asc' } }, { skip: !allowed })
  const rows = rowsOf(data.currentData)
  const choices = rows.map(r => ({ value: Number(r.id), label: [r.fullName, r.role, r.branchName ?? (r.branchId ? `Chi nhánh #${r.branchId}` : ''), trainer && r.eligible === false ? `Không đủ điều kiện: ${r.reason}` : ''].filter(Boolean).map(display).join(' · '), disabled: trainer ? r.eligible !== true : !!context.peopleRoles && !context.peopleRoles.includes(String(r.role)) }))
  const selected = multiple ? (Array.isArray(value) ? value.map(String) : []) : value ? [String(value)] : []
  const missing = selected.filter(id => !choices.some(c => String(c.value) === id))
  if (!allowed) return <p className="field-error">Không có quyền tra cứu hoặc chưa xác định khóa học cho giảng viên.</p>
  return <div className="lookup-control">
    {!trainer && <><Input aria-label={`Tìm ${label(field)}`} value={search} placeholder="Tìm tên hoặc tên đăng nhập…" onChange={e => setSearch(e.target.value)} /><select aria-label="Lọc vai trò nhân viên" value={role} onChange={e => { setRole(e.target.value); setPage(1) }}><option value="">Mọi vai trò</option>{['TRAINEE', 'TRAINER', 'BRANCH_MANAGER', 'QUALITY_AUDITOR', 'TRAINING_MANAGER', 'RD_SPECIALIST', 'RD_MANAGER', 'ADMIN'].map(r => <option value={r} key={r}>{display(r)}</option>)}</select></>}
    <select aria-label={label(field)} multiple={multiple} value={multiple ? selected : selected[0] ?? ''} disabled={data.isFetching || context.readOnly?.includes(field)} onChange={e => { setSavedLabels(previous => ({ ...previous, ...Object.fromEntries(choices.map(c => [String(c.value), c.label])) })); onChange(multiple ? mergePeopleSelection(selected, choices.map(c => c.value), [...e.target.selectedOptions].filter(o => choices.some(c => String(c.value) === o.value)).map(o => Number(o.value))) : e.target.value ? Number(e.target.value) : null) }}>
      {!multiple && <option value="">Chọn…</option>}{missing.map(id => <option key={id} value={id}>{savedLabels[id] ?? `Tham chiếu đã lưu #${id}`}</option>)}{choices.map(c => <option key={c.value} value={c.value} disabled={c.disabled}>{c.label}</option>)}
    </select>
    {multiple && selected.map(id => <Button key={id} className="max-w-full whitespace-normal text-left h-auto py-2" type="button" variant="outline" disabled={context.readOnly?.includes(field)} onClick={() => onChange(selected.filter(s => s !== id).map(Number))}>{savedLabels[id] ?? choices.find(c => String(c.value) === id)?.label ?? `#${id}`} ×</Button>)}
    {data.isFetching && <p role="status">Đang tải danh sách…</p>}{!data.isFetching && !data.error && !rows.length && <p className="muted">Không có người phù hợp trong phạm vi được phép.</p>}
    {!trainer && <div className="flex gap-2"><Button type="button" variant="outline" aria-label="Trang nhân viên trước" disabled={page === 1 || data.isFetching} onClick={() => setPage(p => p - 1)}>‹</Button><span>Trang {page} · {Number(asRecord(data.currentData).total ?? 0)} người</span><Button type="button" variant="outline" aria-label="Trang nhân viên sau" disabled={data.isFetching || page * 20 >= Number(asRecord(data.currentData).total ?? 0)} onClick={() => setPage(p => p + 1)}>›</Button></div>}
    {trainer && <p className="field-help">BR-34: eligibility và lý do lấy từ máy chủ theo đúng SOP; máy chủ kiểm tra lại khi lưu. API này trả danh sách không phân trang, chưa hỗ trợ tìm kiếm phía server.</p>}
    {multiple && <p className="field-help">Chọn nhiều mục bằng Ctrl/⌘; lựa chọn được giữ khi chuyển trang.</p>}
    {data.error && <ErrorState error={data.error} retry={() => void data.refetch()} />}
  </div>
}
