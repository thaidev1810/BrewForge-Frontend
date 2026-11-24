import type { DomainService } from '@/types/domain'
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'EXCUSED'] as const
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number]
export interface AttendanceInput { assignmentId: string; sessionDate: string; status: AttendanceStatus; note: string; recordedBy: string }
export interface AttendanceRecord extends AttendanceInput { id: string; traineeId: string; recordedAt: string }
// One record per assignment and session day: recording again corrects it. `id` only serializes writes per record.
export type AttendanceCommand = { operation: 'record'; id: string; input: AttendanceInput }
export type AttendanceService = DomainService<AttendanceRecord, AttendanceCommand>
