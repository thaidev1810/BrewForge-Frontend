import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord } from '@/services/mock/helpers'
import { mockTrainingAssignments } from '@/features/training/mockTrainingService'
import { demoUsers } from '@/features/auth/mockAuthService'
import { attendanceId } from './attendanceRules'
import { ATTENDANCE_STATUSES, type AttendanceRecord, type AttendanceService } from './attendanceTypes'

export const mockAttendanceRecords = new Map<string, AttendanceRecord>()
export const mockAttendanceService: AttendanceService = {
  ...mockRead(mockAttendanceRecords),
  async execute(command, signal) {
    checkSignal(signal)
    const input = copy(command.input)
    const assignment = requireRecord(mockTrainingAssignments, input.assignmentId)
    if (assignment.status === 'CANCELLED') throw new ApiError('Attendance cannot be recorded on a cancelled assignment.', 409)
    if (!ATTENDANCE_STATUSES.includes(input.status)) throw new ApiError('Attendance must be PRESENT, ABSENT or EXCUSED.', 400, { status: ['Invalid status.'] })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate) || !Number.isFinite(Date.parse(input.sessionDate))) throw new ApiError('Session date must be a valid YYYY-MM-DD date.', 400, { sessionDate: ['Invalid date.'] })
    if (input.sessionDate > new Date().toISOString().slice(0, 10)) throw new ApiError('Attendance cannot be recorded for a future session.', 400, { sessionDate: ['Must not be in the future.'] })
    if (input.note.length > 255) throw new ApiError('Note is too long.', 400, { note: ['At most 255 characters.'] })
    const recorder = demoUsers.find((user) => user.id === input.recordedBy)
    if (!recorder) throw new ApiError('Demo recorder not found.', 404)
    // A trainee never records their own attendance.
    if (recorder.id === assignment.traineeId || recorder.role === 'TRAINEE') throw new ApiError('Attendance is recorded by staff, never by the trainee.', 403)
    const record: AttendanceRecord = { ...input, note: input.note.trim(), id: attendanceId(input.assignmentId, input.sessionDate), traineeId: assignment.traineeId, recordedAt: new Date().toISOString() }
    mockAttendanceRecords.set(record.id, record)
    return copy(record)
  },
}
