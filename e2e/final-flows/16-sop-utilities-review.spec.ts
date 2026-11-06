import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { Actors, api } from './harness.js'
import { checkpoint, review, reviewed } from './review-registry.js'

test('REVIEW invalid real login is an error and valid sign-in still works', async ({ browser }, info) => {
  const context = await browser.newContext({ baseURL: String(info.project.use.baseURL) }), page = await context.newPage()
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/product-review-operations.json')
  try {
    await page.route('**/api/**', route => ['http://localhost:5113', 'http://127.0.0.1:5113'].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort())
    await page.goto('/login')
    await page.evaluate(async () => { const { apiBaseUrl } = await import(/* @vite-ignore */ String('/src/constants/config.ts')); if (!['http://localhost:5113/api/v1', 'http://127.0.0.1:5113/api/v1'].includes(apiBaseUrl)) throw new Error('Unexpected destination') })
    await page.locator('#username').fill(review().runId.toLowerCase() + '_absent'); await page.locator('#password').fill('TEST_ONLY_invalid_login')
    const rejected = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/auth/login'))
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click(); expect((await rejected).status()).toBe(401)
    await expect(page.getByRole('alert')).toBeVisible(); expect(await page.evaluate(() => sessionStorage.getItem('brewforge.session.v1'))).toBeNull()
    const valid = await actors.login('TRAINEE'); expect((await api(valid, 'Auth.Me')).ok).toBe(true)
    reviewed('AUTH-INVALID', { module: 'Auth', role: 'anonymous/TRAINEE', flow: 'Invalid credential error/recovery', kind: 'unhappy', prerequisites: 'One absent run-prefixed identity, no real account lock attempts', via: 'LIVE_UI', assertion: 'Actual login401 keeps anonymous state and accessible error; provided valid trainee still signs in', status: 'PASS_LIVE_UI', evidence: 'Only one negative attempt, no brute force or shared credentials altered' })
  } catch { throw new Error('Sanitized invalid-login review failure') }
  finally { await context.close(); await actors.close() }
})

test('REVIEW live SOP validation becomes obsolete after owned draft content edit; export and evidence remain readable', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Authorized local owned-draft test only')
  test.setTimeout(90_000)
  const old = JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json', 'utf8')), state = review()
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/product-review-operations.json'); let stage = 'ownership'
  try {
    const specialist = await actors.login('RD_SPECIALIST'), rd = await actors.login('RD_MANAGER'), qa = await actors.login('QUALITY_AUDITOR')
    const parent = await api(specialist, 'Recipes.Get', { id: old.ids.recipe }); expect(parent.data.recipeCode).toBe(old.runId)
    // Revalidate live state: the old rollback17 has since become VALIDATED.
    // Only the separate owned rejected copy16 remains editable; never force a state back.
    const draft = await api(specialist, 'RecipeVersions.Get', { id: old.ids.copiedDraft }); expect(draft.data.recipeId).toBe(old.ids.recipe); expect(draft.data.isImmutable).toBe(false); expect(['DRAFT', 'REJECTED']).toContain(draft.data.state)
    const versionId = Number(draft.data.id)
    state.ids.previewVersion = versionId; checkpoint(state)
    stage = 'validate current draft'
    await specialist.goto('/rd-specialist/versions/' + versionId)
    await specialist.getByRole('button', { name: 'Chạy kiểm tra', exact: true }).click()
    const validated = specialist.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/recipe-versions/' + versionId + '/validate'))
    await specialist.getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await validated).status()).toBe(200)
    await specialist.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    await specialist.getByRole('tab', { name: 'Kết quả kiểm tra', exact: true }).click()
    await expect(specialist.getByRole('tabpanel')).not.toContainText('Chạy kiểm tra để xem kết quả mới')
    stage = 'content edit invalidates report'
    await specialist.getByRole('button', { name: 'Sửa các bước', exact: true }).click()
    await specialist.getByRole('dialog').locator('details').evaluateAll(elements => elements.forEach(el => { (el as HTMLDetailsElement).open = true }))
    const field = specialist.locator('[id="steps[0].actionText"]'), text = await field.inputValue()
    await field.fill(text.includes(state.runId) ? text : text + '. ' + state.runId + ' technical draft revision')
    const saved = specialist.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith('/recipe-versions/' + versionId))
    await specialist.getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await saved).status()).toBe(200)
    await specialist.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    await expect(specialist.getByRole('tabpanel')).toContainText('Chạy kiểm tra để xem kết quả mới')
    expect((await api(specialist, 'Recipes.Get', { id: old.ids.recipe })).data.releasedVersionId).toBe(old.ids.version)
    reviewed('SOP-VALIDATION-LIVE', { module: 'Recipe/SOP', role: 'RD_SPECIALIST', flow: 'Validation/edit freshness', kind: 'unhappy', prerequisites: 'Verified legacy run-owned editable copy16; current released SOP15 retained', via: 'LIVE_UI', assertion: 'Actual validate200 report displayed; actual content PUT200 clears old report and prompts revalidate. Released version remains15', status: 'PASS_LIVE_UI', evidence: 'Owned copy only; validated rollback17 left intact; no review/release/impact on main LIVE chain' })
    stage = 'scoped compliance export'
    await rd.goto('/rd-manager/compliance'); await rd.locator('#filter-format').selectOption('csv'); await rd.locator('#filter-courseId').fill(String(old.ids.course)); await rd.locator('#filter-branchId').fill(String(old.ids.branch)); await rd.locator('#filter-recipeVersionId').fill(String(old.ids.version))
    await rd.getByRole('button', { name: 'Áp dụng', exact: true }).click()
    const downloaded = rd.waitForEvent('download'); await rd.getByRole('button', { name: 'Tải báo cáo', exact: true }).click()
    const download = await downloaded; expect(download.suggestedFilename().endsWith('.csv')).toBe(true)
    const stream = await download.createReadStream(); let bytes = 0; for await (const chunk of stream) bytes += chunk.length; expect(bytes).toBeGreaterThan(0)
    reviewed('REPORT-EXPORT', { module: 'Reports', role: 'RD_MANAGER', flow: 'Scoped CSV export', kind: 'happy', prerequisites: 'Owned course8/SOP15/branch1 filters', via: 'LIVE_UI', assertion: 'Real scoped download has CSV filename and nonempty stream; personal rows discarded in memory', status: 'PASS_LIVE_UI', evidence: 'No report file retained; XLSX report variant NOT_RUN' })
    stage = 'audit evidence'
    await qa.goto('/quality-auditor/branch-audits/' + old.ids.evidenceAudit)
    await qa.getByRole('tab', { name: 'Ảnh minh chứng', exact: true }).click()
    await qa.locator('.evidence-gallery summary').first().click()
    await qa.getByRole('button', { name: 'Xem ảnh minh chứng', exact: true }).click()
    await expect.poll(() => qa.locator('img[alt="Ảnh đính kèm"]').evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(640)
    reviewed('QUALITY-EVIDENCE', { module: 'Quality', role: 'QUALITY_AUDITOR', flow: 'Owned protected image', kind: 'happy', prerequisites: 'Verified previous own audit4 with synthetic PNG', via: 'LIVE_UI', assertion: 'Existing synthetic protected evidence still authenticates and decodes640 after merge', status: 'PASS_LIVE_UI', evidence: 'No new employee/audit obligation created' })
  } catch { throw new Error('Sanitized SOP/utilities review failure at ' + stage) }
  finally { await actors.close() }
})
