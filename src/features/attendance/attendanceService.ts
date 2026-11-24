import { bindDomainService } from '@/services/domainService'
import { mockAttendanceService } from './mockAttendanceService'
const binding = bindDomainService('Attendance', mockAttendanceService)
export const attendanceService = binding.service
export const configureAttendanceService = binding.configure
