import { test, expect } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'
import type { Operation } from '../../src/services/backend/contracts.js'
import type { TestRole } from '../helpers/environment.js'
import { loginAsRole, logout } from '../helpers/auth.js'
import process from 'node:process'
import fs from 'node:fs'

test('PASS_LIVE: own failed audit, retraining dedup and incomplete closure denial', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'BLOCKED: isolated DB write confirmation required')
  test.setTimeout(120_000)
  const run = JSON.parse(fs.readFileSync('e2e-private/experience-continuation.json', 'utf8')) as { runId: string; ids: Record<string, number> }
  const result = { runId: run.runId, ids: { ...run.ids }, checks: [] as string[], status: 'NOT_RUN' }
  const contexts: BrowserContext[] = []
  let stage = 'identities'
  async function actor(role: TestRole) {
    const context = await browser.newContext({ baseURL: String(info.project.use.baseURL) }); contexts.push(context)
    const page = await context.newPage(); const auth = await loginAsRole(page, role)
    if (!auth.ok) throw new Error('login prerequisite')
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
    const trainee = await actor('TRAINEE')
    const identity = await trainee.evaluate(async () => { const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts')); const user = store.getState().auth.user; return { id: Number(user.id), branchId: Number(user.branchId) } })
    await logout(trainee)
    const auditor = await actor('QUALITY_AUDITOR')
    stage = 'create own test audit'
    const audit = await call(auditor, 'BranchAudits.Create', {}, { branchId: identity.branchId, recipeVersionId: run.ids.version, comment: run.runId + ' E2E test audit, synthetic test observation', retrainingRequired: true, employeeIds: [identity.id], items: [{ criterion: run.runId + ' mixing', expected: 'Even mixing', actual: 'E2E simulated failed observation', passed: false, critical: true }] })
    expect(audit.status).toBe(200); expect(audit.data.result).toBe('FAILED')
    result.ids.audit = Number(audit.data.id); result.ids.action = Number(audit.data.correctiveActionId)
    expect(result.ids.action).toBeGreaterThan(0)
    result.checks.push('happy API: test-labelled failed audit computed by server and corrective action created atomically')
    await auditor.goto('/quality-auditor/branch-audits/' + result.ids.audit)
    await expect(auditor.locator('main h1').first()).toBeVisible()
    await expect(auditor.locator('main .state-panel[role="status"]')).toHaveCount(0)
    await expect(auditor.locator('main .error-box')).toHaveCount(0)
    result.checks.push('happy UI: own audit detail rendered')
    stage = 'retraining options and dedup'
    const options = await call(auditor, 'CorrectiveActions.RetrainingOptions', { id: result.ids.action })
    expect(options.status).toBe(200)
    expect((options.data.courses as { courseId: number }[]).some(course => course.courseId === run.ids.course)).toBe(true)
    const retrain = await call(auditor, 'CorrectiveActions.AssignRetraining', { id: result.ids.action }, { courseId: run.ids.course })
    expect(retrain.status).toBe(200)
    const outcomes = retrain.data.results as { outcome: string }[]
    expect(outcomes.map(row => row.outcome)).toEqual(['ALREADY_ENROLLED'])
    expect(retrain.data.enrollmentIds).toEqual([])
    result.checks.push('unhappy API: existing run enrollment reported ALREADY_ENROLLED without duplicate or fake retraining completion')
    stage = 'closure denied until passed'
    const close = await call(auditor, 'CorrectiveActions.Close', { id: result.ids.action }, { note: run.runId + ' closure gate test' })
    expect(close.status).toBe(409); expect(close.rule).toBe('RETRAINING_INCOMPLETE')
    result.checks.push('unhappy API: closure HTTP 409 RETRAINING_INCOMPLETE; practical/certificate gate preserved')
    result.status = 'PASS_LIVE'; await logout(auditor)
  } catch { result.status = 'FAIL'; result.checks.push('FAIL at ' + stage + '; payload omitted') }
  finally { for (const context of contexts) await context.close(); fs.writeFileSync('e2e-private/experience-quality.json', JSON.stringify(result, null, 2)) }
  if (result.status === 'FAIL') throw new Error('Sanitized quality failure at ' + stage)
})
