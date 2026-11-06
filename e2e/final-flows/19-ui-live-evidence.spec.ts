import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { Actors, api } from './harness.js'
import { captureEvidence } from '../helpers/evidence.js'

const runId = process.env.UI_EVIDENCE_RUN_ID ?? 'UIUX_20261106', before = process.env.UI_EVIDENCE_PHASE === 'before'
const stateFile = 'e2e-private/uiux-20261106.json'
const state = () => fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) as { ingredient?: number; code: string } : { code: 'UIUX261106' }

test('LIVE UIUX-ERRORS live-auth form preserves draft and links multi-field validation', async ({ browser }, info) => {
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/uiux-operations.json')
  try {
    const page = await actors.login('ADMIN'); await page.setViewportSize({ width: 390, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/admin/ingredients'); await page.getByRole('button', { name: 'Thêm mới', exact: true }).click()
    await page.locator('#name').fill('UIUX261106 retained draft'); await page.getByRole('dialog').locator('button[type=submit]').click()
    const options = { runId, caseId: 'UIUX-ERRORS-LIVE', role: 'ADMIN', routeTemplate: '/admin/ingredients', scope: 'LIVE_UI' as const, assertion: 'Authenticated actual-API page; local invalid submission preserves draft and links field errors' }
    if (before) await captureEvidence(page, { ...options, phase: 'before', result: 'REPRODUCED' })
    const summary = page.getByRole('region', { name: 'Cần kiểm tra trước khi gửi' }); await expect(summary).toBeVisible(); await summary.getByRole('button').first().click()
    await expect(page.locator('#ingredientCode')).toBeFocused(); await expect(page.locator('#name')).toHaveValue('UIUX261106 retained draft')
    if (!before) await captureEvidence(page, { ...options, phase: 'after', result: 'PASS' })
  } catch { throw new Error('Sanitized UIUX live form assertion; contexts closed before reporter') }
  finally { await actors.close() }
})

test('LIVE UIUX-TABLE owned-filtered data keyboard scrolls and remains inside mobile viewport', async ({ browser }, info) => {
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/uiux-operations.json')
  try {
    const page = await actors.login('ADMIN'); await page.setViewportSize({ width: 360, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/admin/ingredients'); await page.locator('#filter-q').fill('E2E_REVIEW_MW1K2W7N')
    const searched = page.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/ingredients' && new URL(r.url()).searchParams.get('q') === 'E2E_REVIEW_MW1K2W7N')
    await page.getByRole('button', { name: 'Áp dụng', exact: true }).click(); expect((await searched).status()).toBe(200)
    const table = page.locator('.table-wrap'); await expect(table.locator('tbody tr')).toHaveCount(1)
    const options = { runId, caseId: 'UIUX-TABLE-LIVE', role: 'ADMIN', routeTemplate: '/admin/ingredients', scope: 'LIVE_UI' as const, assertion: 'Actual server-filtered owned data; named table region supports keyboard horizontal scroll' }
    if (before) await captureEvidence(page, { ...options, phase: 'before', result: 'REPRODUCED' })
    await expect(table).toHaveAttribute('tabindex', '0'); await table.focus(); await page.keyboard.press('ArrowRight'); await expect.poll(() => table.evaluate(el => el.scrollLeft)).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await table.evaluate(el => { el.scrollLeft = 0 })
    if (!before) await captureEvidence(page, { ...options, phase: 'after', result: 'PASS' })
  } catch { throw new Error('Sanitized UIUX live table assertion; no private payload retained') }
  finally { await actors.close() }
})

test('LIVE UIUX owned ingredient save and duplicate409 retain draft and recover through accessible errors', async ({ browser }, info) => {
  test.skip(before || process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Run after shared fix with authorized local writes')
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/uiux-operations.json'), record = state()
  try {
    const page = await actors.login('ADMIN'); await page.setViewportSize({ width: 390, height: 900 }); await page.goto('/admin/ingredients')
    async function fill() { await page.getByRole('button', { name: 'Thêm mới', exact: true }).click(); await page.locator('#ingredientCode').fill(record.code); await page.locator('#name').fill('UIUX261106 technical ingredient'); await page.locator('#unit').selectOption('g'); await page.locator('#shelfLifeHours').fill('24') }
    if (!record.ingredient) {
      await fill(); const created = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/v1/ingredients')
      await page.getByRole('dialog').locator('button[type=submit]').click(); const response = await created; expect(response.status()).toBe(201); record.ingredient = Number((await response.json()).id); fs.writeFileSync(stateFile, JSON.stringify(record))
      await expect(page.getByRole('dialog').getByRole('status')).toBeVisible(); await captureEvidence(page, { runId, caseId: 'UIUX-SAVE', role: 'ADMIN', phase: 'retest', scope: 'LIVE_UI', routeTemplate: '/admin/ingredients', result: 'PASS', assertion: 'Real UI POST201 persisted owned ingredient; no double submit' })
      await page.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    }
    const owned = await api(page, 'Ingredients.Get', { id: record.ingredient! }); expect(owned.data.ingredientCode).toBe(record.code)
    await fill(); const refused = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/v1/ingredients')
    await page.getByRole('dialog').locator('button[type=submit]').click(); expect((await refused).status()).toBe(409)
    await expect(page.getByRole('region', { name: 'Cần kiểm tra trước khi gửi' })).toBeVisible(); await expect(page.locator('#name')).toHaveValue('UIUX261106 technical ingredient')
    await expect(page.locator('#ingredientCode')).toBeFocused()
    await captureEvidence(page, { runId, caseId: 'UIUX-CONFLICT', role: 'ADMIN', phase: 'retest', scope: 'LIVE_UI', routeTemplate: '/admin/ingredients', result: 'PASS', assertion: 'Real duplicate409 UNIQUE; accessible field summary, code focus and draft retained' })
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('dialog').locator('header').getByRole('button', { name: 'Đóng', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0)
    expect((await api(page, 'Ingredients.Deactivate', { id: record.ingredient! })).data.status).toBe('INACTIVE')
    const prior = await api(page, 'Ingredients.Get', { id: record.ingredient! })
    const invalid = await api(page, 'Ingredients.Update', { id: record.ingredient! }, { ingredientCode: record.code, name: 'UIUX261106 technical ingredient', unit: 'g', shelfLifeHours: 24, status: 'INACTIVE', brewTempMinC: 99, brewTempMaxC: 40 })
    expect(invalid.status).toBe(400)
    const unchanged = await api(page, 'Ingredients.Get', { id: record.ingredient! }); expect(unchanged.data.brewTempMinC).toBe(prior.data.brewTempMinC); expect(unchanged.data.brewTempMaxC).toBe(prior.data.brewTempMaxC)
    fs.writeFileSync('e2e-private/uiux-api-assertions.json', JSON.stringify({ ingredientId: record.ingredient, duplicateStatus: 409, invalidRangeStatus: invalid.status, persistedWindowUnchanged: true, finalStatus: unchanged.data.status, scope: 'LIVE_API; no UI screenshot claimed for API-only400' }, null, 2))
  } catch { throw new Error('Sanitized UIUX save/conflict review failure') }
  finally { await actors.close() }
})

test('LIVE UIUX-SUMMARY-FOCUS actual-auth multi-error form focuses its overview', async ({ browser }, info) => {
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/uiux-operations.json')
  try {
    const page = await actors.login('ADMIN'); await page.setViewportSize({ width: 390, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/admin/ingredients')
    await page.getByRole('button', { name: 'Thêm mới', exact: true }).click(); await page.locator('#name').fill('UIUX261106 summary focus')
    await page.getByRole('dialog').locator('button[type=submit]').click()
    const summary = page.getByRole('region', { name: 'Cần kiểm tra trước khi gửi' }); await expect(summary).toBeVisible()
    const options = { runId, caseId: 'UIUX-SUMMARY-FOCUS-LIVE', role: 'ADMIN', routeTemplate: '/admin/ingredients', scope: 'LIVE_UI' as const, assertion: 'Actual-auth form: multiple errors move focus to overview; single-field error/link retains field navigation and draft' }
    if (before) await captureEvidence(page, { ...options, phase: 'before', result: 'REPRODUCED' })
    await expect(summary).toHaveAttribute('tabindex', '-1'); await expect(summary).toBeFocused()
    await summary.getByRole('button').first().click(); await expect(page.locator('#ingredientCode')).toBeFocused(); await expect(page.locator('#name')).toHaveValue('UIUX261106 summary focus')
    await page.getByRole('dialog').locator('button[type=submit]').click(); await expect(summary).toBeFocused()
    if (!before) await captureEvidence(page, { ...options, phase: 'after', result: 'PASS' })
  } catch { throw new Error('Sanitized UIUX summary focus failure') }
  finally { await actors.close() }
})
