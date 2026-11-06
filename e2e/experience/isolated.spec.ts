import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { InternalAxiosRequestConfig } from 'axios'
import fs from 'node:fs'

declare global { interface Window { experience: { mode: string; submits: number; release?: () => void } } }
async function setup(page: Page) {
  // Isolated FE only. No network request may reach a real API.
  await page.route('**/api/**', route => route.abort())
  await page.goto('/login')
  await page.getByLabel('Tên đăng nhập').waitFor()
  await page.evaluate(async () => {
    const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    const auth = await import(/* @vite-ignore */ String('/src/features/auth/authSlice.ts'))
    const { apiClient } = await import(/* @vite-ignore */ String('/src/services/apiClient.ts'))
    window.experience = { mode: 'field-error', submits: 0 }
    const reply = (config: InternalAxiosRequestConfig, data: unknown) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      if (config.method === 'post' && config.url === '/ingredients') {
        window.experience.submits++
        if (window.experience.mode === 'pending') await new Promise<void>(resolve => { window.experience.release = resolve })
        if (window.experience.mode === 'success') return reply(config, { id: 991, ...JSON.parse(config.data) })
        return Promise.reject({ isAxiosError: true, config, response: { config, status: 422, data: { code: 'VALIDATION_FAILED', message: 'TEST_ONLY invalid input', details: [{ field: 'name', issue: 'TEST_ONLY name already exists' }] } } })
      }
      if (config.url === '/ingredients') {
        if (window.experience.mode === 'server-error') return Promise.reject({ isAxiosError: true, config, response: { config, status: 503, data: { message: 'TEST_ONLY unavailable' } } })
        return reply(config, { items: [], page: 1, size: 20, total: 0 })
      }
      if (config.url === '/me/notifications/unread-count') return reply(config, { count: 0 })
      return reply(config, { items: [], page: 1, size: 20, total: 0 })
    }
    store.dispatch(auth.login.pending('TEST_ONLY', { username: 'TEST_ONLY', password: 'TEST_ONLY' }))
    store.dispatch(auth.login.fulfilled({ user: { id: '991', username: 'TEST_ONLY', name: 'TEST_ONLY specialist', email: 'test@example.invalid', role: 'ADMIN', branchId: null }, accessToken: 'TEST_ONLY', refreshToken: 'TEST_ONLY' }, 'TEST_ONLY', { username: 'TEST_ONLY', password: 'TEST_ONLY' }))
  })
  await page.waitForURL('**/admin/dashboard')
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Nguyên liệu', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Thêm mới', exact: true })).toBeVisible()
}
async function validForm(page: Page) {
  await page.getByRole('button', { name: 'Thêm mới', exact: true }).click()
  await page.locator('#ingredientCode').fill('TEST_ONLY_INGREDIENT')
  await page.locator('#name').fill('TEST_ONLY ingredient')
  await page.locator('#unit').selectOption('g')
  await page.locator('#shelfLifeHours').fill('24')
}

test('PASS_ISOLATED: backend field error maps to input, retains draft and focuses first error', async ({ page }) => {
  await setup(page); await validForm(page)
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(page.locator('.error-box')).toBeVisible()
  await expect(page.locator('[data-field="name"]')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#name')).toBeFocused()
  await expect(page.locator('#name')).toHaveValue('TEST_ONLY ingredient')
  await expect(page.locator('#name')).toHaveAttribute('aria-describedby', /.+/)
})

test('PASS_ISOLATED: required whitespace, cancel/reopen and dialog keyboard focus', async ({ page }) => {
  await setup(page); await validForm(page)
  await page.locator('#name').fill('   ')
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(page.locator('#name')).toBeFocused()
  expect(await page.evaluate(() => window.experience.submits)).toBe(0)
  page.once('dialog', dialog => dialog.dismiss())
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Thêm mới', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Thêm mới', exact: true }).click()
  await expect(page.locator('#name')).toHaveValue('')
  const dialog = page.getByRole('dialog'), confirm = dialog.getByRole('button', { name: 'Xác nhận', exact: true })
  await confirm.focus(); await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Đóng', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab'); await expect(confirm).toBeFocused()
})

test('PASS_ISOLATED: double submit/Enter sends one pending request and success stays visible', async ({ page }) => {
  await setup(page); await validForm(page)
  await page.evaluate(() => { window.experience.mode = 'pending' })
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).dblclick()
  await expect.poll(() => page.evaluate(() => window.experience.submits)).toBe(1)
  await page.keyboard.press('Enter')
  expect(await page.evaluate(() => window.experience.submits)).toBe(1)
  await page.evaluate(() => { window.experience.mode = 'success'; window.experience.release?.() })
  await expect(page.getByRole('dialog').getByText('Máy chủ đã xử lý yêu cầu.')).toBeVisible()
})

test('PASS_ISOLATED: 503 retry recovers into distinct empty state at four viewports', async ({ page }) => {
  await setup(page)
  await page.evaluate(async () => { window.experience.mode = 'server-error'; const { backendApi } = await import(/* @vite-ignore */ String('/src/services/backend/operations.ts')); const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts')); store.dispatch(backendApi.util.invalidateTags(['Workspace'])) })
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible()
  await page.evaluate(() => { window.experience.mode = 'empty' })
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.locator('main .error-box')).toHaveCount(0)
  await expect(page.getByText('Chưa có dữ liệu', { exact: true })).toBeVisible()
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('button', { name: 'Thêm mới', exact: true }).click()
    await expect(page.getByRole('spinbutton', { name: 'Nhiệt độ pha tối thiểu (°C)', exact: true })).toBeVisible()
    await expect(page.getByRole('spinbutton', { name: 'Nhiệt độ pha tối đa (°C)', exact: true })).toBeVisible()
    const bounds = await page.getByRole('dialog').boundingBox()
    expect(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1).toBeTruthy()
    await expect(page.getByRole('button', { name: 'Xác nhận', exact: true })).toBeInViewport()
    fs.mkdirSync('e2e-private/experience-artifacts', { recursive: true })
    await page.screenshot({ path: `e2e-private/experience-artifacts/isolated-dialog-${width}.png` })
    await page.keyboard.press('Escape')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})
