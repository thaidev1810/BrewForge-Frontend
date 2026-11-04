import { test, expect } from '@playwright/test'

test('landing from main survives the merge without replacing protected routes', async ({ page }) => {
  const errors: string[] = []
  const apiRequests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.url().includes('/api/v1/')) apiRequests.push(request.method()) })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.landing-page')).toHaveClass(/ready/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Precision coffee')
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.getByRole('button', { name: 'Launch App', exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.getByRole('button', { name: 'Launch App', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('Tên đăng nhập')).toBeVisible()
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim())).toBe('')
  expect(await page.evaluate(() => document.documentElement.classList.contains('js'))).toBe(false)
  await page.goto('/rd-manager/courses/pending', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.landing-page')).toHaveClass(/ready/)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Precision coffee')
  expect(apiRequests).toEqual([])
  expect(errors).toEqual([])
})

test('landing role buttons lead to real login without posting demo credentials', async ({ page }) => {
  const loginRequests: string[] = []
  page.on('request', request => { if (request.url().includes('/auth/login')) loginRequests.push(request.method()) })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.roles-bar button')).toHaveCount(8)
  await page.locator('.roles-bar button').first().click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('Tên đăng nhập')).toBeVisible()
  expect(loginRequests).toEqual([])
})
