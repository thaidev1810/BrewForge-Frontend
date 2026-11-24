import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Enrol -> attendance -> quiz -> practical -> certificate, through the real slices and mock services.
process.env.VITE_ENABLE_MOCK_SERVICES = 'true'
process.env.VITE_ENABLE_MOCK_AUTH = 'true'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const load = (path) => server.ssrLoadModule(`/src/${path}`)
try {
  const { store } = await load('app/store.ts')
  const { demoUsers } = await load('features/auth/mockAuthService.ts')
  const training = await load('features/training/trainingSlice.ts')
  const attendance = await load('features/attendance/attendanceSlice.ts')
  const quizzes = await load('features/quizzes/quizSlice.ts')
  const assessments = await load('features/assessments/assessmentSlice.ts')
  const certificates = await load('features/certificates/certificateSlice.ts')
  const { attendanceId, summarizeAttendance } = await load('features/attendance/attendanceRules.ts')
  const { selectAttendanceSummary } = await load('features/attendance/attendanceSelectors.ts')
  const run = (thunk, argument) => store.dispatch(thunk(argument)).unwrap()
  const fails = async (thunk, argument, status) => {
    const action = await store.dispatch(thunk(argument))
    assert.equal(thunk.rejected.match(action), true)
    assert.equal(action.payload.status, status)
  }

  const trainee = demoUsers.find((user) => user.role === 'TRAINEE')
  const trainer = demoUsers.find((user) => user.role === 'TRAINER')

  // Pure rules: excused is left out, nothing recorded is not a shortfall, 4 of 5 is exactly 80.
  assert.equal(summarizeAttendance([]).meetsMinimum, true)
  assert.equal(summarizeAttendance([{ status: 'EXCUSED' }, { status: 'ABSENT' }]).meetsMinimum, false)
  assert.equal(summarizeAttendance([...Array(4).fill({ status: 'PRESENT' }), { status: 'ABSENT' }]).meetsMinimum, true)
  assert.equal(summarizeAttendance([...Array(79).fill({ status: 'PRESENT' }), ...Array(21).fill({ status: 'ABSENT' })]).meetsMinimum, false)

  // A trainee enrols themselves in a published, active course; a second enrolment is refused.
  const enrol = { operation: 'assign', input: { courseId: 'course-latte', traineeId: trainee.id, branchId: trainee.branchId, dueAt: null } }
  const assignment = await run(training.mutateTrainingAssignment, enrol)
  assert.equal(assignment.status, 'ASSIGNED')
  await fails(training.mutateTrainingAssignment, enrol, 409)
  await run(training.mutateTrainingAssignment, { operation: 'start', id: assignment.id })

  const mark = (sessionDate, status, recordedBy = trainer.id, note = '') => ({ operation: 'record', id: attendanceId(assignment.id, sessionDate), input: { assignmentId: assignment.id, sessionDate, status, note, recordedBy } })
  const day = (offset) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10)
  await fails(attendance.recordAttendance, mark(day(1), 'PRESENT', trainee.id), 403)
  await fails(attendance.recordAttendance, mark(day(-2), 'PRESENT'), 400)
  await fails(attendance.recordAttendance, mark('2026-13-40', 'PRESENT'), 400)
  await fails(attendance.recordAttendance, mark(day(1), 'LATE'), 400)

  await run(attendance.recordAttendance, mark(day(5), 'PRESENT'))
  await run(attendance.recordAttendance, mark(day(4), 'ABSENT'))
  await run(attendance.fetchAttendanceRecords)
  assert.equal(selectAttendanceSummary(store.getState(), assignment.id).percent, 50)
  // The quiz is closed while attendance is below 80%.
  await fails(quizzes.recordQuizAttempt, { operation: 'record', input: { assignmentId: assignment.id, correctAnswers: 10, totalQuestions: 10 } }, 409)

  // Recording a day again corrects it instead of adding a second record.
  await run(attendance.recordAttendance, mark(day(4), 'EXCUSED', trainer.id, 'Sick leave'))
  await run(attendance.fetchAttendanceRecords)
  const summary = selectAttendanceSummary(store.getState(), assignment.id)
  assert.deepEqual([summary.sessions, summary.excused, summary.percent, summary.meetsMinimum], [2, 1, 100, true])

  const passedQuiz = await run(quizzes.recordQuizAttempt, { operation: 'record', input: { assignmentId: assignment.id, correctAnswers: 9, totalQuestions: 10 } })
  assert.equal(passedQuiz.passed, true)

  const criteria = [
    { criterionId: 'expiry', label: 'Check ingredient expiry', critical: true, passed: true },
    { criterionId: 'dose', label: 'Dose is correct', critical: false, passed: true },
  ]
  await fails(assessments.recordPracticalAssessment, { operation: 'record', input: { quizAttemptId: passedQuiz.id, assessorId: trainee.id, notes: '', criteria } }, 403)
  const autoFail = await run(assessments.recordPracticalAssessment, { operation: 'record', input: { quizAttemptId: passedQuiz.id, assessorId: trainer.id, notes: '', criteria: [{ ...criteria[0], passed: false }, criteria[1]] } })
  assert.deepEqual([autoFail.criticalFailure, autoFail.passed], [true, false])
  await fails(certificates.mutateCertificate, { operation: 'issue', input: { assessmentId: autoFail.id, sopVersionId: 'sop-latte-v1' } }, 409)
  const pass = await run(assessments.recordPracticalAssessment, { operation: 'record', input: { quizAttemptId: passedQuiz.id, assessorId: trainer.id, notes: 'Good', criteria } })
  assert.equal(pass.passed, true)
  const certificate = await run(certificates.mutateCertificate, { operation: 'issue', input: { assessmentId: pass.id, sopVersionId: 'sop-latte-v1' } })
  assert.equal(certificate.traineeId, trainee.id)
  console.log('Passed: enrolment, attendance rules, 80% attendance gate on the quiz, no self-assessment, critical auto-fail, certificate after quiz and practical.')
} finally {
  await server.close()
}
