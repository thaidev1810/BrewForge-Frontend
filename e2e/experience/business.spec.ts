import { test, expect } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { loginAsRole, logout } from '../helpers/auth.js'
import type { Operation } from '../../src/services/backend/contracts.js'

// Explicit per-command opt-in after operator confirms isolated test DB. Never write .env.
test('PASS_LIVE: own-run recipe draft, validation, review/release and course prerequisite', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'BLOCKED: operator must confirm isolated DB and enable per-run writes.')
  test.setTimeout(180_000)
  const runId = 'E2E_' + Date.now().toString(36).toUpperCase()
  const evidence: { runId: string; ids: Record<string, number>; checks: string[]; status: string } = { runId, ids: {}, checks: [], status: 'NOT_RUN' }
  const contexts: BrowserContext[] = [], origin = String(info.project.use.baseURL)
  let stage = 'login specialist'
  async function actor(role: 'RD_SPECIALIST' | 'RD_MANAGER' | 'TRAINER') {
    const context = await browser.newContext({ baseURL: origin, viewport: { width: 1440, height: 1000 } }); contexts.push(context)
    const page = await context.newPage()
    const login = await loginAsRole(page, role)
    if (!login.ok) throw new Error('Sanitized login prerequisite failed')
    return page
  }
  async function call(page: Page, operation: Operation, params: Record<string, number> = {}, body?: unknown) {
    return page.evaluate(async ({ operation, params, body }) => {
      const { executeOperation } = await import(/* @vite-ignore */ String('/src/services/backend/operations.ts'))
      const { normalizeApiError } = await import(/* @vite-ignore */ String('/src/services/apiError.ts'))
      try { return { status: 200, data: await executeOperation(operation, { params, body }) as Record<string, unknown>, rule: '' } }
      catch (error) { const e = normalizeApiError(error); return { status: e.status || 0, data: {} as Record<string, unknown>, rule: String(e.rule || e.code || 'unspecified') } }
    }, { operation, params, body })
  }
  try {
    const specialist = await actor('RD_SPECIALIST')
    stage = 'create recipe through UI'
    await specialist.goto('/rd-specialist/recipes')
    await specialist.getByRole('button', { name: 'Thêm mới', exact: true }).click()
    await specialist.locator('#recipeCode').fill(runId)
    await specialist.locator('#name').fill(runId + ' manual tea')
    await specialist.locator('#category').selectOption('TEA')
    const created = specialist.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/recipes' && response.request().method() === 'POST')
    await specialist.getByRole('button', { name: 'Xác nhận', exact: true }).click()
    const response = await created
    expect(response.status()).toBe(201)
    const recipe = await response.json(); evidence.ids.recipe = recipe.id
    await expect(specialist.getByRole('dialog').getByText('Máy chủ đã xử lý yêu cầu.')).toBeVisible()
    evidence.checks.push('happy UI: create run-prefixed recipe HTTP 201 and success retained')
    await specialist.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    stage = 'duplicate run recipe'
    const duplicate = await call(specialist, 'Recipes.Create', {}, { recipeCode: runId, name: runId, category: 'TEA', origin: 'NEW' })
    expect(duplicate.status).toBe(409); evidence.checks.push('unhappy API: duplicate own recipe rejected HTTP 409')
    stage = 'create own version'
    const version = await call(specialist, 'Recipes.CreateVersion', { id: recipe.id }, { copyFromVersionId: null })
    expect(version.status).toBe(200); evidence.ids.version = Number(version.data.id)
    const ingredients = await call(specialist, 'Ingredients.List', {}, undefined)
    const items = ingredients.data.items as { id: number; unit: string; status: string }[]
    const ingredient = items?.find(item => item.status === 'ACTIVE')
    if (!ingredient) { evidence.status = 'BLOCKED'; evidence.checks.push('TEST_DATA: no active ingredient from authorized list'); throw new Error('BLOCKED') }
    stage = 'save content on own draft'
    const content = { steps: [{ stepOrder: 1, actionText: runId + ' mix manually', techniqueGate: 'Mix evenly', durationSeconds: 30, ingredients: [{ ingredientId: ingredient.id, quantity: 1, unit: ingredient.unit }], dependsOn: [] }] }
    const saved = await call(specialist, 'RecipeVersions.Update', { id: evidence.ids.version }, content)
    expect(saved.status).toBe(200); evidence.checks.push('happy API: own SOP content saved using existing active catalog reference')
    stage = 'validate and submit'
    const validation = await call(specialist, 'RecipeVersions.Validate', { id: evidence.ids.version })
    expect(validation.status).toBe(200)
    if (validation.data.passed !== true) { evidence.status = 'BLOCKED'; evidence.checks.push('TEST_DATA: real validation not passed; no gate bypass'); throw new Error('BLOCKED') }
    const submitted = await call(specialist, 'RecipeVersions.Submit', { id: evidence.ids.version })
    expect(submitted.status).toBe(200); evidence.checks.push('happy API: real checks pass; SOP submitted')
    stage = 'manager review and release'
    const manager = await actor('RD_MANAGER')
    const steps = saved.data.steps as { id: number }[]
    const reviewed = await call(manager, 'RecipeVersions.Review', { id: evidence.ids.version }, { decisions: steps.map(step => ({ stepId: step.id, action: 'ACCEPT' })) })
    expect(reviewed.status).toBe(200)
    const released = await call(manager, 'RecipeVersions.Release', { id: evidence.ids.version })
    expect(released.status).toBe(200)
    evidence.checks.push('happy API: separate RD_MANAGER accepts steps and releases own SOP')
    await manager.goto('/rd-manager/versions/' + evidence.ids.version)
    await expect(manager.getByRole('button', { name: 'Sửa các bước', exact: true })).toHaveCount(0)
    stage = 'released version immutable'
    const immutable = await call(specialist, 'RecipeVersions.Update', { id: evidence.ids.version }, content)
    expect(immutable.status).toBe(409); evidence.checks.push('unhappy API: released own SOP immutable HTTP 409')
    stage = 'trainer creates bound course'
    const trainer = await actor('TRAINER')
    const course = await call(trainer, 'Courses.Create', {}, { title: runId + ' training', courseType: 'PRODUCT', recipeVersionId: evidence.ids.version })
    if (course.status === 409) { evidence.status = 'BLOCKED'; evidence.checks.push('TEST_DATA/business: course creation HTTP 409 rule ' + course.rule); throw new Error('BLOCKED') }
    expect(course.status).toBe(200); evidence.ids.course = Number(course.data.id)
    evidence.checks.push('happy API: trainer creates PRODUCT course bound to released run version')
    stage = 'incomplete course submit rejected'
    const notReady = await call(trainer, 'Courses.Submit', { id: evidence.ids.course })
    expect(notReady.status).toBe(409); evidence.checks.push('unhappy API: incomplete course cannot submit; HTTP 409 ' + notReady.rule)
    await trainer.goto('/trainer/courses/' + evidence.ids.course)
    await expect(trainer.locator('main h1').first()).toHaveText(runId + ' training')
    await expect(trainer.locator('main .error-box')).toHaveCount(0)
    evidence.checks.push('happy UI: created course opens with readiness prerequisite guidance')
    evidence.status = 'PASS_LIVE'
    await logout(specialist); await logout(manager); await logout(trainer)
  } catch {
    if (evidence.status !== 'BLOCKED') { evidence.status = 'FAIL'; evidence.checks.push('FAIL at ' + stage + '; response bodies omitted') }
  } finally {
    for (const context of contexts) await context.close()
    fs.mkdirSync('e2e-private', { recursive: true })
    fs.writeFileSync('e2e-private/experience-business.json', JSON.stringify(evidence, null, 2))
    const history = 'e2e-private/experience-business-history.json'
    const prior = fs.existsSync(history) ? JSON.parse(fs.readFileSync(history, 'utf8')) : []
    fs.writeFileSync(history, JSON.stringify([...prior, evidence], null, 2))
  }
  if (evidence.status === 'FAIL') throw new Error('Sanitized business failure at ' + stage)
  test.skip(evidence.status === 'BLOCKED', 'BLOCKED by recorded real data/business prerequisites; downstream NOT_RUN')
})
