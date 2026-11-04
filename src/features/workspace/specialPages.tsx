import { DetailTabs, Fold } from '@/components/common/DetailLayout'
import { display } from '@/components/common/presentation'
import { confinedBranch } from '@/services/backend/learningFlow'
import { saveBlob } from '@/utils/download'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/PageHeader'
import { ActionDialog } from '@/components/common/ActionDialog'
import { ResourcePicker } from '@/components/common/ContractForm'
import { requestFields } from '@/services/backend/formValues'
import { DataTable, DataView } from '@/components/common/DataView'

import { LoadingState, ErrorState, Notice } from '@/components/common/AsyncState'
import { asRecord, rowsOf, canCall, useReadQuery, useExecuteMutation, executeOperation, backendApi, type RecordData, type OperationCall } from '@/services/backend/operations'
import type { Operation, PushConfigDto, PushSubscriptionRequest } from '@/services/backend/contracts'
import { normalizeApiError } from '@/services/apiError'
import type { ActionSpec } from './resources'
import { reportPages } from './resources'
import { FilterBar } from './ResourcePage'

export function VersionPage() {
  const navigate = useNavigate()
  const { id } = useParams(), user = useAppSelector(s => s.auth.user), [action, setAction] = useState<ActionSpec | null>(null), [validation,setValidation] = useState<{ report: unknown; content: string } | null>(null)
  const query = useReadQuery({ operation: 'RecipeVersions.Get', params: { id: Number(id) } }), version = asRecord(query.currentData)
  const content = JSON.stringify(requestFields('RecipeContentRequest', version))
  const currentValidation = validation?.content === content && asRecord(validation.report).versionId === Number(id) ? validation.report : null
  const mutable = !version.isImmutable && ['DRAFT', 'REJECTED'].includes(String(version.state))
  const candidates: ActionSpec[] = [
    { operation: 'RecipeVersions.Update', label: 'Sửa các bước', gate: () => mutable },
    { operation: 'RecipeVersions.GenerateDraft', label: 'Tạo bản nháp AI', gate: () => mutable, note: 'Mô tả ý tưởng đồ uống. AI chỉ tạo bản nháp; nội dung vẫn cần kiểm tra và phát hành.' },
    { operation: 'RecipeVersions.Repair', label: 'Sửa vi phạm', gate: () => mutable },
    { operation: 'RecipeVersions.Validate', label: 'Chạy kiểm tra' },
    { operation: 'RecipeVersions.Submit', label: 'Gửi kiểm duyệt', gate: r => r.state === 'DRAFT' },
    { operation: 'RecipeVersions.Review', label: 'Duyệt từng bước', gate: r => r.state === 'VALIDATED' },
    { operation: 'RecipeVersions.Release', label: 'Phát hành SOP', gate: (r, me) => r.state === 'VALIDATED' && r.createdBy !== me, note: 'SOP được kiểm tra lại theo danh mục hiện tại, khóa nội dung và thay thế bản phát hành trước. Khóa học và chứng chỉ liên quan có thể cần cập nhật.' },
    { operation: 'RecipeVersions.Rollback', label: 'Tạo bản mới từ SOP này', gate: r => ['RELEASED', 'SUPERSEDED'].includes(String(r.state)), note: 'Rollback tạo bản nháp mới, không khôi phục tại chỗ. Một quản lý khác phải phát hành nếu bản mới đạt kiểm tra.' },
  ]
  const steps = Array.isArray(version.steps) ? version.steps as RecordData[] : []
  const initial = action?.operation === 'RecipeVersions.Update' ? requestFields('RecipeContentRequest', version) : action?.operation === 'RecipeVersions.Repair' ? { mode: 'MANUAL', patch: requestFields('RecipeContentRequest', version) } : action?.operation === 'RecipeVersions.Review' ? { decisions: steps.map(s => ({ stepId: s.id, action: 'ACCEPT', editedText: null })) } : undefined
  if (!user) return null
  return <><Link className="text-link" to={`${roleConfig[user.role].prefix}/recipes/${version.recipeId ?? ''}`}>← Công thức & lịch sử</Link><PageHeader title={`SOP · Phiên bản ${version.versionNo ?? ''}`} description="Nội dung chuẩn, định lượng và phụ thuộc giữa các bước." />{query.isFetching && !query.data ? <LoadingState /> : query.error ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <><div className="action-bar">{candidates.filter(a => canCall(a.operation, user.role) && (!a.gate || a.gate(version, Number(user.id)))).map(a => <Button key={a.operation} variant={a.operation === 'RecipeVersions.Release' ? 'default' : 'outline'} onClick={() => setAction(a)}>{a.label}</Button>)}</div>{version.createdBy === Number(user.id) && user.role === 'RD_MANAGER' && version.state === 'VALIDATED' && <Notice>Bạn là tác giả hiện tại của phiên bản này; quản lý R&D khác phải phát hành.</Notice>}{version.state === 'DRAFT' && user.role === 'RD_MANAGER' && <Notice>Bản nháp cần chuyên viên R&D hoàn thiện và gửi lại trước khi quản lý duyệt.</Notice>}<section className="panel"><DataView value={{versionNo:version.versionNo,state:version.state,stepCount:steps.length}}/></section><DetailTabs tabs={[
{key:'steps',title:'Các bước thực hiện',content:<section className="panel">{steps.map(step=><Fold key={String(step.id)} id={'step-'+step.id} title={String(step.stepOrder)+'. '+String(step.actionText??'Bước SOP')}><DataView value={step}/></Fold>)}</section>},
{key:'validation',title:'Kết quả kiểm tra',content:<section className="panel">{currentValidation?<><DataView value={currentValidation}/>{rowsOf({items:asRecord(currentValidation).checks}).flatMap(check=>rowsOf({items:check.violations})).filter(v=>v.stepId).map((v,index)=><a className="text-link block" key={index} href={'?section=steps#step-'+v.stepId} onClick={event=>{event.preventDefault(); const next=new URL(window.location.href);next.searchParams.set('section','steps');next.hash='step-'+v.stepId;navigate(next.pathname+next.search+next.hash,{replace:true,preventScrollReset:true});setTimeout(()=>{const element=document.getElementById('step-'+v.stepId) as HTMLDetailsElement|null;if(element){element.open=true;element.scrollIntoView({block:'center'});element.querySelector('summary')?.focus()}},100)}}>Bước {display(v.stepOrder)}: {String(v.message)}</a>)}</>:<Notice>Chạy kiểm tra để xem kết quả mới. GET phiên bản không trả lịch sử kiểm tra.</Notice>}</section>},
{key:'information',title:'Thông tin phiên bản',content:<section className="panel"><DataView value={Object.fromEntries(Object.entries(version).filter(([key])=>!['steps','validation'].includes(key)))}/></section>}
]}/></>}{action && <ActionDialog action={action} record={version} initial={initial} onSuccess={data=>{const value=asRecord(data);if(value.checks)setValidation({report:value,content});else if(value.validation)setValidation({report:value.validation,content});else setValidation(null)}} context={{ choices: { stepId: steps.map(s => ({ value: Number(s.id), label: `${s.stepOrder}. ${s.actionText}` })) } }} onClose={() => setAction(null)} />}</>
}
export function ReportPage({ page }: { page: string }) {
  const spec = reportPages.find(p => p.key === page)!, user = useAppSelector(s => s.auth.user), [filters, setFilters] = useState<RecordData>({}), [row, setRow] = useState<RecordData | null>(null)
  const query = useReadQuery({ operation: spec.operation, query: { ...filters, ...(confinedBranch(user) && spec.filters.some(f => f.name === 'branchId') ? { branchId: confinedBranch(user) } : {}) } })
  return <><PageHeader title={spec.title} description="Chỉ số tổng hợp từ dữ liệu thực tế của hệ thống." /><FilterBar filters={spec.filters.filter(f => !confinedBranch(user) || f.name !== 'branchId')} onApply={v => { setFilters(v); setRow(null) }} />{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <section className="panel">{spec.operation === 'BranchAudits.Summary' ? <DataView value={query.data} /> : <DataTable data={query.data} onRow={setRow} />}</section>}{row && <section className="panel mt-6"><div className="section-header"><h2>Chi tiết</h2><Button variant="ghost" onClick={() => setRow(null)}>Đóng</Button></div><DataView value={row} /></section>}</>
}
export function ImpactPage() {
  const { runId } = useParams(), user = useAppSelector(s => s.auth.user)
  const [open, setOpen] = useState(false), [created, setCreated] = useState<RecordData | null>(null), [commit, setCommit] = useState(false), [conflictRun, setConflictRun] = useState<string | null>(null)
  const query = useReadQuery({ operation: 'ImpactAnalysis.Get', params: { runId: runId ?? '' } }, { skip: !runId })
  const result = created ?? asRecord(query.currentData), affected = asRecord(result.affected)
  const hasRows = ['courses', 'certificates', 'liveBranches'].some(k => Array.isArray(affected[k]) && (affected[k] as unknown[]).length > 0)
  async function refreshRun() { if (result.runId) { const data = await executeOperation('ImpactAnalysis.Get', { params: { runId: String(result.runId) } }); setCreated(asRecord(data)) } }
  return <><PageHeader title="Phân tích ảnh hưởng" description="Xem thay đổi nào cần cập nhật khóa học, chứng chỉ và chi nhánh." action={<Button onClick={() => setOpen(true)}>Phân tích thay đổi</Button>} /><Notice>Xem trước có lưu run header, kể cả không có ảnh hưởng. Áp dụng tính lại ảnh hưởng và đánh dấu một lần; không tự sửa nguyên liệu hoặc thiết bị.</Notice>
    {query.isLoading && !created ? <LoadingState /> : query.error && !created ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : Object.keys(result).length > 0 ? <section className="panel"><DataView value={result} />{result.runId && user ? <Link className="text-link" to={roleConfig[user.role].prefix + '/impact/' + result.runId} onClick={() => setCreated(null)}>Mở chi tiết lần phân tích →</Link> : null}{result.committed === true || conflictRun === result.runId ? <p role="status" className="success-box">Đã áp dụng. Không thể gửi áp dụng lần nữa.</p> : typeof result.runId === 'string' && <Button className="mt-5" onClick={() => setCommit(true)}>Áp dụng ảnh hưởng</Button>}{!hasRows && <Notice>Không có tài nguyên downstream trong kết quả này. Run vẫn được lưu và có thể áp dụng; máy chủ tính lại ảnh hưởng khi xác nhận.</Notice>}</section> : <section className="panel"><p>Chọn nguyên liệu, thiết bị hoặc phiên bản SOP để bắt đầu xem trước.</p></section>}
    {open && <ActionDialog action={{ operation: 'ImpactAnalysis.Analyze', label: 'Xem trước ảnh hưởng' }} onClose={() => setOpen(false)} onSuccess={d => setCreated(asRecord(d))} />}
    {commit && <ActionDialog action={{ operation: 'ImpactAnalysis.Commit', label: 'Áp dụng ảnh hưởng', params: () => ({ runId: String(result.runId) }) }} record={result} disabledReason={result.committed === true || conflictRun === result.runId ? 'Lần phân tích này đã được áp dụng.' : undefined} onClose={() => setCommit(false)} onSuccess={d => setCreated(asRecord(d))} onFailure={e => { if (e.rule === 'IMPACT_ALREADY_COMMITTED' || e.code === 'IMPACT_ALREADY_COMMITTED') setConflictRun(String(result.runId)); if (e.status === 409) void refreshRun().catch(() => undefined) }} />}
  </>
}
export function TracePage() {
  const { entityType, id } = useParams(), [type, setType] = useState(entityType ?? 'RecipeVersion'), [entity, setEntity] = useState(id ?? ''), [call, setCall] = useState<OperationCall | null>(entityType && id ? { operation: 'AuditLog.Trace', params: { entityType, entityId: Number(id) } } : null)
  const query = useReadQuery(call ?? { operation: 'AuditLog.Trace' }, { skip: !call })
  return <><PageHeader title="Truy vết tiêu chuẩn" description="Từ tác giả và kiểm tra SOP đến khóa học, chứng chỉ và chi nhánh." /><form className="filter-bar" onSubmit={e => { e.preventDefault(); if (Number.isSafeInteger(Number(entity)) && Number(entity) > 0) setCall({ operation: 'AuditLog.Trace', params: { entityType: type, entityId: Number(entity) } }) }}><label>Loại tài nguyên<select value={type} onChange={e => setType(e.target.value)}>{['RecipeVersion', 'Recipe', 'Course', 'Certificate'].map(t => <option key={t}>{t}</option>)}</select></label><label>Mã tham chiếu<Input required type="number" min={1} value={entity} onChange={e => setEntity(e.target.value)} /></label><Button type="submit">Truy vết</Button></form>{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} /> : call && <section className="panel"><DataView value={query.data} /></section>}</>
}
export function CompliancePage() {
  const [filters, setFilters] = useState<RecordData>({ format: 'xlsx' }), [busy, setBusy] = useState(false), [error, setError] = useState<unknown>(null), [success, setSuccess] = useState(false)
  async function download() {
    setBusy(true); setError(null); setSuccess(false)
    try { const file = await executeOperation('Reports.Compliance', { query: filters }); saveBlob(file as Blob, `brewforge-compliance.${filters.format ?? 'xlsx'}`); setSuccess(true) } catch (e) { setError(normalizeApiError(e)) } finally { setBusy(false) }
  }
  return <><PageHeader title="Báo cáo chứng nhận" description="Lịch sử chứng chỉ của nhân viên theo ngày cấp và phạm vi đã chọn." /><FilterBar filters={[{ name: 'format', label: 'Định dạng', options: ['xlsx', 'csv'] }, { name: 'from', label: 'Từ ngày', type: 'date' }, { name: 'to', label: 'Đến ngày', type: 'date' }, { name: 'branchId', label: 'Chi nhánh', type: 'number' }, { name: 'courseId', label: 'Khóa học', type: 'number' }, { name: 'recipeVersionId', label: 'Phiên bản SOP', type: 'number' }]} initial={filters} onApply={setFilters} /><section className="panel"><Notice>Áp dụng bộ lọc trước khi tải. Backend xuất CSV/XLSX và ghi thao tác vào lịch sử. Không có PDF.</Notice><Button disabled={busy} onClick={() => void download()}>{busy ? 'Đang xuất báo cáo…' : 'Tải báo cáo'}</Button>{error !== null && <ErrorState error={error} />}{success && <p className="success-box" role="status">Đã nhận tệp báo cáo từ máy chủ.</p>}</section></>
}
export function ProtectedMedia(props: { operation: Operation; params: Record<string, string | number>; kind: 'image' | 'video' }) {
  return <ProtectedMediaSource key={JSON.stringify([props.operation, Object.entries(props.params).sort(), props.kind])} {...props} />
}
function ProtectedMediaSource({ operation, params, kind }: { operation: Operation; params: Record<string, string | number>; kind: 'image' | 'video' }) {
  const [url, setUrl] = useState<string | null>(null), [error, setError] = useState<unknown>(null), [busy, setBusy] = useState(false)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => { request.current?.abort() }, [])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  async function load() {
    setBusy(true); setError(null)
    const controller = new AbortController(); request.current = controller
    try { const file = await executeOperation(operation, { params }, { signal: controller.signal }); if (!controller.signal.aborted) setUrl(URL.createObjectURL(file as Blob)) }
    catch (e) { if (!controller.signal.aborted) setError(normalizeApiError(e)) }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  return <div className="media-panel">{url ? kind === 'image' ? <a href={url} target="_blank" rel="noreferrer" aria-label="Mở ảnh kích thước đầy đủ"><img src={url} alt="Ảnh đính kèm" loading="lazy"/><span className="text-link block">Mở ảnh đầy đủ ↗</span></a> : <video src={url} controls preload="metadata"><track kind="captions" /></video> : <Button variant="outline" disabled={busy} onClick={() => void load()}>{busy ? 'Đang tải…' : kind === 'image' ? 'Xem ảnh minh chứng' : 'Tải & xem bản ghi'}</Button>}{error !== null && <ErrorState error={error} />}{kind === 'video' && <p className="field-help">Video được tải đầy đủ có xác thực trước khi phát; tệp lớn có thể cần thời gian và bộ nhớ.</p>}</div>
}
export function SalesAnalyticsPage() {
  const [body, setBody] = useState<RecordData>({ recipeId: null }), [queryArgs, setQueryArgs] = useState<RecordData | null>(null)
  const query = useReadQuery({ operation: 'Sales.Aggregate', query: queryArgs ?? {} }, { skip: !queryArgs })
  return <><PageHeader title="Phân tích doanh số" description="Ly bán theo chi nhánh, ngày hoặc tuần và đồ uống đối chứng." /><section className="panel"><label>Đồ uống</label><ResourcePicker field="recipeId" value={body.recipeId} onChange={value => setBody({ recipeId: value })} /><FilterBar filters={[{ name: 'groupBy', label: 'Nhóm', options: ['branch', 'day', 'week'] }, { name: 'branchId', label: 'Chi nhánh', type: 'number' }, { name: 'from', label: 'Từ ngày', type: 'date' }, { name: 'to', label: 'Đến ngày', type: 'date' }, { name: 'controlRecipeId', label: 'Đồ uống đối chứng', type: 'number' }]} onApply={filters => { if (body.recipeId) setQueryArgs({ ...filters, recipeId: body.recipeId }) }} />{!body.recipeId && <p className="muted">Chọn công thức để xem dữ liệu.</p>}</section>{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} /> : queryArgs && <section className="panel mt-6"><DataView value={query.data} /></section>}</>
}
export function AccountPage() {
  const query = useReadQuery({ operation: 'Auth.Me' })
  return <><PageHeader title="Tài khoản của tôi" description="Thông tin và quyền được backend cấp cho phiên hiện tại." />{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} /> : <section className="panel"><DataView value={query.data} /></section>}<Notice>Đổi thông tin tài khoản hoặc mật khẩu thông qua quản trị viên. Phiên được giữ qua tải lại trang trong cùng tab và xác thực lại trước khi mở dữ liệu.</Notice></>
}
export function PushPage() {
  const config = useReadQuery({ operation: 'Notifications.PushConfig' }), mine = useReadQuery({ operation: 'Notifications.Mine' }), [mutate, mutation] = useExecuteMutation(), dispatch = useAppDispatch()
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState<unknown>(null)
  const settings = config.data as PushConfigDto | undefined
  async function subscribe() {
    setBusy(true); setError(null); setMessage('')
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !window.isSecureContext) throw new Error('Trình duyệt cần hỗ trợ Web Push và kết nối an toàn (HTTPS hoặc localhost).')
      if (!settings?.enabled || !settings.publicKey) throw new Error('Máy chủ chưa cấu hình Web Push.')
      const permission = await Notification.requestPermission(); if (permission !== 'granted') throw new Error('Bạn chưa cho phép trình duyệt nhận thông báo.')
      const registration = await navigator.serviceWorker.register('/push-worker.js')
      await navigator.serviceWorker.ready
      const publicKey = Uint8Array.from(atob(settings.publicKey.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0))
      const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey })
      const json = subscription.toJSON(), body: PushSubscriptionRequest = { endpoint: subscription.endpoint, keys: { p256dh: json.keys?.p256dh ?? null, auth: json.keys?.auth ?? null } }
      await mutate({ operation: 'Notifications.Subscribe', body }).unwrap(); setMessage('Đã đăng ký trình duyệt với máy chủ.')
    } catch (e) { setError(normalizeApiError(e)) } finally { setBusy(false) }
  }
  async function unsubscribe(endpoint: string) {
    setError(null); setMessage('')
    try { await mutate({ operation: 'Notifications.Unsubscribe', query: { endpoint } }).unwrap(); const reg = await navigator.serviceWorker?.getRegistration(); const sub = await reg?.pushManager.getSubscription(); if (sub?.endpoint === endpoint) await sub.unsubscribe(); setMessage('Đã bỏ đăng ký trình duyệt.'); dispatch(backendApi.util.invalidateTags(['Workspace'])) } catch (e) { setError(normalizeApiError(e)) }
  }
  return <><PageHeader title="Thông báo trình duyệt" description="Nhận thông báo học tập và thay đổi tiêu chuẩn qua Web Push." /><Notice>Xem lịch sử và số chưa đọc tại Hộp thông báo. Trang này quản lý đăng ký Web Push trên trình duyệt.</Notice>{config.isFetching ? <LoadingState /> : config.error ? <ErrorState error={config.error} /> : <section className="panel"><p>{settings?.enabled ? 'Máy chủ đã bật Web Push.' : 'Máy chủ chưa cấu hình Web Push.'}</p><Button className="mt-4" disabled={busy || !settings?.enabled} onClick={() => void subscribe()}>{busy ? 'Đang đăng ký…' : 'Bật thông báo trên trình duyệt này'}</Button></section>}{mine.isFetching ? <LoadingState /> : mine.error ? <ErrorState error={mine.error} /> : <section className="panel mt-6"><h2>Trình duyệt đã đăng ký</h2>{rowsOf(mine.data).map(r => <div className="version-row" key={String(r.id)}><p className="break-all text-sm">{String(r.endpoint)}</p><Button variant="outline" disabled={mutation.isLoading} onClick={() => void unsubscribe(String(r.endpoint))}>Bỏ đăng ký</Button></div>)}</section>}{error !== null && <ErrorState error={error} />}{message && <p className="success-box" role="status">{message}</p>}</>
}
