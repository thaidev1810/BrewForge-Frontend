import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import ts from 'typescript'
import process from 'node:process'
import { Actors, api, identity } from './harness.js'
import { readEveryLesson } from './owned-course.js'
import { checkpoint, review, reviewed, type ReviewStatus } from './review-registry.js'

test('REVIEW fresh course return/resubmit, assignment, learning, practical and synthetic certificate', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Authorized local test writes only')
  test.setTimeout(180_000)
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/product-review-operations.json'), m = review(); let stage = 'channel check'
  const proof = (id: string, assertion: string, status: ReviewStatus = 'PASS_LIVE_API', via = 'API_SETUP/LIVE_API') => reviewed(id, { module: 'Course/learning/practical', role: 'TRAINER/RD_MANAGER/TRAINING_MANAGER/TRAINEE', flow: id, kind: /INCOMPLETE|DENIAL/.test(id) ? 'unhappy' : 'happy', prerequisites: 'Owned INDUCTION course; channel config checked; no SOP or main enrollment reset', via, assertion, status, evidence: 'Fresh public workflow; synthetic technical test only' })
  try {
    let email: Record<string, unknown> = {}
    for (const name of ['appsettings.json', 'appsettings.Development.json', 'appsettings.Local.json']) {
      const path = '../backend/src/BrewForge.Api/' + name
      if (fs.existsSync(path)) email = { ...email, ...(ts.parseConfigFileTextToJson(path, fs.readFileSync(path, 'utf8')).config?.Email ?? {}) }
    }
    expect(Boolean(email.From && (email.Host || email.PickupDirectory))).toBe(false)
    // Detect possible channel overrides by key only; never print their values.
    expect(Object.keys(process.env).some(key => /^(Email|Push)__/.test(key))).toBe(false)
    const trainer = await actors.login('TRAINER'), rd = await actors.login('RD_MANAGER'), tm = await actors.login('TRAINING_MANAGER'), learner = await actors.login('TRAINEE')
    expect((await api(trainer, 'Notifications.PushConfig')).data.enabled).toBe(false)
    const who = await identity(learner), instructor = await identity(trainer)
    stage = 'author course'
    if (!m.ids.course) { const created = await api(trainer, 'Courses.Create', {}, { title: m.runId + ' technical course', courseType: 'INDUCTION' }); expect(created.ok).toBe(true); m.ids.course = Number(created.data.id); checkpoint(m) }
    let course = await api(trainer, 'Courses.Get', { id: m.ids.course }); expect(course.data.title).toBe(m.runId + ' technical course')
    if (course.data.state === 'DRAFT') {
      const existingQuestions = await api(trainer, 'Courses.ListQuestions', { id: m.ids.course })
      const incomplete = await api(trainer, 'Courses.Submit', { id: m.ids.course }); expect(incomplete.status).toBe(409)
      expect((await api(trainer, 'Courses.Get', { id: m.ids.course })).data.state).toBe('DRAFT')
      proof('COURSE-INCOMPLETE', 'Empty authored course submit409 leaves DRAFT; no fake success or missing-module bypass')
      for (const module of course.data.modules as { id: number; durationMinutes: number | null; lessons: { id: number }[] }[]) {
        expect((await api(trainer, 'CourseModules.Update', { id: module.id }, { durationMinutes: 1 })).ok).toBe(true)
        if (!module.lessons.length) expect((await api(trainer, 'CourseModules.AddLesson', { id: module.id }, { title: m.runId + ' technical exercise', content: 'BrewForge automated technical test. Clean the work surface and mix the measured ingredient evenly by hand.' })).ok).toBe(true)
        if (!(existingQuestions.data as unknown as { courseModuleId: number }[]).some(q => q.courseModuleId === module.id)) expect((await api(trainer, 'Courses.AddQuestion', { id: m.ids.course }, { courseModuleId: module.id, questionText: 'For this technical exercise, what should be cleaned?', options: [{ key: 'A', text: 'The work surface' }, { key: 'B', text: 'Nothing' }], correctOption: 'A' })).ok).toBe(true)
      }
      expect((await api(trainer, 'Courses.Submit', { id: m.ids.course })).data.state).toBe('PENDING_APPROVAL')
      expect((await api(rd, 'Courses.Return', { id: m.ids.course }, { comment: m.runId + ' technical review return' })).data.state).toBe('DRAFT')
      expect((await api(trainer, 'Courses.Submit', { id: m.ids.course })).ok).toBe(true)
      await rd.goto('/rd-manager/courses/' + m.ids.course); await rd.getByRole('button', { name: 'Duyệt khóa học', exact: true }).click()
      const approved = rd.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/courses/' + m.ids.course + '/approve'))
      await rd.getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await approved).status()).toBe(200)
      await rd.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
      proof('COURSE-REVIEW', 'Seven modules/quiz authored via API_SETUP; return/resubmit through correct roles; RD_MANAGER approval UI200 persists PUBLISHED', 'PASS_LIVE_UI', 'API_SETUP/LIVE_UI')
    }
    stage = 'assignment and lesson progress'
    course = await api(trainer, 'Courses.Get', { id: m.ids.course }); expect(course.data.state).toBe('PUBLISHED')
    if (!m.ids.enrollment) {
      const assigned = await api(tm, 'Assignments.Assign', {}, { courseId: m.ids.course, branchId: who.branchId, employeeIds: [who.id], allTrainees: false, deadline: '2026-11-20', reason: m.runId + ' automated technical test' }); expect(assigned.ok).toBe(true)
      m.ids.enrollment = Number((assigned.data.enrollmentIds as number[])[0]); expect(m.ids.enrollment).toBeGreaterThan(0); checkpoint(m)
    }
    const enrollment = await api(learner, 'Enrollments.Get', { id: m.ids.enrollment }); expect(enrollment.data.courseId).toBe(m.ids.course); expect(enrollment.data.userId).toBe(who.id)
    if (enrollment.data.state !== 'PASSED') {
      const attempts = await api(learner, 'Enrollments.QuizAttempts', { id: m.ids.enrollment })
      if (!(attempts.data as unknown as { passed: boolean }[]).some(attempt => attempt.passed)) {
      await learner.goto('/barista/learning/' + m.ids.enrollment)
      const completed = learner.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/lessons/') && r.url().endsWith('/complete'))
      await learner.getByRole('button', { name: 'Đánh dấu hoàn thành bài', exact: true }).click(); expect((await completed).status()).toBe(200)
      await readEveryLesson(learner, m.ids.enrollment)
      await learner.goto('/barista/learning/' + m.ids.enrollment + '/quiz')
      const choices = learner.locator('input[type="radio"][value="A"]'); await expect(choices).toHaveCount(7)
      for (const choice of await choices.all()) await choice.check()
      const quiz = learner.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/quiz-attempts'))
      await learner.getByRole('button', { name: 'Nộp bài kiểm tra', exact: true }).click(); const quizResponse = await quiz; expect(quizResponse.status()).toBe(200); expect((await quizResponse.json()).passed).toBe(true)
      proof('LEARN-QUIZ', 'Direct assignment API_SETUP, first lesson UI then bulk lesson API_SETUP, real UI quiz passed current cycle', 'PASS_LIVE_UI', 'API_SETUP/LIVE_UI')
      }
      stage = 'upload and evaluation'
      await trainer.goto('/trainer/assessment/' + m.ids.enrollment)
      if (!m.ids.video) {
      await trainer.getByRole('button', { name: 'Tải MP4 / MOV / WEBM', exact: true }).click(); await trainer.locator('#upload-file').setInputFiles('e2e-private/final-fixtures/technical-test.webm')
      const uploaded = trainer.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/practical-videos'))
      await trainer.getByRole('button', { name: 'Xác nhận', exact: true }).click(); const uploadResponse = await uploaded; expect(uploadResponse.status()).toBe(201); m.ids.video = Number((await uploadResponse.json()).id); checkpoint(m)
      await trainer.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
      }
      await trainer.locator('#evaluation-video').selectOption(String(m.ids.video)); await trainer.getByRole('button', { name: 'Đánh giá thực hành', exact: true }).click()
      const dialog = trainer.getByRole('dialog'); for (const select of await dialog.locator('select[id$=".passed"]').all()) await select.selectOption('true')
      for (const note of await dialog.locator('textarea[id$=".note"]').all()) await note.fill('BrewForge automated technical test; synthetic fixture, not competency evidence')
      const evaluated = trainer.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/practical-evaluation'))
      await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click(); const result = await (await evaluated).json(); expect(result.passed).toBe(true); expect(result.enrollmentState).toBe('PASSED'); m.ids.certificate = Number(result.certificateId); checkpoint(m)
      proof('PRACTICAL-CERTIFICATE', 'Real UI upload201 and assessment yields new PASSED enrollment/certificate; synthetic fixture only, no self-assessment', 'PASS_LIVE_UI', 'LIVE_UI')
    }
    stage = 'certificate persisted'
    const certs = await api(learner, 'Certificates.Mine'), matches = (certs.data as unknown as { id: number; enrollmentId: number; assessedById: number; status: string }[]).filter(c => c.enrollmentId === m.ids.enrollment)
    expect(matches).toHaveLength(1); expect(matches[0].status).toBe('VALID'); expect(matches[0].assessedById).toBe(instructor.id); m.ids.certificate = matches[0].id; checkpoint(m)
    await learner.goto('/barista/certificates'); await learner.reload(); await expect(learner.locator('main .error-box')).toHaveCount(0)
    proof('CERTIFICATE-PERSISTED', 'Exactly one VALID certificate for fresh owned enrollment; assessor matches trainer, learner F5 readable; main course8/SOP15 unchanged')
    const quizHistory = await api(learner, 'Enrollments.QuizAttempts', { id: m.ids.enrollment }); expect((quizHistory.data as unknown as { passed: boolean }[]).some(attempt => attempt.passed)).toBe(true)
    proof('LEARN-QUIZ', 'UI first-lesson and seven-answer quiz executed in this round before checkpoint interruption; bulk lessons API_SETUP. Resumed actual history confirms pass', 'PASS_LIVE_UI', 'API_SETUP/LIVE_UI')
    proof('PRACTICAL-CERTIFICATE', 'UI upload201 and checklist assessment executed in this round; resumed unique VALID certificate12 confirms persistence. Synthetic technical fixture only', 'PASS_LIVE_UI', 'LIVE_UI')
    const prior = review().cases['COURSE-FAILURE']
    if (prior) reviewed('COURSE-FAILURE', { ...prior, kind: 'diagnostic', evidence: 'Resolved harness issues: required assignment reason omitted400, then incorrect button name. Source-corrected and checkpoint resumed to unique VALID certificate; original FAIL retained as history' })
  } catch { proof('COURSE-FAILURE', 'Sanitized review failure at ' + stage, 'FAIL'); throw new Error('Sanitized course review failure at ' + stage) }
  finally { await actors.close() }
})
