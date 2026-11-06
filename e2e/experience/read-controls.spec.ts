import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { loginAsRole, logout } from '../helpers/auth.js'

test('PASS_LIVE: recipe search/sort/page-size and inverted audit dates preserve UI/API semantics', async ({ browser }, info) => {
  test.setTimeout(90_000)
  const context = await browser.newContext({ baseURL: String(info.project.use.baseURL) })
  const page = await context.newPage()
  const run = JSON.parse(fs.readFileSync('e2e-private/experience-business.json', 'utf8')) as { runId: string; ids: { recipe: number } }
  let stage = 'login specialist', failed = false
  try {
    const auth = await loginAsRole(page, 'RD_SPECIALIST'); if (!auth.ok) throw new Error('login prerequisite')
    stage = 'search'
    await page.goto('/rd-specialist/recipes')
    await expect(page.locator('main .state-panel[role="status"]')).toHaveCount(0)
    await expect(page.locator('#filter-q')).toBeVisible()
    const search = page.waitForResponse(response => { const url = new URL(response.url()); return url.pathname === '/api/v1/recipes' && url.searchParams.get('q') === run.runId })
    await page.locator('#filter-q').fill(run.runId)
    await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
    const response = await search; expect(response.status()).toBe(200)
    const data = await response.json(); expect(data.items.some((item: { id: number }) => item.id === run.ids.recipe)).toBe(true)
    stage = 'sort'
    const sorting = page.waitForResponse(response => { const url = new URL(response.url()); return url.pathname === '/api/v1/recipes' && url.searchParams.get('sort') === 'name,asc' && url.searchParams.get('q') === run.runId })
    await page.getByLabel('Sắp xếp', { exact: true }).selectOption('name,asc')
    expect((await sorting).status()).toBe(200)
    stage = 'page size'
    const sizing = page.waitForResponse(response => { const url = new URL(response.url()); return url.pathname === '/api/v1/recipes' && url.searchParams.get('size') === '50' && url.searchParams.get('page') === '1' })
    await page.getByRole('combobox', { name: 'Số dòng mỗi trang' }).selectOption('50')
    expect((await sizing).status()).toBe(200)
    await expect(page.getByRole('button', { name: 'Trang trước', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled()
    await logout(page)
    stage = 'audit dates'
    const auditor = await loginAsRole(page, 'QUALITY_AUDITOR'); if (!auditor.ok) throw new Error('login prerequisite')
    await page.goto('/quality-auditor/branch-audits')
    await expect(page.locator('#filter-from')).toBeVisible()
    await page.locator('#filter-from').fill('2026-11-10')
    await page.locator('#filter-to').fill('2026-11-01')
    let invalidSent = false
    page.on('request', request => { const url = new URL(request.url()); if (url.pathname === '/api/v1/branch-audits' && url.searchParams.get('from') === '2026-11-10') invalidSent = true })
    await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Ngày bắt đầu không sau ngày kết thúc.' })).toBeVisible()
    expect(invalidSent).toBe(false)
    await expect(page.locator('#filter-from')).toHaveValue('2026-11-10')
    await logout(page)
  } catch { failed = true }
  finally { await context.close(); fs.writeFileSync('e2e-private/experience-read-controls.json', JSON.stringify({ status: failed ? 'FAIL' : 'PASS_LIVE', stage, happy: ['real search retains own run row', 'sort and query preserved', 'page-size resets page 1 with real disabled boundaries'], unhappy: ['inverted date range blocked before API and values retained'] })) }
  if (failed) throw new Error('Sanitized read control failure at ' + stage)
})
