import { test, expect, type Page } from '@playwright/test'
import process from 'node:process'
import type { InternalAxiosRequestConfig } from 'axios'
import { captureEvidence } from '../helpers/evidence.js'

const runId = process.env.UI_EVIDENCE_RUN_ID ?? 'UIUX_20261106', before = process.env.UI_EVIDENCE_PHASE === 'before'
const phase = before ? 'before' as const : 'after' as const
async function isolated(page: Page, route: string, role = 'ADMIN') {
  await page.route('**/api/**', request => request.abort())
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/login'); await page.locator('#username').waitFor()
  await page.evaluate(async role => {
    const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    const auth = await import(/* @vite-ignore */ String('/src/features/auth/authSlice.ts'))
    const { apiClient } = await import(/* @vite-ignore */ String('/src/services/apiClient.ts'))
    const state = window as unknown as { releaseUiWrite: () => void; uiWritePending: boolean }
    state.uiWritePending = false
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      let data: unknown = { items: [], total: 0, page: 1, size: 20 }
      if (config.url?.includes('unread-count')) data = { count: 0 }
      if (config.url === '/roles') data = ['ADMIN','RD_SPECIALIST','RD_MANAGER','TRAINER','TRAINING_MANAGER','TRAINEE','BRANCH_MANAGER','QUALITY_AUDITOR'].map(role => ({ role, permissions: [] }))
      if (config.url === '/ingredients' && config.method === 'get') data = { items: Array.from({ length: 2 }, (_, index) => ({ id: index + 701, ingredientCode: 'TEST_ONLY_' + index, name: 'TEST_ONLY nguyên liệu đối soát', unit: 'g', shelfLifeHours: 24, status: 'ACTIVE' })), total: 2, page: 1, size: 20 }
      if (config.url === '/ingredients' && config.method === 'post') { state.uiWritePending = true; await new Promise<void>(resolve => { state.releaseUiWrite = resolve }); data = { id: 703, ...JSON.parse(String(config.data)) } }
      return { config, status: config.method === 'post' ? 201 : 200, statusText: 'OK', headers: {}, data }
    }
    const arg = { username: 'TEST_ONLY', password: 'TEST_ONLY' }
    store.dispatch(auth.login.pending('TEST_ONLY', arg)); store.dispatch(auth.login.fulfilled({ user: { id: '991', name: 'TEST_ONLY', username: 'TEST_ONLY', role, email: 'test@example.invalid', branchId: null }, accessToken: 'TEST_ONLY', refreshToken: 'TEST_ONLY' }, 'TEST_ONLY', arg))
  }, role)
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await page.evaluate(route => { history.pushState({ ...history.state, idx: Number(history.state?.idx ?? 0) + 1 }, '', route); dispatchEvent(new PopStateEvent('popstate', { state: history.state })) }, route)
  await expect(page.locator('main h1').first()).toBeVisible()
}
const evidence = (page: Page, caseId: string, assertion: string, role = 'ADMIN') => captureEvidence(page, { runId, caseId, role, phase, scope: 'ISOLATED_UI', routeTemplate: '/admin/ingredients', assertion, result: before ? 'REPRODUCED' : 'PASS' })

test('UIUX-DIALOG focus stays inside during pending write and returns to opener after close', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await isolated(page, '/admin/ingredients')
  const opener = page.getByRole('button', { name: 'Thêm mới', exact: true }); await opener.click()
  await page.locator('#ingredientCode').fill('TEST_ONLY_PENDING'); await page.locator('#name').fill('TEST_ONLY focus regression'); await page.locator('#unit').selectOption('g'); await page.locator('#shelfLifeHours').fill('24')
  await page.getByRole('dialog').locator('button[type=submit]').click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { uiWritePending: boolean }).uiWritePending)).toBe(true)
  await expect(page.getByRole('button', { name: 'Đang xử lý…', exact: true })).toBeDisabled()
  await page.keyboard.press('Tab')
  const contained = await page.evaluate(() => !!document.querySelector('[role="dialog"]')?.contains(document.activeElement))
  if (before) await evidence(page, 'UIUX-DIALOG', 'Pending mutation: keyboard focus must remain inside dialog')
  expect(contained, 'Focus must remain inside modal while all actions are disabled').toBe(true)
  if (!before) await evidence(page, 'UIUX-DIALOG', 'Pending mutation: keyboard focus remains inside dialog')
  await page.evaluate(() => (window as unknown as { releaseUiWrite: () => void }).releaseUiWrite())
  await expect(page.getByRole('dialog').getByRole('status')).toBeVisible()
  await page.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
  await expect(opener).toBeFocused()
})

test('UIUX-ERRORS local invalid submission offers a linked error overview without losing draft', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await isolated(page, '/admin/ingredients')
  await page.getByRole('button', { name: 'Thêm mới', exact: true }).click(); await page.locator('#name').fill('TEST_ONLY retained draft')
  await page.getByRole('dialog').locator('button[type=submit]').click(); await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
  if (before) await evidence(page, 'UIUX-ERRORS', 'Multiple errors must have a focusable linked overview; draft retained')
  const summary = page.getByRole('region', { name: 'Cần kiểm tra trước khi gửi' })
  await expect(summary).toBeVisible(); await summary.getByRole('button').first().click()
  await expect(page.locator('#ingredientCode')).toBeFocused(); await expect(page.locator('#name')).toHaveValue('TEST_ONLY retained draft')
  if (!before) await evidence(page, 'UIUX-ERRORS', 'Linked error overview focuses the first invalid field; draft retained')
})

test('UIUX-TABLE mobile data table is keyboard scrollable without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 }); await isolated(page, '/admin/ingredients')
  const table = page.locator('.table-wrap'); await expect(table.locator('tbody tr')).toHaveCount(2)
  if (before) await evidence(page, 'UIUX-TABLE', 'Wide data table needs a named focusable region and usable horizontal keyboard scrolling')
  await expect(table).toHaveAttribute('tabindex', '0'); await expect(table).toHaveAttribute('role', 'region')
  await table.focus(); await page.keyboard.press('ArrowRight')
  await expect.poll(() => table.evaluate(el => el.scrollLeft)).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await table.evaluate(el => { el.scrollLeft = 0 })
  if (!before) await evidence(page, 'UIUX-TABLE', 'Named table region receives keyboard focus and scrolls internally without page overflow')
})

test('UIUX-SUMMARY-FOCUS multiple errors focus the overview before choosing a field', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await isolated(page, '/admin/ingredients')
  await page.getByRole('button', { name: 'Thêm mới', exact: true }).click(); await page.locator('#name').fill('TEST_ONLY summary focus')
  await page.getByRole('dialog').locator('button[type=submit]').click()
  const summary = page.getByRole('region', { name: 'Cần kiểm tra trước khi gửi' }); await expect(summary).toBeVisible()
  if (before) await evidence(page, 'UIUX-SUMMARY-FOCUS', 'Existing error overview must be programmatically focusable and focused after multiple failures')
  await expect(summary).toHaveAttribute('tabindex', '-1'); await expect(summary).toBeFocused()
  await summary.getByRole('button').first().click(); await expect(page.locator('#ingredientCode')).toBeFocused()
  await expect(page.locator('#name')).toHaveValue('TEST_ONLY summary focus')
  await page.getByRole('dialog').locator('button[type=submit]').click(); await expect(summary).toBeFocused()
  if (!before) await evidence(page, 'UIUX-SUMMARY-FOCUS', 'Multiple errors focus linked overview; choosing a link focuses its field without losing draft')
})
