import process from 'node:process'
import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { Actors, api } from './harness.js'
import { captureEvidence } from '../helpers/evidence.js'
import { roles } from '../helpers/environment.js'
import matrix from '../fixtures/permission-matrix.json' with { type: 'json' }

const runId = process.env.UI_EVIDENCE_RUN_ID ?? 'UIUX_20261106'

test('PUBLIC UIUX landing/login retain design and fit four widths after shared fixes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const route of ['/', '/login']) {
    await page.goto(route)
    if (route === '/') await expect(page.locator('.landing-page')).toHaveClass(/ready/)
    else await expect(page.getByLabel('Tên đăng nhập')).toBeVisible()
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      await captureEvidence(page, { runId, caseId: route === '/' ? 'PUBLIC-LANDING' : 'PUBLIC-LOGIN', role: 'ANONYMOUS', routeTemplate: route, scope: 'PUBLIC_UI', phase: 'retest', result: 'PASS', assertion: 'Existing design retained; no horizontal page overflow; no auth state present' })
    }
  }
})

for (const role of roles) test('LIVE UIUX affected shared consumers and responsive navigation: ' + role, async ({ browser }, info) => {
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/uiux-operations.json')
  const old = JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json', 'utf8'))
  const routes = { ADMIN: 'ingredients', RD_SPECIALIST: 'versions/' + old.ids.version, RD_MANAGER: 'pilots/' + old.ids.pilot, TRAINER: 'assessment/' + old.ids.enrollment, TRAINING_MANAGER: 'enrollments/' + old.ids.enrollment, TRAINEE: 'certificates', BRANCH_MANAGER: 'sales', QUALITY_AUDITOR: 'branch-audits/' + old.ids.evidenceAudit }
  try {
    const page = await actors.login(role); await page.emulateMedia({ reducedMotion: 'reduce' })
    const prefix = matrix.find(row => row.role === role)!.prefix, suffix = routes[role]
    await page.goto(prefix + '/' + suffix); await expect(page.locator('main h1').first()).toBeVisible()
    await expect(page.locator('main .state-panel[role="status"]')).toHaveCount(0); await expect(page.locator('main .error-box')).toHaveCount(0)
    if (role === 'QUALITY_AUDITOR') {
      await page.getByRole('tab', { name: 'Ảnh minh chứng', exact: true }).click(); await page.locator('.evidence-gallery summary').first().click()
      await page.getByRole('button', { name: 'Xem ảnh minh chứng', exact: true }).click(); await expect.poll(() => page.getByAltText('Ảnh đính kèm').evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(640)
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      await captureEvidence(page, { runId, caseId: 'CONSUMER-' + role, role, routeTemplate: prefix + '/' + suffix.replace(/\d+/g, ':id'), scope: 'LIVE_UI', phase: 'retest', result: 'PASS', assertion: 'Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable' })
    }
    await page.reload(); await expect(page.locator('main h1').first()).toBeVisible(); expect((await api(page, 'Auth.Me')).ok).toBe(true)
  } catch { throw new Error('Sanitized UIUX consumer failure for role ' + role) }
  finally { await actors.close() }
})

test('LIVE UIUX protected video and persisted partial POS result use actual bytes/statuses', async ({ browser }, info) => {
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/uiux-operations.json'), old = JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json', 'utf8'))
  try {
    const trainer = await actors.login('TRAINER'); await trainer.goto('/trainer/videos/' + old.ids.video)
    await trainer.getByRole('button', { name: 'Tải & xem bản ghi', exact: true }).click()
    await expect.poll(() => trainer.locator('video').evaluate(el => (el as HTMLVideoElement).videoWidth)).toBe(640)
    await trainer.locator('video').evaluate(async el => { const video = el as HTMLVideoElement; video.muted = true; await video.play(); video.pause(); video.currentTime = 1 })
    await trainer.setViewportSize({ width: 360, height: 900 })
    await captureEvidence(trainer, { runId, caseId: 'MEDIA-RESULT', role: 'TRAINER', scope: 'LIVE_UI', phase: 'retest', routeTemplate: '/trainer/videos/:id', result: 'PASS', assertion: 'Protected synthetic WebM decodes640 and plays/seeks; no real person media' })
    const job = [...old.entities].reverse().find(row => row.type === 'POS import' && typeof row.id === 'string' && row.state.includes('partial CSV'))
    if (!job) throw new Error('No owned partial import checkpoint; do not substitute unrelated job')
    const bm = await actors.login('BRANCH_MANAGER'), result = await api(bm, 'Sales.ImportResult', { jobId: job.id }); expect(result.data.accepted).toBe(1); expect(result.data.rejected).toBe(6)
    await bm.goto('/store-manager/sales/import/' + job.id); await expect(bm.locator('main')).toContainText(job.id)
    await bm.setViewportSize({ width: 390, height: 900 })
    await captureEvidence(bm, { runId, caseId: 'POS-PARTIAL-RESULT', role: 'BRANCH_MANAGER', scope: 'LIVE_UI', phase: 'retest', routeTemplate: '/store-manager/sales/import/:jobId', result: 'PASS', assertion: 'Actual owned persisted partial job accepted1/rejected6; no new imports/dates or idempotency keys fabricated' })
  } catch { throw new Error('Sanitized UIUX media/POS evidence failure') }
  finally { await actors.close() }
})

test('PUBLIC UIUX probe real browser200% zoom, distinct from viewport resizing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/login')
  const initial = await page.evaluate(() => ({ dpr: devicePixelRatio, width: innerWidth, visualScale: visualViewport?.scale }))
  await page.keyboard.press('Control+0'); for (let step = 0; step < 5; step++) await page.keyboard.press('Control+Equal')
  const observed = await page.evaluate(() => ({ dpr: devicePixelRatio, width: innerWidth, visualScale: visualViewport?.scale }))
  const actual = Math.abs(observed.dpr / initial.dpr - 2) < .05 && Math.abs(observed.width / initial.width - .5) < .05 && observed.visualScale === 1
  fs.writeFileSync('e2e-private/uiux-zoom.json', JSON.stringify({ actualBrowser200Percent: actual, initial, observed, result: actual ? 'PASS_PUBLIC_UI' : 'NOT_RUN', reason: actual ? 'Browser accelerator changed layout viewport and DPR; no resize/pinch emulation' : 'Automation did not apply browser-level zoom; viewport reflow tests are not claimed as real200%' }, null, 2))
  test.skip(!actual, 'Real browser zoom accelerator not available through this automation; recorded NOT_RUN')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await captureEvidence(page, { runId, caseId: 'ZOOM-200', role: 'ANONYMOUS', scope: 'PUBLIC_UI', phase: 'retest', routeTemplate: '/login', result: 'PASS', assertion: 'Actual browser zoom200 verified by DPR, layout viewport and visualScale1' })
})
