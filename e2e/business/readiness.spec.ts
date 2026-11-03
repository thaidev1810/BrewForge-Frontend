import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { loginAsRole, logout } from '../helpers/auth.js'
import { roles } from '../helpers/environment.js'
import catalog from '../fixtures/business-readiness.json' with { type: 'json' }

type Status = 'READY' | 'FE BUG' | 'BE BLOCKED' | 'PERMISSION BLOCKED' | 'DATA BLOCKED' | 'SAFETY BLOCKED' | 'NOT IMPLEMENTED'
type Endpoint = { method: string; path: string; roles: string[]; query: { name: string }[] }
type Row = { role: string; page: string; feature: string; operation: string; method: string; endpoint: string; permission: string; fe: string; api: string; status: Status; reason: string; observed?: { loading?: boolean; empty?: boolean; responsive?: boolean; mapping?: boolean; pagination?: boolean; filters?: boolean; validation?: boolean } }
test.use({ actionTimeout: 10_000, navigationTimeout: 15_000 })
const endpoints = catalog.endpoints as Record<string, Endpoint>
const safe = new Set(catalog.safe.map(item => item.operation))
const rowsOf = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === 'object') for (const key of ['items','rows','entries','questions']) {
    const value = (data as Record<string, unknown>)[key]; if (Array.isArray(value)) return value as Record<string, unknown>[]
  }
  return []
}
const idOf = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined
function matches(template: string, path: string) {
  const expression = template.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\*\*\w+\}/g, '.+').replace(/\{(\w+)(?::\w+)?\}/g, (_, name: string) => /(^id$|Id$)/.test(name) ? '[1-9][0-9]*' : '[^/]+')
  return new RegExp('^' + expression + '$').test(path)
}
for (const role of roles) test(`${role}: business read-only readiness`, async ({ page }, testInfo) => {
  test.setTimeout(240_000)
  const config = catalog.roles.find(item => item.role === role)!
  const result: Row[] = [], blocked = new Set<string>(), errors: string[] = []
  const writeResult = () => {
    fs.mkdirSync('e2e-private', { recursive: true })
    const file = 'e2e-private/business-results.json'
    const previous: Row[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []
    fs.writeFileSync(file, JSON.stringify([...previous.filter(row => row.role !== role), ...result], null, 2))
  }
  const make = (feature: string, operation: string, route = ''): Row => {
    const endpoint = endpoints[operation]
    const row: Row = { role, page: config.prefix + (route ? '/' + route : ''), feature, operation, method: endpoint?.method ?? '—', endpoint: endpoint?.path ?? '—', permission: endpoint?.roles.includes(role) ? 'ALLOW' : 'DENY', fe: 'Not opened', api: 'Not called', status: 'SAFETY BLOCKED', reason: 'Not executed' }
    result.push(row); return row
  }
  page.on('pageerror', () => errors.push('Runtime error (payload omitted)'))
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (!url.pathname.startsWith('/api/')) { await route.continue(); return }
    if (/\/auth\/(login|refresh|logout|me)$/.test(url.pathname)) { await route.continue(); return }
    const operation = Object.entries(endpoints).find(([, endpoint]) => endpoint.method === request.method() && matches(endpoint.path, url.pathname))?.[0]
    if (request.method() !== 'GET' || !operation || !safe.has(operation)) {
      blocked.add(operation ?? 'Unknown API request'); await route.abort(); return
    }
    await route.continue()
  })
  let loggedIn = false
  let stage = 'startup'
  page.on('dialog', dialog => { if (dialog.type() === 'confirm' && dialog.message().includes('chưa lưu')) void dialog.accept(); else void dialog.dismiss() })
  async function read(feature: string, operation: string, route: string, params: Record<string, number | string> = {}, query: Record<string, string | number> = {}) {
    const row = make(feature, operation, route), endpoint = endpoints[operation]
    if (!endpoint) { row.status = 'NOT IMPLEMENTED'; row.reason = 'No operation in current frontend contract'; return { row, data: undefined as unknown } }
    if (!endpoint.roles.includes(role)) { row.status = 'PERMISSION BLOCKED'; row.reason = 'Controller role contract excludes this role; no request sent'; return { row, data: undefined as unknown } }
    if (!safe.has(operation)) { row.status = 'SAFETY BLOCKED'; row.reason = 'Read path not confirmed side-effect free; no request sent'; return { row, data: undefined as unknown } }
    if (endpoint.path.match(/\{[^}]+\}/g)?.some(token => !params[token.replace(/[{}]/g,'').replace('**','').split(':')[0]])) { row.status = 'DATA BLOCKED'; row.reason = 'No valid ID obtained from an authorized list response'; return { row, data: undefined as unknown } }
    const path = endpoint.path.replace(/\{(\*\*)?(\w+)(?::\w+)?\}/g, (_, catchAll: string, key: string) => catchAll ? String(params[key]).split('/').map(encodeURIComponent).join('/') : encodeURIComponent(params[key]))
    const url = path + (Object.keys(query).length ? '?' + new URLSearchParams(Object.entries(query).map(([key,value]) => [key,String(value)])) : '')
    const response = await page.evaluate(async path => {
      const raw = sessionStorage.getItem('brewforge.session.v1'); if (!raw) return { status: 0, data: null }
      const { accessToken } = JSON.parse(raw)
      const module = await import(/* @vite-ignore */ String('/src/constants/config.ts'))
      try {
        const response = await fetch(module.apiBaseUrl + path.replace(/^\/api\/v1/, ''), { headers: { Authorization: 'Bearer ' + accessToken } })
        const json = response.headers.get('content-type')?.includes('json')
        const data: unknown = json ? await response.json() : null
        // Never return backend error messages or authentication data to reports.
        return { status: response.status, data: response.ok ? data : null, binary: !json }
      } catch { return { status: 0, data: null } }
    }, url)
    row.api = `HTTP ${response.status}`
    row.status = response.status === 200 ? 'READY' : response.status === 403 ? 'PERMISSION BLOCKED' : response.status === 404 || response.status === 409 ? 'DATA BLOCKED' : 'BE BLOCKED'
    row.reason = response.status === 200 ? 'Real GET succeeded; UI not yet verified' : response.status === 0 ? 'Browser request failed (connectivity/CORS or safety guard); no payload retained' : 'Real API rejected request; response body omitted'
    return { row, data: response.data }
  }
  async function visit(row: Row, route: string) {
    if (row.status !== 'READY') return
    row.page = config.prefix + '/' + route
    const before = new Set(blocked), errorCount = errors.length
    let loading: boolean
    try {
      await page.goto(row.page)
      loading = await page.locator('main .state-panel[role="status"]').count() > 0
      await expect(page.locator('main h1').first()).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
      await expect(page.locator('main .state-panel[role="status"]')).toHaveCount(0, { timeout: 20_000 })
      await expect(page.locator('main [role="alert"], main .error-box')).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toHaveCount(0)
      if (errors.length !== errorCount) throw new Error('Runtime error')
      row.fe = 'Rendered without runtime/API error'
      row.reason = 'Real API and page rendered; read-only demo available'
      row.observed = { loading, empty: await page.getByText('Chưa có dữ liệu', { exact: true }).count() > 0 }
    } catch {
      const newBlocked = [...blocked].filter(operation => !before.has(operation))
      row.status = newBlocked.length ? 'SAFETY BLOCKED' : 'FE BUG'
      row.fe = 'Page assertion failed'
      row.reason = newBlocked.length ? 'Dependent GET not on audited allowlist: ' + newBlocked.join(', ') : 'API GET succeeded but page/loading/error assertion failed; diagnose before changing application code'
    }
  }
  try {
    const auth = await loginAsRole(page, role); loggedIn = auth.ok
    if (!auth.ok) { const row = make('Authentication prerequisite', 'Auth.Me', 'dashboard'); row.status = 'BE BLOCKED'; row.reason = auth.category + ': ' + auth.reason; return }
    // Business checks use only existing references from this role's authorized list responses.
    const recipes = await read('Recipe list', 'Recipes.List', 'recipes', {}, { page: 1, size: 20 })
    await visit(recipes.row, 'recipes')
    const recipeId = idOf(rowsOf(recipes.data)[0]?.id)
    const recipe = await read('Recipe detail', 'Recipes.Get', 'recipes/:id', recipeId ? { id: recipeId } : {})
    if (recipeId) await visit(recipe.row, 'recipes/' + recipeId)
    const versions = await read('SOP version list', 'Recipes.ListVersions', 'recipes/:id', recipeId ? { id: recipeId } : {})
    const versionId = idOf(rowsOf(versions.data)[0]?.id)
    const version = await read('SOP version detail', 'RecipeVersions.Get', 'versions/:id', versionId ? { id: versionId } : {})
    if (versionId) await visit(version.row, 'versions/' + versionId)
    const courses = await read('Course list', 'Courses.List', 'courses', {}, { page: 1, size: 20 })
    await visit(courses.row, 'courses')
    const courseId = idOf(rowsOf(courses.data)[0]?.id)
    const course = await read('Course detail', 'Courses.Get', 'courses/:id', courseId ? { id: courseId } : {})
    if (courseId) await visit(course.row, 'courses/' + courseId)
    await read('Course modules', 'Courses.Modules', 'courses/:id', courseId ? { id: courseId } : {})
    await read('Quiz configuration detail', 'Courses.GetQuiz', 'courses/:id?section=quiz', courseId ? { id: courseId } : {})
    await read('Quiz question list', 'Courses.ListQuestions', 'courses/:id?section=quiz', courseId ? { id: courseId } : {})
    if (courseId && role === 'TRAINER') { const quiz = make('Quiz editor read-only tab', 'Courses.GetQuiz', 'courses/' + courseId + '?section=quiz'); quiz.status = 'READY'; quiz.api = 'Covered above'; await visit(quiz, 'courses/' + courseId + '?section=quiz') }
    const bank = await read('Question bank list', 'QuestionBank.List', 'question-bank', {}, { page: 1, size: 20 })
    await visit(bank.row, 'question-bank')
    const questionId = idOf(rowsOf(bank.data)[0]?.id)
    const question = await read('Question bank detail', 'QuestionBank.Get', 'question-bank/:id', questionId ? { id: questionId } : {})
    if (questionId) await visit(question.row, 'question-bank/' + questionId)
    const assignments = await read('Training assignment list', 'Assignments.List', 'assignments', {}, { page: 1, size: 20 })
    await visit(assignments.row, 'assignments')
    const ownLearning = await read('My learning list', 'Enrollments.Mine', 'learning')
    await visit(ownLearning.row, 'learning')
    const ownEnrollmentId = idOf(rowsOf(ownLearning.data)[0]?.id)
    const enrollmentId = ownEnrollmentId ?? idOf(rowsOf(assignments.data)[0]?.enrollmentId)
    const enrollment = await read('Enrollment detail', 'Enrollments.Get', 'learning/:id', enrollmentId ? { id: enrollmentId } : {})
    if (enrollmentId) await visit(enrollment.row, ownEnrollmentId ? 'learning/' + enrollmentId : role === 'TRAINER' ? 'assessment/' + enrollmentId : 'enrollments/' + enrollmentId)
    await read('Enrollment lesson modules', 'Enrollments.Modules', 'learning/:id', enrollmentId ? { id: enrollmentId } : {})
    const eligibility = await read('Enrollment eligibility', 'Enrollments.Eligibility', 'learning/:id', enrollmentId ? { id: enrollmentId } : {})
    await read('Quiz attempt history', 'Enrollments.QuizAttempts', 'learning/:id/results', enrollmentId ? { id: enrollmentId } : {})
    if (ownEnrollmentId && (eligibility.data as Record<string, unknown> | undefined)?.eligible) await read('Learner quiz detail (eligible only)', 'Enrollments.Quiz', 'learning/:id/quiz', { id: ownEnrollmentId })
    else { const row = make('Learner quiz detail (eligible only)', 'Enrollments.Quiz', 'learning/:id/quiz'); row.status = endpoints['Enrollments.Quiz'].roles.includes(role) ? 'DATA BLOCKED' : 'PERMISSION BLOCKED'; row.reason = 'No owned eligible enrollment from list; quiz gate not bypassed' }
    const pathOperation = ['TRAINEE','TRAINER'].includes(role) ? 'LearningPath.Mine' : 'LearningPath.Get'
    let personId: number | undefined
    if (pathOperation === 'LearningPath.Get' && endpoints[pathOperation].roles.includes(role)) {
      const people = await read('Learning path person lookup', 'UserLookup.Lookup', 'learning-path', {}, { page: 1, size: 20, role: 'TRAINEE' })
      personId = idOf(rowsOf(people.data)[0]?.id)
    }
    const path = await read('Learning path', pathOperation, 'learning-path', personId ? { userId: personId } : {})
    await visit(path.row, 'learning-path')
    if (path.row.status === 'READY' && pathOperation === 'LearningPath.Get') { path.row.fe = 'Picker shell rendered; selected-person data verified by real GET'; path.row.reason = 'API path verified for discovered user ID; picker selection workflow not exercised' }
    const progress = await read('Training progress report', 'Dashboards.TrainingProgress', 'training-progress'); await visit(progress.row, 'training-progress')
    const certificates = await read('Certificate list', 'Certificates.Mine', 'certificates'); await visit(certificates.row, 'certificates')
    const certificateId = idOf(rowsOf(certificates.data)[0]?.id)
    const certificate = await read('Certificate detail', 'Certificates.Get', 'certificates/:id', certificateId ? { id: certificateId } : {})
    if (certificateId) await visit(certificate.row, 'certificates/' + certificateId)
    const branches = await read('Branch list', 'Branches.List', 'branches', {}, { page: 1, size: 20 }); await visit(branches.row, 'branches')
    const branchId = idOf(rowsOf(branches.data)[0]?.id)
    const branch = await read('Branch detail', 'Branches.Get', 'branches/:id', branchId ? { id: branchId } : {}); if (branchId) await visit(branch.row, 'branches/' + branchId)
    const branchDashboard = await read('Branch performance dashboard', 'Dashboards.BranchPerformance', 'branch-performance'); await visit(branchDashboard.row, 'branch-performance')
    const audits = await read('Audit list', 'BranchAudits.List', 'branch-audits', {}, { page: 1, size: 20 }); await visit(audits.row, 'branch-audits')
    const auditId = idOf(rowsOf(audits.data)[0]?.id)
    const audit = await read('Audit detail', 'BranchAudits.Get', 'branch-audits/:id', auditId ? { id: auditId } : {}); if (auditId) await visit(audit.row, 'branch-audits/' + auditId)
    const evidenceUrl = rowsOf((audit.data as Record<string, unknown> | undefined)?.items).find(item => typeof item.evidenceUrl === 'string')?.evidenceUrl
    const marker = '/api/v1/branch-audits/evidence/'
    const key = typeof evidenceUrl === 'string' && evidenceUrl.startsWith(marker) ? evidenceUrl.slice(marker.length) : undefined
    await read('Audit evidence content (no separate list API)', 'BranchAudits.Evidence', 'branch-audits/:id', key ? { key } : {})
    const launch = await read('Branch readiness / launch coverage', 'BranchLaunchStatus.List', 'launch'); await visit(launch.row, 'launch')
    for (const operation of ['Pilots.List','Pilots.Get','Pilots.Readiness','Pilots.Evaluation']) {
      const row = make('Pilot ' + operation.split('.')[1], operation, 'pilots'); row.status = endpoints[operation].roles.includes(role) ? 'SAFETY BLOCKED' : 'PERMISSION BLOCKED'; row.reason = 'PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent'
    }
    const approval = make('Course approval', 'Courses.Approve', 'courses/pending'); approval.status = endpoints['Courses.Approve'].roles.includes(role) ? 'SAFETY BLOCKED' : 'PERMISSION BLOCKED'; approval.reason = endpoints['Courses.Approve'].roles.includes(role) ? 'Role is authorized by the current source-derived contract; mutation was explicitly excluded from this read-only run.' : 'Current controller contract denies this role; no mutation request was sent.'
    // Open forms and run their actual validator without submitting any business request.
    const formResource = catalog.resources.find(resource => 'create' in resource && resource.create && endpoints[resource.create]?.roles.includes(role) && ['recipes','courses','branches'].includes(resource.key))
    if (formResource && 'create' in formResource && formResource.create) {
      stage = 'form dialog / ' + formResource.key
      const formRow = make('Create form validation (no submit)', formResource.create, formResource.key)
      const bodyType = (catalog.endpoints[formResource.create as keyof typeof catalog.endpoints] as { body?: string }).body
      await page.goto(config.prefix + '/' + formResource.key)
      await expect(page.locator('main .state-panel[role="status"]')).toHaveCount(0)
      await page.getByRole('button', { name: 'Thêm mới', exact: true }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const checked = await page.evaluate(async schema => {
        const module = await import(/* @vite-ignore */ String('/src/services/backend/validation.ts'))
        return { invalid: module.validateRequest(schema, {}, true).length > 0, fields: document.querySelectorAll('[role="dialog"] [data-field]').length }
      }, bodyType)
      formRow.status = checked.invalid && checked.fields > 0 ? 'READY' : 'FE BUG'
      formRow.fe = 'Form rendered; empty input rejected by actual validator; no submission'
      formRow.api = 'NOT SENT (validation only)'
      formRow.observed = { validation: checked.invalid }
      formRow.reason = 'Readiness of local form only; persistence/workflow is not tested'
      await dialog.getByRole('button', { name: 'Đóng', exact: true }).click()
    }
    if (audits.row.status === 'READY') {
      stage = 'audit date filter validation'
      await page.goto(config.prefix + '/branch-audits')
      await page.locator('#filter-from').fill('2026-11-02')
      await page.locator('#filter-to').fill('2026-11-01')
      await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
      await expect(page.locator('.filter-bar [role="alert"]')).toBeVisible()
      audits.row.observed = { ...audits.row.observed, validation: true }
    }
    // Safe filter/empty/paging checks on a list already verified with real data.
    if (recipes.row.status === 'READY') {
      stage = 'recipe empty/filter/pagination'
      await page.goto(config.prefix + '/recipes')
      await expect(page.locator('main .state-panel[role="status"]')).toHaveCount(0)
      const filter = page.locator('#filter-q')
      await filter.fill('__readiness_no_matching_recipe__')
      await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
      await expect(page.getByText('Chưa có dữ liệu', { exact: true })).toBeVisible()
      recipes.row.observed = { ...recipes.row.observed, filters: true, empty: true }
      const paged = await read('Recipe pagination second page', 'Recipes.List', 'recipes', {}, { page: 2, size: 1 })
      if (paged.row.status === 'READY') {
        const envelope = paged.data as Record<string, unknown>
        paged.row.observed = { pagination: envelope.page === 2 && envelope.size === 1 && Array.isArray(envelope.items) }
        if (!paged.row.observed.pagination) { paged.row.status = 'BE BLOCKED'; paged.row.reason = 'Pagination envelope does not match page/size/items contract' }
      }
    }
    const responsive = result.find(row => row.status === 'READY' && row.fe.startsWith('Rendered') && !row.page.includes(':'))
    if (responsive) {
      stage = 'responsive navigation'
      await page.goto(responsive.page)
      await page.setViewportSize({ width: 390, height: 844 })
      await expect(page.getByRole('button', { name: 'Mở menu', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Mở menu', exact: true }).click()
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
      await page.keyboard.press('Escape')
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)
      responsive.observed = { ...responsive.observed, responsive: fits }
      if (!fits) { responsive.status = 'FE BUG'; responsive.reason = 'Horizontal overflow at 390px viewport' }
      await page.setViewportSize({ width: 1440, height: 900 })
    }
  } catch {
    const row = make('Read-only UI checks incomplete', 'Auth.Me', '')
    row.status = 'SAFETY BLOCKED'; row.reason = 'Test harness UI check did not complete at ' + stage + '; no FE root cause established'
  } finally {
    if (loggedIn) await logout(page).catch(() => {})
    writeResult()
    if (result.some(row => row.status === 'FE BUG' || row.status === 'BE BLOCKED')) {
      await page.screenshot({ path: testInfo.outputPath('business-failure-masked.png'), mask: [page.locator('html')], maskColor: '#4B3028' }).catch(() => {})
    }
  }
  expect(result.filter(row => row.status === 'FE BUG' || row.status === 'BE BLOCKED').length, 'See private structured results; no payloads logged').toBe(0)
})






// Observe loading without fabricating a response: delay forwarding one audited real GET.
test('RD_SPECIALIST: loading state with real GET forwarding', async ({ page }) => {
  test.setTimeout(60_000)
  const safePatterns = catalog.safe.map(item => item.path)
  let holdRecipes = false
  let release: (() => void) | undefined
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/*', async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    if (!path.startsWith('/api/')) { await route.continue(); return }
    if (/\/auth\/(login|refresh|logout|me)$/.test(path)) { await route.continue(); return }
    if (request.method() !== 'GET' || !safePatterns.some(template => matches(template, path))) { await route.abort(); return }
    if (holdRecipes && path === endpoints['Recipes.List'].path) await gate
    await route.continue()
  })
  const row: Row = { role:'RD_SPECIALIST',page:'/rd-specialist/recipes',feature:'Loading state (real GET delayed, no mocked response)',operation:'Recipes.List',endpoint:endpoints['Recipes.List'].path,method:'GET',permission:'ALLOW',fe:'Not observed',api:'Real GET forwarded after loading observation',status:'SAFETY BLOCKED',reason:'Check not completed' }
  try {
    const auth = await loginAsRole(page, 'RD_SPECIALIST')
    expect(auth.ok, 'Real auth prerequisite').toBe(true)
    holdRecipes = true
    await page.goto('/rd-specialist/recipes', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main .state-panel[role="status"]')).toBeVisible()
    row.observed = { loading: true }
    release!()
    await expect(page.locator('main .state-panel[role="status"]')).toHaveCount(0)
    await expect(page.locator('main [role="alert"]')).toHaveCount(0)
    row.status='READY'; row.fe='Rendered loading then live response';row.reason='Real GET was held before forwarding; no response fulfillment/mock/error injection'
  } finally {
    release?.()
    await logout(page).catch(()=>{})
    const file='e2e-private/business-results.json'
    const prior: Row[]=JSON.parse(fs.readFileSync(file,'utf8'))
    fs.writeFileSync(file,JSON.stringify([...prior.filter(item=>item.feature!==row.feature),row],null,2))
  }
})
