import { MIN_ATTENDANCE_PERCENT } from '@/constants/training'
import type { AttendanceRecord } from './attendanceTypes'

export const attendanceId = (assignmentId: string, sessionDate: string) => `${assignmentId}:${sessionDate}`

export interface AttendanceSummary { sessions: number; present: number; absent: number; excused: number; percent: number; meetsMinimum: boolean }
// An excused session is left out of the count; with nothing recorded there is nothing to fall short of.
export function summarizeAttendance(records: Pick<AttendanceRecord, 'status'>[]): AttendanceSummary {
  const present = records.filter((record) => record.status === 'PRESENT').length
  const absent = records.filter((record) => record.status === 'ABSENT').length
  const excused = records.filter((record) => record.status === 'EXCUSED').length
  const counted = present + absent
  return {
    sessions: records.length, present, absent, excused,
    percent: counted === 0 ? 100 : Math.floor(present * 100 / counted),
    meetsMinimum: counted === 0 || present * 100 >= MIN_ATTENDANCE_PERCENT * counted,
  }
}
