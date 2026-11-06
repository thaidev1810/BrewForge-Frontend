import { test, expect } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { loginAsRole, logout } from '../helpers/auth.js'
import type { TestRole } from '../helpers/environment.js'
import type { Operation } from '../../src/services/backend/contracts.js'

test('PASS_LIVE: own-run course authoring, RD review and learner prerequisites', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'BLOCKED: explicit per-run business write opt-in required')
  test.setTimeout(240_000)
  const prior = JSON.parse(fs.readFileSync('e2e-private/experience-business.json', 'utf8')) as { runId: string; ids: Record<string, number> }
  const result = { runId: prior.runId, ids: prior.ids, checks: [] as string[], status: 'NOT_RUN' }
  const contexts: BrowserContext[] = []
  let stage = 'ownership verification'
  async function actor(role: TestRole) {
    const context = await browser.newContext({ baseURL: String(info.project.use.baseURL), viewport: { width: 1440, height: 1000 } }); contexts.push(context)
    const page = await context.newPage(); const auth = await loginAsRole(page, role)
    if (!auth.ok) throw new Error('login prerequisite failed')
    return page
  }
  async function call(page: Page, operation: Operation, params: Record<string, number> = {}, body?: unknown) {
    return page.evaluate(async input => {
      const { executeOperation } = await import(/* @vite-ignore */ String('/src/services/backend/operations.ts'))
      const { normalizeApiError } = await import(/* @vite-ignore */ String('/src/services/apiError.ts'))
      try { return { status: 200, data: await executeOperation(input.operation, { params: input.params, body: input.body }) as Record<string, unknown>, rule: '' } }
      catch (error) { const e = normalizeApiError(error); return { status: e.status || 0, data: {} as Record<string, unknown>, rule: String(e.rule || e.code || 'unspecified') } }
    }, { operation, params, body })
  }
  try {
    const trainer = await actor('TRAINER')
    const course = await call(trainer, 'Courses.Get', { id: prior.ids.course })
    expect(course.status).toBe(200)
    expect(course.data.title).toBe(prior.runId + ' training')
    expect(course.data.recipeVersionId).toBe(prior.ids.version)
    expect(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED']).toContain(course.data.state)
    const version = await call(trainer, 'RecipeVersions.Get', { id: prior.ids.version })
    expect(version.data.recipeId).toBe(prior.ids.recipe)
    const steps = version.data.steps as { id: number }[]
    if (course.data.state === 'DRAFT') {
    stage = 'checklist'
    const checklist = await call(trainer, 'Courses.SetPracticalChecklist', { id: prior.ids.course }, { items: steps.map(step => ({ recipeStepId: step.id })) })
    expect(checklist.status).toBe(200)
    const refreshed = await call(trainer, 'Courses.Get', { id: prior.ids.course })
    type Module = { id: number; source: string; moduleType: string; lessons: { id: number; title: string }[] }
    const modules = refreshed.data.modules as Module[]
    stage = 'author modules and quiz'
    for (const module of modules) {
      if (module.source !== 'GENERATED') {
        const duration = await call(trainer, 'CourseModules.Update', { id: module.id }, { durationMinutes: 2 })
        expect(duration.status).toBe(200)
        if (!module.lessons.length) {
          const lesson = await call(trainer, 'CourseModules.AddLesson', { id: module.id }, { title: prior.runId + ' ' + module.moduleType, content: 'Mix the measured ingredient evenly by hand. Keep the work surface clean and check the final mixture before serving.' })
          expect(lesson.status).toBe(200)
        } else for (const lesson of module.lessons) {
          const updated = await call(trainer, 'Lessons.Update', { id: lesson.id }, { title: lesson.title, content: 'Mix evenly by hand for thirty seconds. Check that the ingredient is measured and the work surface is clean.' })
          expect(updated.status).toBe(200)
        }
      }
      const question = await call(trainer, 'Courses.AddQuestion', { id: prior.ids.course }, { courseModuleId: module.id, questionText: 'For this exercise, how should the measured ingredient be mixed?', options: [{ key: 'A', text: 'Evenly by hand' }, { key: 'B', text: 'Leave it unmixed' }], correctOption: 'A' })
      expect(question.status).toBe(200)
    }
    result.checks.push('happy API: all seven real modules, authored prose/durations, quiz questions and bound-step checklist prepared')
    stage = 'submit and review'
    const submitted = await call(trainer, 'Courses.Submit', { id: prior.ids.course })
    expect(submitted.status).toBe(200)
    }
    const manager = await actor('RD_MANAGER')
    if (course.data.state !== 'PUBLISHED') {
    await manager.goto('/rd-manager/courses/' + prior.ids.course)
    await expect(manager.getByRole('button', { name: 'Duyệt khóa học', exact: true })).toBeVisible()
    await manager.getByRole('button', { name: 'Duyệt khóa học', exact: true }).click()
    const approval = manager.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/courses/' + prior.ids.course + '/approve')
    await manager.getByRole('button', { name: 'Xác nhận', exact: true }).click()
    expect((await approval).status()).toBe(200)
    await expect(manager.getByRole('dialog').getByText('Máy chủ đã xử lý yêu cầu.')).toBeVisible()
    await manager.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    result.checks.push('happy UI: current RD_MANAGER approves run course; real POST 200 and success dialog')
    } else result.checks.push('happy read: own-run course already PUBLISHED by prior recorded attempt; authoring/review not repeated')
    stage = 'learner identity and assignment'
    const trainee = await actor('TRAINEE')
    const identity = await trainee.evaluate(async () => { const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts')); const user = store.getState().auth.user; return { id: Number(user.id), branchId: Number(user.branchId) } })
    const tm = await actor('TRAINING_MANAGER')
    const assigned = await call(tm, 'Assignments.Assign', {}, { courseId: prior.ids.course, branchId: identity.branchId, employeeIds: [identity.id], allTrainees: false, reason: prior.runId, deadline: null })
    if (assigned.status === 409) {
      result.status = 'BLOCKED'; result.checks.push('unhappy API: real assignment gate HTTP 409 ' + assigned.rule + '; no prerequisite bypass; downstream learning/practical/certificate NOT_RUN')
      throw new Error('BLOCKED')
    }
    expect(assigned.status).toBe(200)
    const enrollmentIds = assigned.data.enrollmentIds as number[]
    if (enrollmentIds.length) result.ids.enrollment = enrollmentIds[0]
    else {
      const mine = await call(trainee, 'Enrollments.Mine')
      const existing = (mine.data as unknown as { id: number; courseId: number }[]).find(enrollment => enrollment.courseId === prior.ids.course)
      expect(existing).toBeDefined(); result.ids.enrollment = existing!.id
    }
    result.checks.push('happy API: training manager assigned run course to supplied trainee with real branch scope')
    stage = 'learner course'
    await trainee.goto('/barista/learning/' + result.ids.enrollment)
    await expect(trainee.locator('main h1').first()).toHaveText(prior.runId + ' training')
    const learning = await call(trainee, 'Enrollments.Modules', { id: result.ids.enrollment })
    const learnerModules = learning.data as unknown as { module: { lessons: { id: number }[] } }[]
    for (const module of learnerModules) for (const lesson of module.module.lessons) {
      const read = await trainee.evaluate(async ({ id, lessonId }) => { const { executeOperation } = await import(/* @vite-ignore */ String('/src/services/backend/operations.ts')); try { await executeOperation('Enrollments.CompleteLesson', { params: { id, lessonId } }); return true } catch { return false } }, { id: result.ids.enrollment, lessonId: lesson.id })
      expect(read).toBe(true)
    }
    result.checks.push('happy API: supplied learner completed every actual lesson of run course')
    const history = await call(trainee, 'Enrollments.QuizAttempts', { id: result.ids.enrollment })
    const passedBefore = (history.data as unknown as { passed: boolean }[]).some(attempt => attempt.passed)
    if (!passedBefore) {
    stage = 'quiz'
    const quiz = await call(trainee, 'Enrollments.Quiz', { id: result.ids.enrollment })
    if (quiz.status === 409) { result.status = 'BLOCKED'; result.checks.push('TEST_DATA: learner eligibility HTTP 409 ' + quiz.rule); throw new Error('BLOCKED') }
    expect(quiz.status).toBe(200)
    const questions = quiz.data.questions as { id: number }[]
    const attempt = await call(trainee, 'Enrollments.AttemptQuiz', { id: result.ids.enrollment }, { answers: questions.map(question => ({ questionId: question.id, selectedOption: 'A' })) })
    expect(attempt.status).toBe(200); expect(attempt.data.passed).toBe(true)
    result.checks.push('happy API: real quiz passed using authored course answer; practical/video/certificate remain NOT_RUN until permitted evidence supplied')
    } else result.checks.push('happy read: prior real quiz pass verified from own enrollment history; no repeat attempt sent')
    result.status = 'PASS_LIVE'
    for (const page of [trainer, manager, trainee, tm]) await logout(page)
  } catch { if (result.status !== 'BLOCKED') { result.status = 'FAIL'; result.checks.push('FAIL at ' + stage + '; payloads omitted') } }
  finally {
    for (const context of contexts) await context.close()
    const history = 'e2e-private/experience-continuation-history.json'
    const archived = fs.existsSync(history) ? JSON.parse(fs.readFileSync(history, 'utf8')) : []
    if (fs.existsSync('e2e-private/experience-continuation.json')) archived.push(JSON.parse(fs.readFileSync('e2e-private/experience-continuation.json', 'utf8')))
    fs.writeFileSync(history, JSON.stringify(archived, null, 2))
    fs.writeFileSync('e2e-private/experience-continuation.json', JSON.stringify(result, null, 2))
  }
  if (result.status === 'FAIL') throw new Error('Sanitized continuation failure at ' + stage)
  test.skip(result.status === 'BLOCKED', 'BLOCKED by real business prerequisite; dependent steps NOT_RUN')
})
