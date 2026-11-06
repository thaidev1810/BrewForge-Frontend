import { test, expect, type Browser } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { Actors, api, identity, type Manifest } from './harness.js'
import { roles, type TestRole } from '../helpers/environment.js'
import { logout } from '../helpers/auth.js'
import matrix from '../fixtures/permission-matrix.json' with { type: 'json' }
import { checkpoint, review, reviewed, type ReviewStatus } from './review-registry.js'

const old = () => JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json', 'utf8')) as Manifest
const proof = (id: string, module: string, role: string, assertion: string, status: ReviewStatus = 'PASS_LIVE_API', blocker?: string) => reviewed(id, { module, role, flow: id, kind: /DENIAL|INVALID|CONFLICT/.test(id) ? 'unhappy' : 'happy', prerequisites: 'Verified local test target; role-isolated auth; run ownership checked before mutation', via: status === 'PASS_LIVE_UI' ? 'LIVE_UI' : 'LIVE_API', assertion, status, evidence: 'Current-round browser/API assertions; only statuses, IDs and counts retained', blocker })
const actorsFor = (browser: Browser, baseURL: unknown) => new Actors(browser, String(baseURL), 'e2e-private/product-review-operations.json')

test('REVIEW eight real roles, safe read pages, wrong-role navigation, F5, account and logout after landing', async ({ browser }, info) => {
  test.setTimeout(180_000)
  const actors = actorsFor(browser, info.project.use.baseURL)
  const pages: Record<TestRole, string> = { ADMIN: 'users', RD_SPECIALIST: 'recipes', RD_MANAGER: 'courses/pending', TRAINER: 'courses', TRAINING_MANAGER: 'assignments', TRAINEE: 'learning', BRANCH_MANAGER: 'branches', QUALITY_AUDITOR: 'branch-audits' }
  let stage = 'login'
  try {
    for (const role of roles) {
      stage = role
      const page = await actors.login(role), row = matrix.find(row => row.role === role)!
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
      await page.goto('/'); await expect(page.locator('.landing-page')).toHaveClass(/ready/)
      await page.getByRole('button', { name: /^Dashboard \(/ }).click(); await expect(page).toHaveURL(new RegExp(row.prefix + '/dashboard$'))
      await page.goto(row.prefix + '/' + pages[role]); await expect(page.locator('main h1').first()).toBeVisible()
      await expect(page.locator('main .error-box')).toHaveCount(0)
      await page.reload(); await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
      await page.goto(row.prefix + '/account'); expect((await api(page, 'Auth.Me')).ok).toBe(true)
      const other = matrix.find(item => item.role !== role)!
      await page.goto(other.prefix + '/dashboard'); await expect(page).toHaveURL(new RegExp(row.prefix + '/dashboard$'))
      if (role === 'TRAINING_MANAGER') { await page.goto(row.prefix + '/courses/pending'); await expect(page).toHaveURL(/\/dashboard$/) }
      await logout(page); await page.goto(row.prefix + '/account'); await expect(page).toHaveURL(/\/login$/)
      proof('AUTH-' + role, 'Auth/navigation', role, 'Real login/me, landing Dashboard CTA, authorized list/F5/account, wrong-role redirect and logout/anonymous guard passed', 'PASS_LIVE_UI')
      await page.context().close()
    }
  } catch { proof('AUTH-' + stage, 'Auth/navigation', stage, 'Sanitized current-round failure; inspect stage without identity payload', 'FAIL'); throw new Error('Sanitized role review failure at ' + stage) }
  finally { await actors.close() }
})

test('REVIEW persisted owned core chain, media, manager summary, pilot and branch scope', async ({ browser }, info) => {
  test.setTimeout(120_000)
  const actors = actorsFor(browser, info.project.use.baseURL), m = old(); let stage = 'checkpoint'
  try {
    const trainer = await actors.login('TRAINER'), rd = await actors.login('RD_MANAGER'), qa = await actors.login('QUALITY_AUDITOR'), trainee = await actors.login('TRAINEE'), tm = await actors.login('TRAINING_MANAGER'), bm = await actors.login('BRANCH_MANAGER')
    const recipe = await api(rd, 'Recipes.Get', { id: m.ids.recipe }); expect(recipe.data.recipeCode).toBe(m.runId); expect(recipe.data.origin).toBe('NEW')
    const course = await api(trainer, 'Courses.Get', { id: m.ids.course }); expect(course.data.recipeVersionId).toBe(m.ids.version); expect(String(course.data.title).startsWith(m.runId)).toBe(true)
    const enrollment = await api(trainer, 'Enrollments.Get', { id: m.ids.enrollment }); expect(enrollment.data.state).toBe('PASSED')
    const cert = await api(trainer, 'Certificates.Get', { id: m.ids.certificate }); expect(cert.data.status).toBe('VALID'); expect(cert.data.enrollmentId).toBe(m.ids.enrollment); expect(cert.data.recipeVersionId).toBe(m.ids.version)
    expect((await api(qa, 'CorrectiveActions.Get', { id: m.ids.action })).data.status).toBe('CLOSED')
    proof('CORE-CHECKPOINT', 'Learning/certification/quality', 'TRAINER/RD_MANAGER/QUALITY_AUDITOR', 'Owned NEW recipe16/SOP15/course8/enrollment12 PASSED/certificate8 VALID/action3 CLOSED revalidated now; prior mutations remain historical')
    await tm.goto('/training-manager/enrollments/' + m.ids.enrollment); await expect(tm.locator('main .error-box')).toHaveCount(0); await expect(tm.locator('main h1')).toBeVisible()
    await trainee.goto('/barista/certificates'); await expect(trainee.locator('main h1')).toBeVisible(); expect((await api(trainee, 'Certificates.Mine')).ok).toBe(true)
    proof('LEARN-SUMMARY', 'Learning/certification', 'TRAINING_MANAGER/TRAINEE', 'Real manager enrollment deep link and learner certificate list remain readable after landing merge', 'PASS_LIVE_UI')
    stage = 'protected media'
    await trainer.goto('/trainer/videos/' + m.ids.video); await trainer.getByRole('button', { name: 'Tải & xem bản ghi', exact: true }).click()
    await expect.poll(() => trainer.locator('video').evaluate(el => (el as HTMLVideoElement).videoWidth)).toBe(640)
    await trainer.locator('video').evaluate(async el => { const video = el as HTMLVideoElement; await video.play(); video.pause(); video.currentTime = 1 })
    for (const width of [1440, 768, 390, 360]) { await trainer.setViewportSize({ width, height: 900 }); expect(await trainer.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true) }
    proof('MEDIA-PLAYBACK', 'Media', 'TRAINER', 'Actual owned synthetic video authenticates, decodes640, plays/seeks and fits four widths after landing navigation', 'PASS_LIVE_UI')
    stage = 'launch and sales'
    const launches = await api(rd, 'BranchLaunchStatus.List', {}, undefined, { recipeId: m.ids.recipe, branchId: m.ids.branch })
    const launch = (launches.data as unknown as { status: string; certifiedCount: number; coverageMet: boolean }[])[0]; expect(launch.status).toBe('LIVE'); expect(launch.coverageMet).toBe(true); expect(launch.certifiedCount).toBeGreaterThanOrEqual(2)
    const sales = await api(bm, 'Sales.List', {}, undefined, { recipeId: m.ids.recipe, from: '2026-11-04', to: '2026-11-04', size: 100 }); expect((sales.data.items as { cupsSold: number }[]).map(x => x.cupsSold)).toEqual([11])
    const interim = await api(rd, 'Pilots.Evaluation', { id: m.ids.pilot }); expect(interim.ok).toBe(true)
    proof('LAUNCH-SALES-STATE', 'Pilot/sales', 'RD_MANAGER/BRANCH_MANAGER', 'Server still reports LIVE exact-SOP coverage2 and single historical business-day sales row11; interim evaluation reads successfully. No new import claimed')
    const pilot = await api(rd, 'Pilots.Get', { id: m.ids.pilot }); expect(pilot.data.state).toBe('RUNNING')
    proof('PILOT-FINAL', 'Pilot', 'RD_MANAGER', 'Current pilot1 RUNNING; EndDate ' + String(pilot.data.endDate) + '; no end/decision mutation attempted', 'BLOCKED_TIME', 'Wait until actual period ends and scheduler/on-demand transition completes; no clock or DB change')
    const trainers = await api(trainer, 'Courses.EligibleTrainers', { id: m.ids.course }, undefined, { branchId: m.ids.branch, size: 100 })
    const who = await identity(trainer), eligible = (trainers.data.items as { id: number; eligible: boolean }[]).find(x => x.id === who.id)
    expect(eligible?.eligible).toBe(false)
    proof('CLASS-BOUND-POSITIVE', 'Classes', 'TRAINER', 'Exact-SOP trainer lookup still reports supplied trainer ineligible; no self-assessment or role mutation', 'BLOCKED_DATA', 'Second authorized trainer needed to assess supplied trainer; existing additional account is TRAINEE')
    stage = 'scope'
    expect((await api(bm, 'BranchAudits.Get', { id: m.ids.scopeAudit })).status).toBe(404)
    expect((await api(trainee, 'Enrollments.PracticalVideoContent', { id: m.ids.secondaryOldVideo })).status).toBe(404)
    proof('SCOPE-DENIAL', 'Authorization', 'BRANCH_MANAGER/TRAINEE', 'Actual inaccessible owned other-branch audit404 and other-learner recording404; sessions remain authenticated afterward')
    expect((await api(bm, 'Auth.Me')).ok).toBe(true); expect((await api(trainee, 'Auth.Me')).ok).toBe(true)
    stage = 'utilities'
    expect((await api(trainee, 'Skills.Mine')).ok).toBe(true)
    for (const op of ['Notifications.Inbox', 'Notifications.UnreadCount'] as const) expect((await api(trainee, op)).ok).toBe(true)
    const push = await api(trainee, 'Notifications.PushConfig'); expect(push.data.enabled).toBe(false)
    const dashboards = [['Dashboards.TrainingProgress', trainer, { branchId: m.ids.branch, courseId: m.ids.course }], ['Dashboards.BranchPerformance', rd, { recipeId: m.ids.recipe, branchId: m.ids.branch }], ['Dashboards.CourseEffectiveness', tm, { courseId: m.ids.course }]] as const
    for (const [op, page, query] of dashboards) expect((await api(page, op, {}, undefined, query)).ok).toBe(true)
    proof('REPORTS-UTILITIES', 'Reports/notifications', 'role-scoped actors', 'Skills, inbox/count, disabled push config and three scoped dashboards read real responses; no send/subscribe/read-state changes')
  } catch { proof('CORE-' + stage, 'Core', 'test actors', 'Sanitized review failure at ' + stage, 'FAIL'); throw new Error('Sanitized core review failure at ' + stage) }
  finally { await actors.close() }
})

test('REVIEW new owned catalog CRUD/validation and real UI search/sort/paging without altering shared data', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Authorized local test writes only')
  test.setTimeout(90_000)
  const actors = actorsFor(browser, info.project.use.baseURL), m = review(); let stage = 'catalog'
  try {
    const admin = await actors.login('ADMIN'), specialist = await actors.login('RD_SPECIALIST')
    const settings = await api(admin, 'Settings.List'); expect(settings.ok).toBe(true)
    if (!m.ids.ingredient) {
      const created = await api(admin, 'Ingredients.Create', {}, { ingredientCode: 'RV' + m.runId.slice(-9), name: m.runId + ' unused ingredient', unit: 'g', shelfLifeHours: 2 }); expect(created.ok).toBe(true); m.ids.ingredient = Number(created.data.id); checkpoint(m)
    }
    const owned = await api(admin, 'Ingredients.Get', { id: m.ids.ingredient }); expect(String(owned.data.name).startsWith(m.runId)).toBe(true)
    const body = { ingredientCode: owned.data.ingredientCode, name: m.runId + ' unused ingredient revised', unit: 'g', shelfLifeHours: 2, brewTempMinC: 60, brewTempMaxC: 90, status: 'ACTIVE' }
    expect((await api(admin, 'Ingredients.Update', { id: m.ids.ingredient }, body)).ok).toBe(true)
    const invalid = await api(admin, 'Ingredients.Update', { id: m.ids.ingredient }, { ...body, brewTempMinC: 99, brewTempMaxC: 40 }); expect(invalid.status).toBe(400)
    expect((await api(admin, 'Ingredients.Get', { id: m.ids.ingredient })).data.brewTempMinC).toBe(60)
    proof('CATALOG-INVALID', 'Catalog/admin', 'ADMIN', 'Owned unused ingredient valid update persists60–90; inverted range400 leaves saved lower bound60 unchanged. Settings read only')
    await admin.goto('/admin/ingredients'); await admin.locator('#filter-q').fill(m.runId)
    const searched = admin.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/ingredients' && new URL(r.url()).searchParams.get('q') === m.runId)
    await admin.getByRole('button', { name: 'Áp dụng', exact: true }).click(); expect((await searched).status()).toBe(200)
    const sorting = admin.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/ingredients' && new URL(r.url()).searchParams.get('sort') === 'name,asc')
    await admin.getByLabel('Sắp xếp', { exact: true }).selectOption('name,asc'); expect((await sorting).status()).toBe(200)
    const sizing = admin.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/ingredients' && new URL(r.url()).searchParams.get('size') === '50' && new URL(r.url()).searchParams.get('page') === '1')
    await admin.getByRole('combobox', { name: 'Số dòng mỗi trang' }).selectOption('50'); expect((await sizing).status()).toBe(200)
    await expect(admin.getByRole('button', { name: 'Trang trước', exact: true })).toBeDisabled(); await expect(admin.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled()
    await expect(admin.locator('main')).toContainText(m.runId)
    expect((await api(admin, 'Ingredients.Deactivate', { id: m.ids.ingredient })).data.status).toBe('INACTIVE')
    proof('CATALOG-CRUD', 'Catalog/admin', 'ADMIN', 'Create/update/search/sort UI response and run-owned inactive cleanup; API_SETUP creation, no shared settings edits', 'PASS_LIVE_UI')
    stage = 'recipe list'
    const baseline = old()
    await specialist.goto('/rd-specialist/recipes'); await specialist.locator('#filter-q').fill(baseline.runId)
    const recipes = specialist.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/recipes' && new URL(r.url()).searchParams.get('q') === baseline.runId)
    await specialist.getByRole('button', { name: 'Áp dụng', exact: true }).click(); const recipeData = await (await recipes).json(); expect(recipeData.items.some((x: { id: number }) => x.id === baseline.ids.recipe)).toBe(true)
    proof('RECIPE-LOOKUP', 'Recipe/SOP', 'RD_SPECIALIST', 'Live owned-recipe search goes to server and contains expected ID16; no recipe modification or release claimed', 'PASS_LIVE_UI')
  } catch { proof('CATALOG-' + stage, 'Catalog', 'test actors', 'Sanitized review failure at ' + stage, 'FAIL'); throw new Error('Sanitized catalog review failure at ' + stage) }
  finally { await actors.close() }
})
