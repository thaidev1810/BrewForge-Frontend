import { test, expect } from '@playwright/test';

test('login renders without JavaScript errors and fits desktop', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.name));
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập workspace' })).toBeVisible();
  await expect(page.getByLabel('Tên đăng nhập')).toBeVisible();
  await expect(page.getByLabel('Mật khẩu')).toBeVisible();
  for (const width of [1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeInViewport();
  }
  expect(errors).toEqual([]);
});

test('empty credentials validate locally without API requests', async ({ page }) => {
  let requests = 0;
  page.on('request', request => { if (request.url().includes('/api/v1/')) requests++; });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByLabel('Tên đăng nhập')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Mật khẩu')).toHaveAttribute('aria-invalid', 'true');
  expect(requests).toBe(0);
});

const prefixes = ['admin', 'rd-specialist', 'rd-manager', 'trainer', 'training-manager', 'barista', 'store-manager', 'quality-auditor'];
for (const prefix of prefixes) {
  test(`anonymous ${prefix} dashboard redirects to login`, async ({ page }) => {
    await page.goto(`/${prefix}/dashboard`);
    await expect(page).toHaveURL(/\/login$/);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Đăng nhập workspace' })).toBeVisible();
  });
}
