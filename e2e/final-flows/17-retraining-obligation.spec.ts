import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import ts from 'typescript'
import process from 'node:process'
import { Actors, api, identity } from './harness.js'
import { checkpoint, review, reviewed } from './review-registry.js'

test('REVIEW BE contract: a new retraining obligation must not close using a pre-action PASSED enrollment', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Authorized local test audit only')
  test.setTimeout(60_000)
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/product-review-operations.json'), state = review()
  const old = JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json', 'utf8')); let stage = 'channel and ownership'
  try {
    let email: Record<string, unknown> = {}
    for (const name of ['appsettings.json', 'appsettings.Development.json', 'appsettings.Local.json']) {
      const path = '../backend/src/BrewForge.Api/' + name
      if (fs.existsSync(path)) email = { ...email, ...(ts.parseConfigFileTextToJson(path, fs.readFileSync(path, 'utf8')).config?.Email ?? {}) }
    }
    expect(Boolean(email.From && (email.Host || email.PickupDirectory))).toBe(false)
    expect(Object.keys(process.env).some(key => /^(Email|Push)__/.test(key))).toBe(false)
    stage = 'real auth and original enrollment read'
    const learner = await actors.login('TRAINEE'), auditor = await actors.login('QUALITY_AUDITOR')
    stage = 'push-delivery prerequisite'
    expect((await api(auditor, 'Notifications.PushConfig')).data.enabled).toBe(false)
    stage = 'original trainee ownership and PASSED state'
    const who = await identity(learner), enrollment = await api(learner, 'Enrollments.Get', { id: old.ids.enrollment })
    expect(enrollment.data.userId).toBe(who.id); expect(enrollment.data.state).toBe('PASSED')
    stage = 'owned recipe identity'
    const parent = await api(auditor, 'Recipes.Get', { id: old.ids.recipe }); expect(parent.data.recipeCode).toBe(old.runId)
    stage = 'original certificate prerequisite'
    const certificates = await api(learner, 'Certificates.Mine'), prior = (certificates.data as unknown as { enrollmentId: number; issuedAt: string }[]).find(c => c.enrollmentId === old.ids.enrollment)!
    expect(prior).toBeTruthy()
    if (!state.ids.obligationAction) {
      stage = 'new owned audit'
      const audit = await api(auditor, 'BranchAudits.Create', {}, { branchId: who.branchId, recipeVersionId: old.ids.version, comment: state.runId + ' synthetic obligation regression; no real competency finding', retrainingRequired: true, employeeIds: [who.id], items: [{ criterion: state.runId + ' technical observation', expected: 'Synthetic pass', actual: 'Synthetic fail for obligation regression', passed: false, critical: false }] })
      expect(audit.ok).toBe(true); expect(audit.data.result).toBe('FAILED'); state.ids.obligationAudit = Number(audit.data.id); state.ids.obligationAction = Number(audit.data.correctiveActionId); checkpoint(state)
    }
    stage = 'existing owned obligation read'
    const action = await api(auditor, 'CorrectiveActions.Get', { id: state.ids.obligationAction }); expect(action.data.retrainingRequired).toBe(true)
    expect(Date.parse(prior.issuedAt)).toBeLessThan(Date.parse(String(action.data.createdAt)))
    const persistFinding = (status: 'FAIL' | 'PASS_LIVE_API', assertion: string) => reviewed('RETRAINING-OBLIGATION', { module: 'Quality/retraining', role: 'QUALITY_AUDITOR/TRAINEE', flow: 'New obligation versus historical pass', kind: 'unhappy', prerequisites: 'Fresh owned failed audit/action; existing provided trainee passed before action; no new learning after action', via: 'LIVE_API', assertion, status, evidence: 'Actual named employee retained; retrainingRequired remains true; source EnsureRetrainingPassedAsync only tests any PASSED course enrollment', blocker: status === 'FAIL' ? 'BE G-19: missing action→employee→enrollment/cycle obligation. FE cannot certify compliance or repair gate' : undefined })
    if (action.data.status === 'CLOSED') {
      stage = 'known historical CLOSED regression'
      persistFinding('FAIL', 'Previously observed in this round: owned action already CLOSED using pre-action pass; retain evidence and do not recreate or repeat close')
      throw new Error('BE G-19 remains reproduced: existing run-owned action CLOSED without a new learning cycle')
    }
    stage = 'retrain dedup and premature close'
    const assigned = await api(auditor, 'CorrectiveActions.AssignRetraining', { id: state.ids.obligationAction }, { courseId: old.ids.course }); expect(assigned.ok).toBe(true)
    expect(assigned.data.enrollmentIds).toEqual([]); expect((assigned.data.results as { outcome: string }[]).map(x => x.outcome)).toEqual(['ALREADY_ENROLLED'])
    const closed = await api(auditor, 'CorrectiveActions.Close', { id: state.ids.obligationAction }, { note: state.runId + ' technical premature-close regression, historical pass must not fulfill a new obligation' })
    const after = await api(auditor, 'CorrectiveActions.Get', { id: state.ids.obligationAction })
    const correct = closed.status === 409 && closed.rule === 'RETRAINING_INCOMPLETE' && after.data.status !== 'CLOSED'
    persistFinding(correct ? 'PASS_LIVE_API' : 'FAIL', correct ? 'New obligation refuses409 RETRAINING_INCOMPLETE; action retained open' : 'Actual retraining ALREADY_ENROLLED/no new enrollment; close returns' + closed.status + ' and action=' + String(after.data.status) + ' despite only a pre-action pass')
    expect(correct, 'New retraining obligation must require action-specific completion, not any historical pass').toBe(true)
  } catch { throw new Error('Sanitized retraining obligation regression at ' + stage + '; see RETRAINING-OBLIGATION case for observed gate') }
  finally { await actors.close() }
})
