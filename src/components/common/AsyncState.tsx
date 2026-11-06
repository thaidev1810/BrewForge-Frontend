import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react'
import type { ServerError } from '@/services/backend/operations'
import { asRecord } from '@/services/backend/operations'
import { Button } from '@/components/ui/button'
import { errorMessage, fieldFeedback } from '@/services/errorPresentation'
import type { Operation } from '@/services/backend/contracts'
export function LoadingState({ label = 'Đang tải dữ liệu…' }: { label?: string }) { return <div role="status" className="state-panel"><LoaderCircle className="animate-spin" /><p>{label}</p></div> }
export function EmptyState({ label = 'Chưa có dữ liệu', detail = 'Thử thay đổi bộ lọc hoặc quay lại khi có hoạt động mới.' }: { label?: string; detail?: string }) { return <div className="state-panel"><Inbox size={32} /><h3>{label}</h3><p className="muted">{detail}</p></div> }
export function ErrorState({ error, retry, operation }: { error: unknown; retry?: () => void; operation?: Operation }) {
  const e = asRecord(error) as unknown as ServerError
  return <div className="error-box" role="alert"><div className="flex items-center gap-2"><AlertCircle size={18} aria-hidden="true" /><strong>{errorMessage(e, operation)}</strong></div>{e.validationErrors && <ul className="mt-2 list-disc pl-5">{Object.entries(e.validationErrors).map(([field, issues]) => <li key={field}>{issues.map(issue => fieldFeedback(field, issue)).join(' ')}</li>)}</ul>}{[e.code,e.rule,e.traceId].some(Boolean) && <details className="support-details"><summary>Thông tin hỗ trợ</summary>{e.code && <p>Mã lỗi: {String(e.code).replace(/[^A-Za-z0-9_.-]/g,'').slice(0,80)}</p>}{e.rule && <p>Quy tắc: {String(e.rule).replace(/[^A-Za-z0-9_.-]/g,'').slice(0,80)}</p>}{e.traceId && <p>Mã hỗ trợ: {String(e.traceId).replace(/[^A-Za-z0-9_.-]/g,'').slice(0,100)}</p>}</details>}{retry && <Button variant="outline" className="mt-3" onClick={retry}>Thử lại</Button>}</div>
}
export function Notice({ children }: { children: React.ReactNode }) { return <div className="notice-box" role="note">{children}</div> }
