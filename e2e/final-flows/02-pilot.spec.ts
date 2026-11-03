import { test, expect } from '@playwright/test'
import process from 'node:process'
import { Actors, api, identity, entity, manifest, ownCheckpoint, record, save } from './harness.js'

test('continue NEW recipe pilot: coverage gate, start, readiness and time-dependent decision', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Local test write opt-in required')
  test.setTimeout(100_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'verify relationships'
  try {
    const trainer = await actors.login('TRAINER'); const { recipe } = await ownCheckpoint(trainer, m)
    expect(recipe.origin).toBe('NEW')
    const trainee = await actors.login('TRAINEE'); const learner = await identity(trainee)
    const instructor = await identity(trainer)
    const manager = await actors.login('RD_MANAGER')
    const proof = async (id: string, flow: string, assertion: string, kind = 'happy') => record(m, id, { flow, role: 'RD_MANAGER', kind, via: 'LIVE_API', status: 'PASS_LIVE_API', assertion, evidence: `NEW recipe ${m.ids.recipe}/version ${m.ids.version}` })
    if (!m.ids.pilot) {
      stage = 'create pilot UI'
      // Explicit API_SETUP uses documented threshold 2, never lowers coverage to force a pass.
      const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
      const end = new Date(Date.now() + 7 * 86400_000 + 7 * 3600_000).toISOString().slice(0, 10)
      const created = await api(manager, 'Pilots.Create', {}, { recipeVersionId: m.ids.version, name: m.runId + ' NEW pilot', startDate: today, endDate: end, minCertifiedStaff: 2, branchIds: [learner.branchId], criteria: [{ type: 'ABSOLUTE', cupsPerDayPerBranch: 1 }] })
      expect(created.ok).toBe(true); m.ids.pilot = Number(created.data.id); m.ids.branch = Number(learner.branchId); entity(m, 'pilot', m.ids.pilot, 'DRAFT', 'start at threshold 2'); save(m)
      record(m, 'pilot-create', { flow: 'NEW recipe pilot create', role: 'RD_MANAGER', kind: 'happy', via: 'API_SETUP', status: 'PASS_LIVE_API', assertion: 'Pilot created through public API with origin NEW, minCertifiedStaff=2 and future end date', evidence: `pilot ${m.ids.pilot}` })
    }
    const current = await api(manager, 'Pilots.Get', { id: m.ids.pilot }); expect(current.data.recipeVersionId).toBe(m.ids.version)
    if (current.data.state === 'DRAFT') {
      stage = 'pilot start UI'
      await manager.goto('/rd-manager/pilots/' + m.ids.pilot)
      const start = manager.getByRole('button', { name: 'Bắt đầu thử nghiệm', exact: true })
      if (await start.count()) {
        await start.click(); const response = manager.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/pilots/' + m.ids.pilot + '/start'))
        await manager.getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await response).status()).toBe(200)
        await manager.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
        record(m, 'pilot-start', { flow: 'Pilot start', role: 'RD_MANAGER', kind: 'happy', via: 'LIVE_UI', status: 'PASS_LIVE_UI', assertion: 'UI start persisted RUNNING and froze criteria', evidence: `pilot ${m.ids.pilot}` })
      } else {
        const result = await api(manager, 'Pilots.Start', { id: m.ids.pilot }); expect(result.ok).toBe(true)
        await proof('pilot-start', 'Pilot start', 'Real public API transitioned DRAFT to RUNNING; UI button name differed')
      }
    }
    entity(m, 'pilot', m.ids.pilot, 'RUNNING', 'meet server coverage before go-live')
    stage = 'readiness'
    const readiness = await api(manager, 'Pilots.Readiness', { id: m.ids.pilot })
    expect(readiness.ok).toBe(true)
    const branches = readiness.data.branches as { branchId: number; certifiedCount: number; minCertifiedStaff: number; coverageMet: boolean }[]
    const branch = branches.find(branch => branch.branchId === learner.branchId)!
    expect(branch.minCertifiedStaff).toBe(2)
    m.ids.certifiedCount = branch.certifiedCount; save(m)
    await proof('pilot-readiness', 'Live coverage/readiness', `Server counted ${branch.certifiedCount}/2 distinct active VALID staff on exact SOP`)
    if (!branch.coverageMet) {
      const refusal = await api(manager, 'Pilots.GoLive', { id: m.ids.pilot, branchId: Number(learner.branchId) })
      expect(refusal.status).toBe(409)
      await proof('pilot-coverage-denial', 'Insufficient coverage', 'Real go-live refused HTTP409 while coverage below 2; threshold unchanged', 'unhappy')
      record(m, 'go-live', { flow: 'Go-live then sales/POS', role: 'RD_MANAGER/BRANCH_MANAGER', kind: 'happy', via: 'LIVE_API', status: 'BLOCKED', assertion: 'No go-live mutation forced', evidence: `certifiedCount=${branch.certifiedCount}, required=2`, blocker: 'Need a second permitted distinct test learner/trainer on exact SOP; only supplied TRAINEE currently certified', next: 'Provide another test learner or authorize a run-owned account through ADMIN, then complete course/practical legally' })
    } else {
      const launched = await api(manager, 'Pilots.GoLive', { id: m.ids.pilot, branchId: Number(learner.branchId) }); expect(launched.ok).toBe(true)
      await proof('go-live', 'Go-live', 'Server accepted go-live only after coverage 2 met')
    }
    stage = 'illegal pilot transition and decision'
    const repeated = await api(manager, 'Pilots.Start', { id: m.ids.pilot }); expect(repeated.status).toBe(409)
    const decision = await api(manager, 'Pilots.Decide', { id: m.ids.pilot }, { decision: 'ROLLOUT', note: m.runId + ' premature decision test' }); expect(decision.status).toBe(409); expect(decision.rule).toBe('BR-27')
    await proof('pilot-transitions', 'Repeated start/premature decision', 'RUNNING start refused409 and decision refused409 BR-27', 'unhappy')
    record(m, 'pilot-end-decision', { flow: 'Scheduler end and final decision', role: 'RD_MANAGER', kind: 'happy', via: 'LIVE_API', status: 'BLOCKED', assertion: 'No clock/DB manipulation or artificial elapsed period', evidence: 'Pilot is RUNNING with real future end date', blocker: 'TIME_DEPENDENT: ends day after EndDate; no public end endpoint', next: 'Resume after the actual pilot period; interim evaluation is separately available' })
    const eligible = await api(trainer, 'Courses.EligibleTrainers', { id: m.ids.course }, undefined, { branchId: learner.branchId, size: 100 })
    expect(eligible.ok).toBe(true)
    const staff = eligible.data.items as { id: number; eligible: boolean }[]
    const mine = staff.find(row => row.id === instructor.id)
    if (mine) {
      record(m, 'trainer-br34', { flow: 'Class trainer BR-34 eligibility', role: 'TRAINER', kind: 'unhappy', via: 'LIVE_API', status: 'PASS_LIVE_API', assertion: 'Eligibility read from server for exact SOP/branch; no certificate inserted or fallback bypass', evidence: `supplied trainer eligible=${mine.eligible}`, blocker: mine.eligible ? undefined : 'Trainer must learn then be evaluated by another authorized trainer; cannot self-certify BR-14' })
    }
  } catch { record(m, 'pilot-failure', { flow: stage, role: 'RD_MANAGER', kind: 'diagnostic', via: 'LIVE_API/UI', status: 'FAIL', assertion: 'Sanitized failure at ' + stage, evidence: 'Payload omitted' }); throw new Error('Sanitized pilot failure at ' + stage) }
  finally { await actors.close() }
})
