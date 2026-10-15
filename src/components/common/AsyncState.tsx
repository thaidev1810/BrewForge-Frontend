import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react'
import type { ServerError } from '@/services/backend/operations'
import { asRecord } from '@/services/backend/operations'
import { Button } from '@/components/ui/button'
import { errorMessage, issueMessage } from '@/services/errorPresentation'
export function LoadingState({ label = 'Đang tải dữ liệu…' }: { label?: string }) { return <div role="status" className="state-panel"><LoaderCircle className="animate-spin" /><p>{label}</p></div> }
export function EmptyState({ label = 'Chưa có dữ liệu', detail = 'Thử thay đổi bộ lọc hoặc quay lại khi có hoạt động mới.' }: { label?: string; detail?: string }) { return <div className="state-panel"><Inbox size={32} /><h3>{label}</h3><p className="muted">{detail}</p></div> }
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const e = asRecord(error) as unknown as ServerError
  return <div className="error-box" role="alert"><div className="flex items-center gap-2"><AlertCircle size={18} /><strong>{errorMessage(e)}</strong></div>{e.rule && <p className="mt-2 text-sm">Quy tắc: {e.rule}</p>}{e.validationErrors && <ul className="mt-2 list-disc pl-5">{Object.entries(e.validationErrors).map(([field, issues]) => <li key={field}>{field}: {issues.map(issueMessage).join(' ')}</li>)}</ul>}{e.code && <p className="text-xs mt-2">Mã lỗi: {e.code}</p>}{e.traceId && <p className="text-xs mt-2">Mã hỗ trợ: {e.traceId}</p>}{retry && <Button variant="outline" className="mt-3" onClick={retry}>Thử lại</Button>}</div>
}
export function Notice({ children }: { children: React.ReactNode }) { return <div className="notice-box" role="note">{children}</div> }
