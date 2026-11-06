import { useAppSelector } from '@/app/hooks'
import { DataTable } from '@/components/common/DataView'
import { ErrorState, Notice } from '@/components/common/AsyncState'
import { canCall, rowsOf, useReadQuery } from '@/services/backend/operations'
import type { RetrainingResultDto } from '@/services/backend/contracts'
import { RetrainingOutcomeValues } from '@/services/backend/contracts'

const reasons: Record<string,string> = { INACTIVE:'Nhân viên ngưng hoạt động', WRONG_BRANCH:'Nhân viên không còn thuộc chi nhánh kiểm định', NOT_FOUND:'Không tìm thấy nhân viên' }
export function RetrainingResultView({ result }: { result: RetrainingResultDto }) {
  const user=useAppSelector(state=>state.auth.user), valid=Array.isArray(result?.results)&&result.results.every(item=>item&&RetrainingOutcomeValues.includes(item.outcome))
  const people=useReadQuery({operation:'UserLookup.Lookup',query:{ids:valid?result.results.map(item=>item.employeeId).join(','):''}},{skip:!valid||!result.results.length||!canCall('UserLookup.Lookup',user?.role)})
  if(!valid)return <Notice>Chưa đọc được kết quả giao học lại của từng nhân viên. Kiểm tra danh sách lần học hoặc liên hệ quản lý trước khi gửi lại.</Notice>
  const assigned=result.results.filter(item=>item.outcome==='ASSIGNED').length, already=result.results.filter(item=>item.outcome==='ALREADY_ENROLLED').length, skipped=result.results.filter(item=>item.outcome==='SKIPPED').length
  const names=new Map(rowsOf(people.currentData).map(person=>[Number(person.id),String(person.fullName)]))
  const rows=result.results.map(item=>({...item,fullName:names.get(item.employeeId)??`Nhân viên #${item.employeeId}`,outcome: item.outcome==='ASSIGNED'?'Đã giao học lại':item.outcome==='ALREADY_ENROLLED'?'Đã có đăng ký':item.outcome==='SKIPPED'?'Bỏ qua':item.outcome,reasonCode:item.reasonCode?reasons[item.reasonCode]??'Chưa xác định được lý do; kiểm tra với quản lý đào tạo':null}))
  return <section aria-label="Kết quả giao học lại"><p className={skipped||!assigned?'notice-box':'success-box'} role="status">Giao mới: {assigned} · Đã có đăng ký: {already} · Bỏ qua: {skipped}</p>{skipped>0&&<Notice>Nhân viên bị bỏ qua chưa được giao học lại. Xem lý do từng người; thao tác này không xác nhận học lại đã hoàn tất.</Notice>}{people.error&&<ErrorState error={people.error} retry={()=>void people.refetch()}/>}<DataTable data={rows} columns={['fullName','employeeId','outcome','enrollmentId','reasonCode']} pageSize={20}/></section>
}
