import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
import { summarizeAttendance } from './attendanceRules'
export const attendanceSelectors = createDomainSelectors((state: RootState) => state.attendance)
export const selectAttendanceForAssignment = createSelector(
  [attendanceSelectors.selectList, (_: RootState, assignmentId: string) => assignmentId],
  (records, assignmentId) => records.filter((record) => record.assignmentId === assignmentId).sort((a, b) => a.sessionDate.localeCompare(b.sessionDate)),
)
export const selectAttendanceSummary = createSelector([selectAttendanceForAssignment], summarizeAttendance)
