import { createDomainSlice } from '@/utils/createDomainSlice'
import { attendanceService } from './attendanceService'
const domain = createDomainSlice('attendance', attendanceService)
export const fetchAttendanceRecords = domain.fetchList
export const fetchAttendanceRecord = domain.fetchDetail
export const recordAttendance = domain.mutate
export default domain.reducer
