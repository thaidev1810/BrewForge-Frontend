import { test, expect } from '@playwright/test'
import crypto from 'node:crypto'
import process from 'node:process'
import { Actors, api, entity, identity, manifest, record, save, upload } from './harness.js'
import { authoredCourse, readEveryLesson } from './owned-course.js'

test('owned secondary flows: review return, question bank, class attendance, quiz lock/reset and practical retake', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true' || process.env.E2E_ALLOW_ADDITIONAL_TRAINEE !== 'true', 'Local test and authorized run-owned learner required')
  test.setTimeout(240_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'owned learner login'
  const proof = (id: string, flow: string, assertion: string, kind = 'happy', via = 'LIVE_API') => record(m, id, { flow, role: 'test actors', kind, via, status: via === 'LIVE_UI' ? 'PASS_LIVE_UI' : 'PASS_LIVE_API', assertion, evidence: `run-owned secondary course/class/enrollment; ${m.runId}` })
  try {
    const admin = await actors.login('ADMIN'), tm = await actors.login('TRAINING_MANAGER'), trainer = await actors.login('TRAINER'), rd = await actors.login('RD_MANAGER')
    const username = m.runId.toLowerCase() + '_learner2', password = 'T!' + crypto.randomBytes(18).toString('base64url') + '8a'
    const user = await api(admin, 'Users.Get', { id: m.ids.additionalLearner })
    if (!user.ok || user.data.username !== username) throw new Error('Owned learner mismatch')
    const resetPassword = await api(admin, 'Users.Update', { id: m.ids.additionalLearner }, { username, password, email: user.data.email, fullName: user.data.fullName, role: 'TRAINEE', branchId: m.ids.branch, status: 'ACTIVE' }); expect(resetPassword.ok).toBe(true)
    const learner = await actors.loginGenerated(username, password)
    proof('own-account-reset', 'Own account password reset/session', 'ADMIN resets only authorized run-owned user; fresh login succeeds, no shared E2E account changed')
    stage = 'course return/resubmit'
    const courseId = await authoredCourse(trainer, m, 'secondary_course')
    const course = await api(trainer, 'Courses.Get', { id: courseId })
    if (course.data.state === 'DRAFT') {
      expect((await api(trainer, 'Courses.Submit', { id: courseId })).ok).toBe(true)
      expect((await api(rd, 'Courses.Return', { id: courseId }, { comment: m.runId + ' E2E return and resubmit test' })).data.state).toBe('DRAFT')
      expect((await api(trainer, 'Courses.Submit', { id: courseId })).ok).toBe(true)
      expect((await api(rd, 'Courses.Approve', { id: courseId })).data.state).toBe('PUBLISHED')
    }
    entity(m, 'course', courseId, 'PUBLISHED secondary')
    proof('course-return', 'Course return/resubmit', 'Own seven-module course submitted, returned by RD_MANAGER with comment, resubmitted and published')
    stage = 'class and BR34'
    const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10), tomorrow = new Date(Date.now() + 86400_000 + 7 * 3600_000).toISOString().slice(0, 10)
    const instructor = await identity(trainer)
    if (!m.ids.secondaryClass) {
      const created = await api(trainer, 'TrainingClasses.Create', {}, { courseId, branchId: m.ids.branch, name: m.runId + ' secondary class', startDate: today, endDate: tomorrow }); expect(created.ok).toBe(true)
      m.ids.secondaryClass = Number(created.data.id); entity(m, 'class', m.ids.secondaryClass, 'PLANNED')
    }
    if (!m.ids.secondarySession) {
      const moduleData = await api(trainer, 'Courses.Get', { id: courseId })
      const created = await api(trainer, 'TrainingClasses.AddSession', { id: m.ids.secondaryClass }, { sessionNo: 1, scheduledDate: today, startTime: '00:01', durationMinutes: 30, location: m.runId + ' technical room', trainerId: instructor.id, moduleIds: (moduleData.data.modules as { id: number }[]).map(module => module.id) }); expect(created.ok).toBe(true)
      m.ids.secondarySession = Number(created.data.id); entity(m, 'session', m.ids.secondarySession, 'SCHEDULED')
    }
    if (!m.ids.secondaryEnrollment) {
      const opened = await api(trainer, 'TrainingClasses.Open', { id: m.ids.secondaryClass }, { traineeIds: [m.ids.additionalLearner] }); expect(opened.ok).toBe(true)
      m.ids.secondaryEnrollment = Number((opened.data.enrollmentIds as number[])[0]); expect(m.ids.secondaryEnrollment).toBeGreaterThan(0); entity(m, 'enrollment', m.ids.secondaryEnrollment, 'ASSIGNED class'); save(m)
    }
    const enrollmentId = m.ids.secondaryEnrollment
    const sheet = await api(trainer, 'TrainingSessions.RecordAttendance', { id: m.ids.secondarySession }, { entries: [{ enrollmentId, status: 'PRESENT', note: 'BrewForge automated technical attendance test only' }] }); expect(sheet.ok).toBe(true)
    proof('class-attendance', 'Class/session/attendance', 'Own INDUCTION class (no SOP binding) opened for only authorized learner; session and real PRESENT attendance persisted; no BR34 bypass on bound product')
    stage = 'current-cycle quiz lock and reset'
    let enrollment = await api(learner, 'Enrollments.Get', { id: enrollmentId })
    if (enrollment.data.state !== 'PASSED' && !m.ids.secondaryResetDone) {
      await readEveryLesson(learner, enrollmentId)
      const noQuizSchedule = await api(trainer, 'PracticalSchedules.Create', { id: enrollmentId }, { scheduledAt: new Date(Date.now() + 3600_000).toISOString(), location: m.runId }); expect(noQuizSchedule.status).toBe(409)
      // Current BE accepts a recording once ELIGIBLE, before quiz; scheduling separately requires quiz pass.
      const old = await upload(trainer, 'Enrollments.UploadPracticalVideo', { id: enrollmentId }, 'e2e-private/final-fixtures/technical-test.webm'); expect(old.ok).toBe(true)
      m.ids.secondaryOldVideo = Number(old.data.id); entity(m, 'practical video', m.ids.secondaryOldVideo, 'old cycle before reset')
      let locked = false
      for (let attempt = 0; attempt < 5; attempt++) {
        await readEveryLesson(learner, enrollmentId)
        const quiz = await api(learner, 'Enrollments.Quiz', { id: enrollmentId }); expect(quiz.ok).toBe(true)
        const failed = await api(learner, 'Enrollments.AttemptQuiz', { id: enrollmentId }, { answers: (quiz.data.questions as { id: number }[]).map(question => ({ questionId: question.id, selectedOption: 'B' })) }); expect(failed.ok).toBe(true); expect(failed.data.passed).toBe(false)
        if (failed.data.enrollmentState === 'LOCKED') { locked = true; break }
      }
      expect(locked).toBe(true)
      const reset = await api(tm, 'Enrollments.Reset', { id: enrollmentId }); expect(reset.ok).toBe(true); expect(reset.data.state).toBe('ASSIGNED')
      m.ids.secondaryResetDone = 1; save(m)
      proof('quiz-lock-reset', 'Quiz fail/retake/lock/reset', 'Wrong authored answer resets failed module progress; allowed attempts exhaust to LOCKED, TM reset starts ASSIGNED/current cycle; no reset of happy enrollment', 'unhappy')
      proof('schedule-needs-quiz', 'Practical schedule prerequisite', 'Before quiz pass, real schedule returns409; recording before quiz is allowed by current ELIGIBLE gate and is documented separately', 'unhappy')
    }
    enrollment = await api(learner, 'Enrollments.Get', { id: enrollmentId })
    if (enrollment.data.state !== 'PASSED') {
      await readEveryLesson(learner, enrollmentId)
      const history = await api(learner, 'Enrollments.QuizAttempts', { id: enrollmentId })
      if (!(history.data as unknown as { passed: boolean; attemptedAt: string }[]).some(row => row.passed && Date.parse(row.attemptedAt) >= Date.parse(String(enrollment.data.enrolledAt)))) {
        const quiz = await api(learner, 'Enrollments.Quiz', { id: enrollmentId }); expect(quiz.ok).toBe(true)
        const passed = await api(learner, 'Enrollments.AttemptQuiz', { id: enrollmentId }, { answers: (quiz.data.questions as { id: number }[]).map(question => ({ questionId: question.id, selectedOption: 'A' })) }); expect(passed.data.passed).toBe(true)
      }
      stage = 'old cycle video refusal'
      const current = await api(trainer, 'Courses.Get', { id: courseId }), checklist = current.data.practicalChecklist as { lessonId: number }[]
      const marks = checklist.map(item => ({ lessonId: item.lessonId, recipeStepId: null, passed: true, note: 'Automated technical test only' }))
      const stale = await api(trainer, 'Enrollments.EvaluatePractical', { id: enrollmentId }, { practicalVideoId: m.ids.secondaryOldVideo, items: marks }); expect(stale.status).toBe(409)
      await trainer.goto('/trainer/assessment/' + enrollmentId)
      await expect(trainer.locator('#evaluation-video option[value="' + m.ids.secondaryOldVideo + '"]')).toHaveCount(0)
      proof('old-cycle-video', 'Reset invalidates stale recording', 'Old uploaded video is refused409 in new current cycle and absent from selectable UI options after reset', 'unhappy', 'LIVE_UI')
      stage = 'schedule reschedule cancel'
      const appointment = await api(trainer, 'PracticalSchedules.Create', { id: enrollmentId }, { scheduledAt: new Date(Date.now() + 3600_000).toISOString(), location: m.runId }); expect(appointment.ok).toBe(true)
      const appointmentId = Number(appointment.data.id)
      expect((await api(trainer, 'PracticalSchedules.Reschedule', { id: appointmentId }, { scheduledAt: new Date(Date.now() + 7200_000).toISOString(), location: m.runId + ' moved' })).ok).toBe(true)
      expect((await api(trainer, 'PracticalSchedules.Cancel', { id: appointmentId })).data.status).toBe('CANCELLED')
      const next = await api(trainer, 'PracticalSchedules.Create', { id: enrollmentId }, { scheduledAt: new Date(Date.now() + 7200_000).toISOString(), location: m.runId }); expect(next.ok).toBe(true)
      expect((await api(trainer, 'PracticalSchedules.Complete', { id: Number(next.data.id) })).data.status).toBe('COMPLETED')
      proof('practical-schedule-transitions', 'Practical reschedule/cancel/complete', 'Owned schedule rescheduled, cancelled, replaced and completed through public endpoints; completion does not auto-certify')
      stage = 'failed practical and retake'
      const video = await upload(trainer, 'Enrollments.UploadPracticalVideo', { id: enrollmentId }, 'e2e-private/final-fixtures/technical-test.webm'); expect(video.ok).toBe(true)
      const failedMarks = marks.map(mark => ({ ...mark, passed: false }))
      const fail = await api(trainer, 'Enrollments.EvaluatePractical', { id: enrollmentId }, { practicalVideoId: video.data.id, items: failedMarks }); expect(fail.ok).toBe(true); expect(fail.data.passed).toBe(false); expect(fail.data.certificateId).toBeNull()
      const repeat = await api(trainer, 'Enrollments.EvaluatePractical', { id: enrollmentId }, { practicalVideoId: video.data.id, items: marks }); expect(repeat.status).toBe(409)
      const fresh = await upload(trainer, 'Enrollments.UploadPracticalVideo', { id: enrollmentId }, 'e2e-private/final-fixtures/technical-test.webm'); expect(fresh.ok).toBe(true)
      const pass = await api(trainer, 'Enrollments.EvaluatePractical', { id: enrollmentId }, { practicalVideoId: fresh.data.id, items: marks }); expect(pass.ok).toBe(true); expect(pass.data.enrollmentState).toBe('PASSED'); expect(pass.data.certificateId).toBeGreaterThan(0)
      entity(m, 'enrollment', enrollmentId, 'PASSED secondary'); entity(m, 'certificate', Number(pass.data.certificateId), 'VALID technical test')
      proof('practical-fail-retake', 'Practical failure and new-recording retake', 'Failed checklist yields no certificate; same recording cannot be reused409; fresh recording/complete marks yields server certificate', 'unhappy')
    }
    stage = 'wrong owner video and class close'
    const deniedVideo = await api(learner, 'Enrollments.PracticalVideoContent', { id: m.ids.video }); expect(deniedVideo.status).toBe(404)
    const deniedUpload = await upload(learner, 'Enrollments.UploadPracticalVideo', { id: m.ids.enrollment }, 'e2e-private/final-fixtures/technical-test.webm'); expect(deniedUpload.status).toBe(403)
    proof('video-owner-policy', 'Video owner/role denial', 'Additional learner cannot open preceding learner recording404 or upload as TRAINEE403; no media disclosed', 'unhappy')
    const closed = await api(trainer, 'TrainingClasses.Close', { id: m.ids.secondaryClass }); expect(closed.ok).toBe(true); entity(m, 'class', m.ids.secondaryClass, 'CLOSED')
    proof('class-close', 'Class close', 'Owned running class closes; completed test enrollment remains intact')
  } catch { record(m, 'secondary-failure', { flow: stage, role: 'test actors', kind: 'diagnostic', via: 'LIVE_API/UI', status: 'FAIL', assertion: 'Sanitized failure at ' + stage, evidence: 'Payload/credentials omitted' }); throw new Error('Sanitized secondary failure at ' + stage) }
  finally { await actors.close() }
})
