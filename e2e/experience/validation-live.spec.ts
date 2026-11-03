import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { loginAsRole, logout } from '../helpers/auth.js'

test('PASS_LIVE: duplicate own recipe maps server field error, preserves draft/focus and cancel returns focus', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'BLOCKED: duplicate POST needs explicit test DB authorization')
  test.setTimeout(60_000)
  const run = JSON.parse(fs.readFileSync('e2e-private/experience-business.json', 'utf8')) as { runId: string }
  const context = await browser.newContext({ baseURL: String(info.project.use.baseURL) })
  const page = await context.newPage()
  let failed = false, stage = 'login'
  try {
    const auth = await loginAsRole(page, 'RD_SPECIALIST'); if (!auth.ok) throw new Error('login prerequisite')
    stage = 'duplicate validation'
    await page.goto('/rd-specialist/recipes')
    const create = page.getByRole('button', { name: 'Thêm mới', exact: true })
    await create.click()
    await page.locator('#recipeCode').fill(run.runId)
    await page.locator('#name').fill(run.runId + ' duplicate validation')
    await page.locator('#category').selectOption('TEA')
    const request = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/recipes')
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
    expect((await request).status()).toBe(409)
    await expect(page.locator('[data-field="recipeCode"]')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#recipeCode')).toBeFocused()
    await expect(page.locator('#recipeCode')).toHaveValue(run.runId)
    await expect(page.locator('#recipeCode')).toHaveAttribute('aria-describedby', 'recipeCode-error-0')
    page.once('dialog', dialog => dialog.accept())
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0); await expect(create).toBeFocused()
    stage = 'logout'; await logout(page)
  } catch { failed = true }
  finally { await context.close(); fs.writeFileSync('e2e-private/experience-validation.json', JSON.stringify({ status: failed ? 'FAIL' : 'PASS_LIVE', stage, happy: ['draft retained', 'cancel returns focus'], unhappy: ['own duplicate HTTP 409', 'server error maps input and focus'] })) }
  if (failed) throw new Error('Sanitized live validation failure at ' + stage)
})
