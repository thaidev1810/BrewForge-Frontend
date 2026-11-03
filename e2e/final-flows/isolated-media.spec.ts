import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import type { InternalAxiosRequestConfig } from 'axios'
import { manifest, record } from './harness.js'

test('ISOLATED media source change discards preceding protected video', async ({ page }) => {
  await page.route('**/api/**', route => route.abort())
  await page.goto('/login'); await page.locator('#username').waitFor()
  await page.evaluate(async bytes => {
    const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    const auth = await import(/* @vite-ignore */ String('/src/features/auth/authSlice.ts'))
    const { apiClient } = await import(/* @vite-ignore */ String('/src/services/apiClient.ts'))
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => ({ config, status: 200, statusText: 'OK', headers: {}, data: config.url?.startsWith('/practical-videos/') ? new Blob([new Uint8Array(bytes)], { type: 'video/webm' }) : config.url?.includes('unread-count') ? { count: 0 } : { items: [], total: 0, page: 1, size: 20 } })
    const arg = { username: 'TEST_ONLY', password: 'TEST_ONLY' }
    store.dispatch(auth.login.pending('TEST_ONLY', arg)); store.dispatch(auth.login.fulfilled({ user: { id: '991', name: 'TEST_ONLY', username: 'TEST_ONLY', role: 'TRAINEE', email: 'test@example.invalid', branchId: '1' }, accessToken: 'TEST_ONLY', refreshToken: 'TEST_ONLY' }, 'TEST_ONLY', arg))
  }, Array.from(fs.readFileSync('e2e-private/final-fixtures/technical-test.webm')))
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
  async function navigate(path: string) {
    await page.evaluate(path => { history.pushState({ idx: Number(history.state?.idx ?? 0) + 1, key: 'TEST_ONLY' }, '', path); dispatchEvent(new PopStateEvent('popstate', { state: history.state })) }, path)
  }
  await navigate('/barista/videos/7001')
  await page.getByRole('button', { name: 'Tải & xem bản ghi', exact: true }).click()
  await expect(page.locator('video')).toHaveCount(1)
  await navigate('/barista/videos/7002')
  await expect(page).toHaveURL(/\/barista\/videos\/7002$/)
  await expect(page.locator('video')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Tải & xem bản ghi', exact: true })).toBeVisible()
  const m = manifest()
  record(m, 'isolated-media-reset', { flow: 'Protected media source reset regression', role: 'TEST_ONLY', kind: 'unhappy', via: 'ISOLATED', status: 'PASS_ISOLATED', assertion: 'Old protected video disappears on SPA source change; no real API requests in this fixture', evidence: 'Playwright isolated test, TEST_ONLY Axios adapter' })
})
