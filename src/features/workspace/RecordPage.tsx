import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { DataView } from '@/components/common/DataView'
import { LoadingState, ErrorState } from '@/components/common/AsyncState'
import { useReadQuery, asRecord } from '@/services/backend/operations'
import type { Operation } from '@/services/backend/contracts'
import { ProtectedMedia } from './specialPages'
export function RecordPage({ operation, title }: { operation: Operation; title: string }) {
  const { id } = useParams(), query = useReadQuery({ operation, params: { id: Number(id) } })
  return <><PageHeader title={title} />{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} /> : <section className="panel"><DataView value={query.data} /></section>}</>
}
export function VideoPage() {
  const { id } = useParams()
  return <><PageHeader title="Bản ghi thực hành" description="Tải bằng phiên đăng nhập được backend kiểm tra." /><section className="panel"><ProtectedMedia operation="Enrollments.PracticalVideoContent" params={{ id: Number(id) }} kind="video" /></section></>
}
export function ImportResultPage() {
  const { jobId } = useParams(), query = useReadQuery({ operation: 'Sales.ImportResult', params: { jobId: jobId ?? '' } })
  return <><PageHeader title="Kết quả nhập POS" />{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} /> : <section className="panel"><DataView value={query.data} /><p className="muted">Dòng bị từ chối: {String(asRecord(query.data).rejected ?? '—')}</p></section>}</>
}
