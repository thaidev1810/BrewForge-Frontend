import { test, expect } from '@playwright/test'
import process from 'node:process'
import crypto from 'node:crypto'
import { Actors, api, entity, manifest, record, save, upload } from './harness.js'

test('authorized additional learner: legal prerequisites, practical certification and coverage 2 go-live', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true' || process.env.E2E_ALLOW_ADDITIONAL_TRAINEE !== 'true', 'Additional run-owned trainee requires explicit operator authorization')
  test.setTimeout(240_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'additional user'
  const proof = (id: string, flow: string, assertion: string, via = 'API_SETUP') => record(m, id, { flow, role: 'ADMIN/TRAINING_MANAGER/TRAINER/new test TRAINEE', kind: 'happy', via, status: via === 'LIVE_UI' ? 'PASS_LIVE_UI' : 'PASS_LIVE_API', assertion, evidence: `run ${m.runId}; IDs only in manifest` })
  try {
    const admin = await actors.login('ADMIN'), tm = await actors.login('TRAINING_MANAGER'), trainer = await actors.login('TRAINER'), manager = await actors.login('RD_MANAGER')
    const username = m.runId.toLowerCase() + '_learner2', password = 'T!' + crypto.randomBytes(18).toString('base64url') + '9a'
    const userBody = { username, password, email: username + '@example.invalid', fullName: 'BrewForge automated technical test learner 2', role: 'TRAINEE', branchId: m.ids.branch }
    if (!m.ids.additionalLearner) {
      const created = await api(admin, 'Users.Create', {}, userBody); expect(created.ok).toBe(true)
      m.ids.additionalLearner = Number(created.data.id); entity(m, 'authorized additional trainee', m.ids.additionalLearner, 'ACTIVE', 'complete legal course chain'); save(m)
    } else {
      const owned = await api(admin, 'Users.Get', { id: m.ids.additionalLearner })
      if (!owned.ok || owned.data.username !== username || owned.data.role !== 'TRAINEE' || owned.data.branchId !== m.ids.branch) throw new Error('Additional account ownership mismatch')
      const reset = await api(admin, 'Users.Update', { id: m.ids.additionalLearner }, { ...userBody, status: 'ACTIVE' }); expect(reset.ok).toBe(true)
    }
    m.safety = { ...m.safety, additionalRunOwnedTraineeAuthorized: true }; save(m)
    const learner = await actors.loginGenerated(username, password)
    proof('additional-user', 'Authorized additional test learner', 'Public ADMIN API creates/reuses verified run-owned TRAINEE; generated password only in memory, never stored')
    const path = await api(tm, 'LearningPath.Get', { userId: m.ids.additionalLearner }); expect(path.ok).toBe(true)
    const dependencies = new Map((path.data.stages as { courseType: string; prerequisiteType: string | null }[]).map(stage => [stage.courseType, stage.prerequisiteType]))
    const chain: string[] = [], visited = new Set<string>()
    let next = dependencies.get('PRODUCT')
    while (next) { if (visited.has(next)) throw new Error('Prerequisite cycle in actual path'); visited.add(next); chain.unshift(next); next = dependencies.get(next) }
    proof('prerequisite-graph', 'Actual prerequisite graph', `Server path requires ${chain.join(' → ') || 'no earlier course'} → PRODUCT; no shortcut`) 
    async function train(courseId: number, type: string) {
      stage = type + ' assign'
      const assigned = await api(tm, 'Assignments.Assign', {}, { courseId, branchId: m.ids.branch, employeeIds: [m.ids.additionalLearner], allTrainees: false, reason: m.runId + ' automated technical test' }); expect(assigned.ok).toBe(true)
      let enrollmentId = Number((assigned.data.enrollmentIds as number[])[0])
      if (!enrollmentId) {
        const mine = await api(learner, 'Enrollments.Mine'); enrollmentId = Number((mine.data as unknown as { id: number; courseId: number }[]).find(e => e.courseId === courseId)?.id)
      }
      expect(enrollmentId).toBeGreaterThan(0); m.ids['learner2_' + type] = enrollmentId; save(m)
      const existing = await api(learner, 'Enrollments.Get', { id: enrollmentId })
      if (existing.data.state === 'PASSED') return
      stage = type + ' lessons/quiz'
      const modules = await api(learner, 'Enrollments.Modules', { id: enrollmentId })
      for (const row of modules.data as unknown as { module: { lessons: { id: number }[] }; readLessonIds: number[] }[]) for (const lesson of row.module.lessons) {
        if (row.readLessonIds?.includes(lesson.id)) continue
        const read = await api(learner, 'Enrollments.CompleteLesson', { id: enrollmentId, lessonId: lesson.id }); expect(read.ok).toBe(true)
      }
      const attempts = await api(learner, 'Enrollments.QuizAttempts', { id: enrollmentId })
      if (!(attempts.data as unknown as { passed: boolean }[]).some(attempt => attempt.passed)) {
        const quiz = await api(learner, 'Enrollments.Quiz', { id: enrollmentId }); expect(quiz.ok).toBe(true)
        const questions = quiz.data.questions as { id: number }[]
        const passed = await api(learner, 'Enrollments.AttemptQuiz', { id: enrollmentId }, { answers: questions.map(question => ({ questionId: question.id, selectedOption: 'A' })) }); expect(passed.ok).toBe(true); expect(passed.data.passed).toBe(true)
      }
      stage = type + ' technical practical'
      const course = await api(trainer, 'Courses.Get', { id: courseId })
      const videos = await api(trainer, 'Enrollments.PracticalVideos', { id: enrollmentId })
      let videoId = Number((videos.data as unknown as { id: number; evaluationId: number | null }[]).find(video => !video.evaluationId)?.id)
      if (!videoId) { const recorded = await upload(trainer, 'Enrollments.UploadPracticalVideo', { id: enrollmentId }, 'e2e-private/final-fixtures/technical-test.webm'); expect(recorded.ok).toBe(true); videoId = Number(recorded.data.id) }
      entity(m, 'practical video', videoId, 'UPLOADED synthetic')
      const bound = course.data.recipeVersionId !== null
      const marks = (course.data.practicalChecklist as { recipeStepId: number | null; lessonId: number }[]).map(item => ({ recipeStepId: bound ? item.recipeStepId : null, lessonId: bound ? null : item.lessonId, passed: true, note: 'BrewForge automated technical test; not human competency evidence' }))
      const evaluation = await api(trainer, 'Enrollments.EvaluatePractical', { id: enrollmentId }, { practicalVideoId: videoId, items: marks })
      expect(evaluation.ok).toBe(true); expect(evaluation.data.enrollmentState).toBe('PASSED'); expect(evaluation.data.certificateId).toBeGreaterThan(0)
      entity(m, 'enrollment', enrollmentId, 'PASSED'); entity(m, 'certificate', Number(evaluation.data.certificateId), 'VALID synthetic test data')
      proof('additional-learn-' + type, 'Additional learner ' + type, 'Public assignment → every actual lesson → quiz → real synthetic video/evaluation → server certificate; no rules bypassed')
    }
    for (const type of chain) {
      if (!m.ids['prerequisite_' + type]) {
        stage = type + ' create course'
        const made = await api(trainer, 'Courses.Create', {}, { courseType: type, title: m.runId + ' prerequisite ' + type, recipeVersionId: null }); expect(made.ok).toBe(true)
        const courseId = Number(made.data.id); m.ids['prerequisite_' + type] = courseId; entity(m, 'course', courseId, 'DRAFT run-owned prerequisite')
        const course = await api(trainer, 'Courses.Get', { id: courseId })
        for (const module of course.data.modules as { id: number; moduleType: string }[]) {
          const duration = await api(trainer, 'CourseModules.Update', { id: module.id }, { durationMinutes: 1 }); expect(duration.ok).toBe(true)
          const lesson = await api(trainer, 'CourseModules.AddLesson', { id: module.id }, { title: m.runId + ' ' + module.moduleType, content: 'BrewForge automated technical test. Clean the work surface and mix the measured ingredient evenly by hand.' }); expect(lesson.ok).toBe(true)
          const question = await api(trainer, 'Courses.AddQuestion', { id: courseId }, { courseModuleId: module.id, questionText: 'What should be cleaned before preparing the exercise?', options: [{ key: 'A', text: 'The work surface' }, { key: 'B', text: 'Nothing' }], correctOption: 'A' }); expect(question.ok).toBe(true)
        }
        const submit = await api(trainer, 'Courses.Submit', { id: courseId }); expect(submit.ok).toBe(true)
        const approve = await api(manager, 'Courses.Approve', { id: courseId }); expect(approve.ok).toBe(true); entity(m, 'course', courseId, 'PUBLISHED run-owned prerequisite')
      }
      await train(m.ids['prerequisite_' + type], type)
    }
    await train(m.ids.course, 'PRODUCT')
    stage = 'coverage 2 and UI go-live'
    const readiness = await api(manager, 'Pilots.Readiness', { id: m.ids.pilot }); expect(readiness.ok).toBe(true)
    const branch = (readiness.data.branches as { branchId: number; certifiedCount: number; minCertifiedStaff: number; coverageMet: boolean; launchStatus: string }[]).find(row => row.branchId === m.ids.branch)!
    expect(branch.minCertifiedStaff).toBe(2); expect(branch.certifiedCount).toBeGreaterThanOrEqual(2); expect(branch.coverageMet).toBe(true)
    m.ids.certifiedCount = branch.certifiedCount; save(m)
    if (branch.launchStatus !== 'LIVE') {
      await manager.goto('/rd-manager/pilots/' + m.ids.pilot)
      await manager.locator('#live-branch').selectOption(String(m.ids.branch))
      await manager.getByRole('button', { name: 'Mở bán', exact: true }).click()
      const live = manager.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/branches/' + m.ids.branch + '/go-live'))
      await manager.getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await live).status()).toBe(200)
      await manager.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    }
    const launches = await api(manager, 'BranchLaunchStatus.List', {}, undefined, { branchId: m.ids.branch, recipeId: m.ids.recipe })
    const launch = (launches.data as unknown as { id: number; status: string; recipeVersionId: number }[]).find(row => row.recipeVersionId === m.ids.version)!
    expect(launch.status).toBe('LIVE'); m.ids.launch = launch.id; entity(m, 'launch', launch.id, 'LIVE')
    proof('go-live', 'NEW drink go-live', 'UI opens branch only after server coverage=2 on exact SOP; persisted launch status LIVE', 'LIVE_UI')
  } catch { record(m, 'coverage-failure', { flow: stage, role: 'test actors', kind: 'diagnostic', via: 'API_SETUP/LIVE_UI', status: 'FAIL', assertion: 'Sanitized failure at ' + stage, evidence: 'No generated credentials retained' }); throw new Error('Sanitized coverage failure at ' + stage) }
  finally { await actors.close() }
})
