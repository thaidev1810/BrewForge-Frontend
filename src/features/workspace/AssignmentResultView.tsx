import { useAppSelector } from '@/app/hooks'
import { DataTable } from '@/components/common/DataView'
import { ErrorState, Notice } from '@/components/common/AsyncState'
import { canCall, rowsOf, useReadQuery } from '@/services/backend/operations'
import type { AssignmentResultDto } from '@/services/backend/contracts'

const skipReasons: Record<string, string> = { PREREQUISITE: 'Thiếu khóa tiên quyết' }

export function AssignmentResultView({ result }: { result: AssignmentResultDto }) {
  const user = useAppSelector(state => state.auth.user)
  const skipped = Array.isArray(result?.skipped) ? result.skipped : []
  const alreadyEnrolled = Array.isArray(result?.alreadyEnrolled) ? result.alreadyEnrolled : []
  const enrollmentIds = Array.isArray(result?.enrollmentIds) ? result.enrollmentIds : []
  const ids = [...new Set([...skipped.map(item => item.userId), ...alreadyEnrolled])]
  const people = useReadQuery({ operation: 'UserLookup.Lookup', query: { ids: ids.join(',') } }, {
    skip: !ids.length || !canCall('UserLookup.Lookup', user?.role),
  })
  const names = new Map(rowsOf(people.currentData).map(person => [Number(person.id), String(person.fullName ?? `Nhân viên #${person.id}`)]))

  if (!Array.isArray(result?.skipped) || !Array.isArray(result?.alreadyEnrolled) || !Array.isArray(result?.enrollmentIds)) {
    return <Notice>Phản hồi giao khóa không khớp contract hiện tại. Chưa thể xác nhận kết quả từng người.</Notice>
  }

  const rows = [
    ...alreadyEnrolled.map(userId => ({ userId, fullName: names.get(userId) ?? `Nhân viên #${userId}`, outcome: 'Đã có đăng ký', reason: '—' })),
    ...skipped.map(item => ({ userId: item.userId, fullName: names.get(item.userId) ?? `Nhân viên #${item.userId}`, outcome: 'Bỏ qua', reason: `${skipReasons[item.reason] ?? item.reason} (${item.reason})` })),
  ]
  const partial = skipped.length > 0

  return <section aria-label="Kết quả giao khóa">
    <p className={partial || enrollmentIds.length === 0 ? 'notice-box' : 'success-box'} role="status">
      Giao mới: {enrollmentIds.length} · Đã có đăng ký: {alreadyEnrolled.length} · Bỏ qua: {skipped.length}
    </p>
    {partial && <Notice>Một số nhân viên chưa được giao. Kiểm tra lý do bên dưới; mã enrollment mới không được backend ánh xạ ngược về từng nhân viên trong response.</Notice>}
    {enrollmentIds.length > 0 && <p>Enrollment mới: {enrollmentIds.join(', ')}</p>}
    {rows.length > 0 && <DataTable data={rows} columns={['fullName', 'userId', 'outcome', 'reason']} pageSize={20} />}
    {!rows.length && enrollmentIds.length === 0 && <p>Không có enrollment mới trong kết quả này.</p>}
    {people.error && <ErrorState error={people.error} retry={() => void people.refetch()} />}
  </section>
}
