import { test, expect } from '@playwright/test'
import process from 'node:process'
import crypto from 'node:crypto'
import { Actors, api, entity, identity, manifest, record, save } from './harness.js'

test('owned scope/eligibility: BR34 denial, class cancel, cross-branch denial and own inactive-account recovery', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true' || process.env.E2E_ALLOW_ADDITIONAL_TRAINEE !== 'true', 'Explicit test/owned-account authorization required')
  test.setTimeout(100_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'BR34'
  const proof = (id: string, flow: string, assertion: string, kind = 'unhappy') => record(m, id, { flow, role: 'test actors', kind, via: 'LIVE_API', status: 'PASS_LIVE_API', assertion, evidence: 'Only owned class/branch/audit/account IDs touched' })
  let restore: (() => Promise<unknown>) | undefined
  try {
    const admin = await actors.login('ADMIN'), trainer = await actors.login('TRAINER'), qa = await actors.login('QUALITY_AUDITOR'), bm = await actors.login('BRANCH_MANAGER'), rd = await actors.login('RD_MANAGER')
    const instructor = await identity(trainer), today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
    if (!m.ids.br34Class) {
      const created = await api(trainer, 'TrainingClasses.Create', {}, { courseId: m.ids.course, branchId: m.ids.branch, name: m.runId + ' BR34 negative class', startDate: today, endDate: today }); expect(created.ok).toBe(true)
      m.ids.br34Class = Number(created.data.id); entity(m, 'class', m.ids.br34Class, 'PLANNED bound-SOP negative fixture')
      const modules = await api(trainer, 'Courses.Get', { id: m.ids.course })
      const refused = await api(trainer, 'TrainingClasses.AddSession', { id: m.ids.br34Class }, { sessionNo: 1, scheduledDate: today, startTime: '09:00', durationMinutes: 30, trainerId: instructor.id, moduleIds: [(modules.data.modules as { id: number }[])[0].id] })
      expect(refused.status).toBe(409); expect(refused.rule).toBe('BR-34')
      const cancelled = await api(trainer, 'TrainingClasses.Cancel', { id: m.ids.br34Class }, { reason: m.runId + ' completed negative eligibility test' }); expect(cancelled.data.state).toBe('CANCELLED'); entity(m, 'class', m.ids.br34Class, 'CANCELLED own negative test')
      proof('br34-server-denial', 'Bound-SOP trainer eligibility/class cancel', 'Real bound-course session refused409 BR-34 for uncertified trainer; planned own class cancelled without touching happy course')
      record(m, 'bound-class-positive', { flow: 'Bound-SOP class teaching happy path', role: 'TRAINER', kind: 'happy', via: 'LIVE_API', status: 'BLOCKED', assertion: 'No self-certification or role change used to open session', evidence: 'Provided trainer rejected409 BR-34 on actual bound version', blocker: 'TEST_DATA: a second authorized trainer is needed to assess the supplied trainer as learner; additional authorization was for TRAINEE only', next: 'Supply another trainer account or an existing valid trainer certificate via normal workflow; unbound INDUCTION class/attendance already passed' })
    }
    stage = 'cross branch'
    if (!m.ids.scopeBranch) {
      const created = await api(admin, 'Branches.Create', {}, { branchCode: 'E2E' + Date.now().toString(36).toUpperCase(), name: m.runId + ' scope branch', address: 'Automated technical test' }); expect(created.ok).toBe(true)
      m.ids.scopeBranch = Number(created.data.id); entity(m, 'branch', m.ids.scopeBranch, 'ACTIVE empty test branch')
    }
    if (!m.ids.scopeAudit) {
      const audit = await api(qa, 'BranchAudits.Create', {}, { branchId: m.ids.scopeBranch, recipeVersionId: m.ids.version, comment: m.runId + ' scope test', items: [{ criterion: 'Automated technical test', passed: true }] }); expect(audit.ok).toBe(true)
      m.ids.scopeAudit = Number(audit.data.id); entity(m, 'audit', m.ids.scopeAudit, 'PASSED scope fixture')
    }
    const scoped = await api(bm, 'BranchAudits.Get', { id: m.ids.scopeAudit }); expect(scoped.status).toBe(404)
    const denied = await api(bm, 'Sales.Create', {}, { branchId: m.ids.scopeBranch, recipeId: m.ids.recipe, tradingDate: today, cupsSold: 1 }); expect(denied.status).toBe(403)
    proof('branch-isolation', 'Wrong branch read/write', 'Provided manager cannot see owned other-branch audit404 or write sales there403; new branch has no real recipients')
    stage = 'own inactive account'
    const user = await api(admin, 'Users.Get', { id: m.ids.additionalLearner })
    const username = m.runId.toLowerCase() + '_learner2'; if (user.data.username !== username) throw new Error('Owned account mismatch')
    const password = 'T!' + crypto.randomBytes(18).toString('base64url') + '9a'
    const body = { username, password, email: user.data.email, fullName: user.data.fullName, role: 'TRAINEE', branchId: m.ids.branch, status: 'ACTIVE' }
    restore = () => api(admin, 'Users.Update', { id: m.ids.additionalLearner }, body)
    expect((await restore() as { ok: boolean }).ok).toBe(true)
    const learner = await actors.loginGenerated(username, password)
    const off = await api(admin, 'Users.Deactivate', { id: m.ids.additionalLearner }); expect(off.ok).toBe(true)
    const expired = await api(learner, 'Auth.Me'); expect(expired.status).toBe(401)
    expect((await restore() as { ok: boolean }).ok).toBe(true)
    const fresh = await actors.loginGenerated(username, password); expect((await api(fresh, 'Auth.Me')).ok).toBe(true)
    const status = await api(rd, 'Pilots.Readiness', { id: m.ids.pilot })
    const branch = (status.data.branches as { branchId: number; certifiedCount: number }[]).find(branch => branch.branchId === m.ids.branch)!
    expect(branch.certifiedCount).toBeGreaterThanOrEqual(2)
    entity(m, 'authorized additional trainee', m.ids.additionalLearner, 'ACTIVE restored; no shared credentials changed')
    proof('inactive-account', 'Owned deactivate/reactivate/session recovery', 'Only authorized generated user deactivated; old session /me401, restored ACTIVE login succeeds and exact-SOP coverage returns2')
    restore = undefined
  } catch { record(m, 'scope-failure', { flow: stage, role: 'test actors', kind: 'diagnostic', via: 'LIVE_API', status: 'FAIL', assertion: 'Sanitized failure at ' + stage, evidence: 'No usernames/passwords retained' }); throw new Error('Sanitized scope failure at ' + stage) }
  finally { if (restore) await restore(); save(m); await actors.close() }
})
