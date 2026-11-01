import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { PageHeader } from '@/components/common/PageHeader'
import { DataView } from '@/components/common/DataView'
import { DetailTabs, Fold } from '@/components/common/DetailLayout'
import { LoadingState, ErrorState, Notice } from '@/components/common/AsyncState'
import { ActionDialog } from '@/components/common/ActionDialog'
import { Button } from '@/components/ui/button'
import { display } from '@/components/common/presentation'
import { canCall, useReadQuery } from '@/services/backend/operations'
import type { EnrollmentDto, EnrollmentModuleDto, QuizAttemptResultDto } from '@/services/backend/contracts'
import type { ActionSpec } from '@/features/workspace/resources'

export function EnrollmentReviewPage() {
  const {id}=useParams(), user=useAppSelector(state=>state.auth.user), enrollmentId=Number(id), [action,setAction]=useState<ActionSpec|null>(null)
  const enabled=!!user&&Number.isSafeInteger(enrollmentId)&&enrollmentId>0&&canCall('Enrollments.Get',user.role)
  const enrollment=useReadQuery({operation:'Enrollments.Get',params:{id:enrollmentId}},{skip:!enabled}), e=enrollment.currentData as EnrollmentDto|undefined
  const modules=useReadQuery({operation:'Enrollments.Modules',params:{id:enrollmentId}},{skip:!e||!canCall('Enrollments.Modules',user?.role)})
  const eligibility=useReadQuery({operation:'Enrollments.Eligibility',params:{id:enrollmentId}},{skip:!e||!canCall('Enrollments.Eligibility',user?.role)})
  const attempts=useReadQuery({operation:'Enrollments.QuizAttempts',params:{id:enrollmentId}},{skip:!e||!canCall('Enrollments.QuizAttempts',user?.role)})
  const history=(attempts.currentData??[]) as QuizAttemptResultDto[], current=history.filter(item=>Date.parse(item.attemptedAt)>=Date.parse(e?.enrolledAt??'')), older=history.filter(item=>Date.parse(item.attemptedAt)<Date.parse(e?.enrolledAt??''))
  if(!user||!enabled)return <Notice>Không có quyền hoặc mã đăng ký học không hợp lệ.</Notice>
  const prefix=roleConfig[user.role].prefix, back=canCall('Assignments.List',user.role)?'/assignments':'/employees'
  return <><Link className="text-link" to={prefix+back}>← Quay lại đội ngũ</Link><PageHeader title={e?.courseTitle??'Chi tiết đăng ký học'} description="Xem tiến độ và tóm tắt bài thi trong phạm vi được cấp."/>{enrollment.error&&<ErrorState error={enrollment.error} retry={()=>void enrollment.refetch()}/>} {!e&&!enrollment.error?<LoadingState/>:e&&<>
    {enrollment.isFetching&&<p role="status">Đang cập nhật đăng ký học…</p>}
    <div className="action-bar">{canCall('Enrollments.Reset',user.role)&&e.state==='LOCKED'&&<Button onClick={()=>setAction({operation:'Enrollments.Reset',label:'Giao học lại từ đầu'})}>Mở lại đăng ký bị khóa</Button>}{canCall('Enrollments.Close',user.role)&&['ASSIGNED','IN_PROGRESS','ELIGIBLE'].includes(e.state)&&<Button variant="outline" onClick={()=>setAction({operation:'Enrollments.Close',label:'Đóng đăng ký',danger:true})}>Đóng đăng ký</Button>}</div>
    <DetailTabs tabs={[
      {key:'overview',title:'Tiến độ & điều kiện',content:<><section className="panel"><DataView value={e}/></section><section className="panel mt-5"><h2>Điều kiện dự thi</h2>{eligibility.error?<ErrorState error={eligibility.error} retry={()=>void eligibility.refetch()}/>:eligibility.currentData?<DataView value={eligibility.currentData}/>:<LoadingState/>}</section></>},
      {key:'modules',title:'Học phần & bài học',content:<section className="panel">{modules.error?<ErrorState error={modules.error} retry={()=>void modules.refetch()}/>:!modules.currentData?<LoadingState/>:(modules.currentData as EnrollmentModuleDto[]).map(item=><Fold key={item.module.id} title={`${item.module.moduleOrder}. ${display(item.module.moduleType)} · ${item.lessonsRead}/${item.lessonsTotal} bài`}><DataView value={item}/></Fold>)}</section>},
      {key:'attempts',title:'Tóm tắt quiz',content:<section className="panel"><h2>Chu kỳ học hiện tại</h2>{attempts.error?<ErrorState error={attempts.error} retry={()=>void attempts.refetch()}/>:!attempts.currentData?<LoadingState/>:<><DataView value={current}/>{older.length>0&&<Fold title="Bài thi của chu kỳ trước"><DataView value={older}/></Fold>}</>}<Notice>Đây là tóm tắt điểm, không có đáp án quiz. Backend chưa cấp API lịch/bản ghi/tóm tắt practical cho role này.</Notice></section>},
    ]}/>
  </>}{action&&e&&<ActionDialog key={action.operation+e.id} action={action} record={{...e}} onClose={()=>setAction(null)}/>}</>
}
