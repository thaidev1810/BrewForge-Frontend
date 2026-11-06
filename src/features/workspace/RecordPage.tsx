import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { DataView } from '@/components/common/DataView'
import { PosImportReceipt } from './PosImportReceipt'
import type { PosImportResultDto } from '@/services/backend/contracts'
import { LoadingState, ErrorState } from '@/components/common/AsyncState'
import { useReadQuery } from '@/services/backend/operations'
import type { Operation } from '@/services/backend/contracts'
import { ProtectedMedia } from './specialPages'
export function RecordPage({ operation, title }: { operation: Operation; title: string }) {
  const { id } = useParams(), query = useReadQuery({ operation, params: { id: Number(id) } })
  return <><PageHeader title={title} />{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} /> : <section className="panel"><DataView value={query.data} /></section>}</>
}
export function VideoPage() {
  const { id } = useParams()
  return <><PageHeader title="Bản ghi thực hành" description="Xem bản ghi trong phạm vi bạn được cấp quyền để đối chiếu trước khi đánh giá." /><section className="panel"><ProtectedMedia operation="Enrollments.PracticalVideoContent" params={{ id: Number(id) }} kind="video" /></section></>
}
export function ImportResultPage() {
  const { jobId } = useParams(), query = useReadQuery({ operation: 'Sales.ImportResult', params: { jobId: jobId ?? '' } })
  return <><PageHeader title="Kết quả nhập doanh số" description="Đối chiếu các dòng đã nhận và sửa riêng những dòng bị từ chối." />{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} /> : <section className="panel"><PosImportReceipt result={query.data as PosImportResultDto}/></section>}</>
}
