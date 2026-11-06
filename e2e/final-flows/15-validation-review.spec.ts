import { test, expect } from '@playwright/test'
import type { InternalAxiosRequestConfig } from 'axios'
import { reviewed } from './review-registry.js'

test('ISOLATED SOP content save and background change invalidate preceding validation report', async ({ page }) => {
  await page.route('**/api/**', route => route.abort())
  await page.goto('/login'); await page.locator('#username').waitFor()
  await page.evaluate(async () => {
    const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    const auth = await import(/* @vite-ignore */ String('/src/features/auth/authSlice.ts'))
    const { apiClient } = await import(/* @vite-ignore */ String('/src/services/apiClient.ts'))
    const version = { id: 701, recipeId: 702, versionNo: 1, state: 'DRAFT', isImmutable: false, createdBy: 991, steps: [{ id: 703, stepOrder: 1, actionText: 'TEST_ONLY original', ingredients: [], dependsOn: [], durationSeconds: null }], variants: [] }
    const state = window as unknown as { changeReviewVersion: () => void }
    state.changeReviewVersion = () => { version.steps[0].actionText = 'TEST_ONLY external revision' }
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      let data: unknown = { items: [], total: 0, page: 1, size: 20 }
      if (config.url?.includes('/unread-count')) data = { count: 0 }
      if (config.url === '/recipe-versions/701') {
        if (config.method === 'put') version.steps[0].actionText = JSON.parse(String(config.data)).steps[0].actionText
        data = structuredClone(version)
      }
      if (config.url === '/recipe-versions/701/validate') data = { versionId: 701, passed: false, checks: [{ checkType: 'ORDERING', passed: false, violations: [{ message: 'TEST_ONLY previous validation' }] }] }
      return { config, status: 200, statusText: 'OK', headers: {}, data }
    }
    const arg = { username: 'TEST_ONLY', password: 'TEST_ONLY' }
    store.dispatch(auth.login.pending('TEST_ONLY', arg)); store.dispatch(auth.login.fulfilled({ user: { id: '991', name: 'TEST_ONLY', username: 'TEST_ONLY', role: 'RD_SPECIALIST', email: 'test@example.invalid', branchId: null }, accessToken: 'TEST_ONLY', refreshToken: 'TEST_ONLY' }, 'TEST_ONLY', arg))
  })
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
  await page.evaluate(() => { history.pushState({ ...history.state, idx: Number(history.state?.idx ?? 0) + 1 }, '', '/rd-specialist/versions/701'); dispatchEvent(new PopStateEvent('popstate', { state: history.state })) })
  async function validate() {
    await page.getByRole('button', { name: 'Chạy kiểm tra', exact: true }).click(); await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
    await expect(page.getByRole('dialog')).toContainText('TEST_ONLY previous validation'); await page.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    await page.getByRole('tab', { name: 'Kết quả kiểm tra', exact: true }).click(); await expect(page.getByRole('tabpanel')).toContainText('TEST_ONLY previous validation')
  }
  await validate()
  await page.getByRole('button', { name: 'Sửa các bước', exact: true }).click(); await page.locator('[id="steps[0].actionText"]').fill('TEST_ONLY revised locally')
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.getByRole('dialog').getByRole('status')).toBeVisible()
  await page.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
  await expect(page.getByRole('tabpanel')).not.toContainText('TEST_ONLY previous validation')
  await expect(page.getByRole('tabpanel')).toContainText('Chạy kiểm tra để xem kết quả mới')
  await validate()
  await page.evaluate(async () => {
    (window as unknown as { changeReviewVersion: () => void }).changeReviewVersion()
    const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    const { backendApi } = await import(/* @vite-ignore */ String('/src/services/backend/operations.ts'))
    store.dispatch(backendApi.util.invalidateTags([{ type: 'Scope', id: 'Recipes' }]))
  })
  await expect(page.getByRole('tabpanel')).not.toContainText('TEST_ONLY previous validation')
  reviewed('SOP-VALIDATION-STALE', { module: 'Recipe/SOP', role: 'RD_SPECIALIST TEST_ONLY', flow: 'Validation freshness', kind: 'unhappy', prerequisites: 'API blocked; adapter-owned version701', via: 'ISOLATED_UI', assertion: 'Successful local content save and external content refetch invalidate preceding report; revalidation required', status: 'PASS_ISOLATED', evidence: 'Reproduced stale report before fix; adapter proves FE behavior only' })
})
