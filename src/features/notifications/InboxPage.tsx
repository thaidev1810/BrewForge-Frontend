import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState, LoadingState, Notice } from '@/components/common/AsyncState'
import { ActionDialog } from '@/components/common/ActionDialog'
import { Button } from '@/components/ui/button'
import { useReadQuery } from '@/services/backend/operations'
import type { NotificationDto, PagedResult } from '@/services/backend/contracts'

export function InboxPage() {
  const [unread, setUnread] = useState(false), [page, setPage] = useState(1), [action, setAction] = useState<number | 'all' | null>(null)
  const query = useReadQuery({ operation: 'Notifications.Inbox', query: { unread, page, size: 20, sort: 'id,desc' } })
  const data = query.currentData as PagedResult<NotificationDto> | undefined
  return <><PageHeader title="Hộp thông báo" description="Thông báo trong ứng dụng hoạt động độc lập với quyền Web Push." action={<Button disabled={!data || data.total === 0} onClick={() => setAction('all')}>Đánh dấu tất cả đã đọc</Button>} />
    <label className="mb-5"><input type="checkbox" checked={unread} onChange={e => { setUnread(e.target.checked); setPage(1) }} /> Chỉ chưa đọc</label>
    {query.error && <ErrorState error={query.error} retry={() => void query.refetch()} />}
    {query.isLoading || query.isFetching && !data ? <LoadingState /> : data && <>{!data.items.length && <Notice>{data.total > 0 ? 'Trang hiện tại không còn thông báo; chọn trang trước.' : 'Không có thông báo phù hợp.'}</Notice>}{data.items.map(item => <article className="panel mb-4" key={item.id}><h2>{item.subject} {!item.read && <span className="badge">Chưa đọc</span>}</h2><p className="whitespace-pre-wrap">{item.message}</p><p className="muted">{item.createdAt}{item.readAt ? ` · Đã đọc ${item.readAt}` : ''}</p>{!item.read && <Button variant="outline" onClick={() => setAction(item.id)}>Đánh dấu đã đọc</Button>}</article>)}<div className="pagination"><Button variant="outline" disabled={page === 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Trang trước</Button><span>Trang {page} · {data.total} thông báo</span><Button variant="outline" disabled={page * 20 >= data.total || query.isFetching} onClick={() => setPage(p => p + 1)}>Trang sau</Button></div></>}
    {action !== null && <ActionDialog action={{ operation: action === 'all' ? 'Notifications.MarkAllRead' : 'Notifications.MarkRead', label: action === 'all' ? 'Đánh dấu tất cả đã đọc' : 'Đánh dấu đã đọc', ...(typeof action === 'number' ? { params: () => ({ id: action }) } : {}) }} onClose={() => setAction(null)} />}
  </>
}
