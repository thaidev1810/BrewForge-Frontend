import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { loginAsRole, logout } from '../helpers/auth.js'
import { roles } from '../helpers/environment.js'
import matrix from '../fixtures/permission-matrix.json' with { type: 'json' }
import catalog from '../fixtures/business-readiness.json' with { type: 'json' }

const pages: Record<string, string[]> = {
  ADMIN: ['users', 'recipes'], RD_SPECIALIST: ['recipes', 'ingredients'], RD_MANAGER: ['courses/pending', 'recipes', 'launch'],
  TRAINER: ['courses', 'assignments'], TRAINING_MANAGER: ['learning-path', 'assignments'], TRAINEE: ['learning-path', 'learning'],
  BRANCH_MANAGER: ['assignments', 'branch-audits', 'launch'], QUALITY_AUDITOR: ['branch-audits', 'quality-summary'],
}
const outcomes: { role: string; status: string; checks: string[] }[] = []
function matches(template: string, path: string) {
  return new RegExp('^' + template.replace(/\{[^}]+\}/g, '[^/]+') + '$').test(path)
}
for (const role of roles) test(`${role}: PASS_LIVE auth, safe pages, responsive, permissions and logout`, async ({ browser }, info) => {
  test.setTimeout(180_000)
  // Manual contexts are closed before failure reporting: no DOM/error snapshot can retain identity.
  const context = await browser.newContext({ baseURL: String(info.project.use.baseURL), viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage(), checks: string[] = []
  let stage = 'login', failed = false
  const blocked = new Set<string>()
  try {
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (!url.pathname.startsWith('/api/')) return route.continue()
      if (/\/auth\/(login|refresh|logout|me)$/.test(url.pathname)) return route.continue()
      if (request.method() === 'GET' && catalog.safe.some(endpoint => matches(endpoint.path, url.pathname))) return route.continue()
      blocked.add(url.pathname.replace(/\d+/g, ':id')); return route.abort()
    })
    const auth = await loginAsRole(page, role)
    if (!auth.ok) { checks.push(`login rejected: ${auth.category}; HTTP ${auth.status ?? 0}`); throw new Error('login failed') }
    checks.push('happy: login + /me role verified')
    const row = matrix.find(item => item.role === role)!
    stage = 'sidebar'
    const nav = page.getByRole('navigation', { name: 'Điều hướng chính' })
    await expect(nav).toBeVisible()
    expect(await nav.getByRole('link', { includeHidden: true }).evaluateAll(elements => elements.map(element => element.getAttribute('href')).sort())).toEqual(row.menu.map(menu => row.prefix + '/' + menu.key).sort())
    checks.push('happy: exact sidebar contract')
    for (const key of pages[role]) {
      stage = key
      await page.goto(row.prefix + '/' + key)
      await expect(page.locator('main h1').first()).toBeVisible()
      await expect(page.locator('main .state-panel[role="status"]')).toHaveCount(0, { timeout: 30_000 })
      await expect(page.locator('main .error-box')).toHaveCount(0)
      await expect(page.getByRole('heading', { name: /Page not found|Unable to open this page/ })).toHaveCount(0)
      checks.push('happy: page ' + key)
      for (const width of [1440, 768, 390, 360]) {
        await page.setViewportSize({ width, height: 900 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
        if (width < 768) {
          await page.getByRole('button', { name: 'Mở menu', exact: true }).click()
          await expect(nav).toBeVisible()
          await page.keyboard.press('Escape')
          await expect(page.getByRole('button', { name: 'Mở menu', exact: true })).toBeFocused()
        }
      }
      checks.push('happy: layout ' + key + ' 1440/768/390/360; mobile Escape/focus')
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    stage = 'F5 deep link'
    const path = row.prefix + '/' + pages[role][0] + '?e2e=retained#overview'
    await page.goto(path); await page.reload(); await expect(nav).toBeVisible(); await expect(page).toHaveURL(path)
    checks.push('happy: F5 retains exact deep link/query/hash')
    stage = 'wrong workspace'
    await page.goto(matrix.find(candidate => candidate.role !== role)!.prefix + '/dashboard')
    await expect(page).toHaveURL(row.prefix + '/dashboard')
    checks.push('unhappy: wrong workspace redirects without exposing another role')
    const denied = catalog.safe.find(endpoint => !endpoint.path.includes('{') && row.denied.includes(endpoint.operation))
    if (denied) {
      stage = 'server denial'
      const status = await page.evaluate(async path => {
        const { apiBaseUrl } = await import(/* @vite-ignore */ String('/src/constants/config.ts'))
        const session = JSON.parse(sessionStorage.getItem('brewforge.session.v1') || '{}')
        const response = await fetch(apiBaseUrl + path.replace(/^\/api\/v1/, ''), { headers: { Authorization: 'Bearer ' + session.accessToken } })
        return response.status
      }, denied.path)
      expect(status).toBe(403); await expect(nav).toBeVisible()
      checks.push('unhappy: safe denied API HTTP 403 retains session')
    }
    stage = 'logout'
    await logout(page); await page.goto(row.prefix + '/dashboard'); await expect(page).toHaveURL(/\/login$/)
    checks.push('happy: logout + F5 + protected guard')
    if (blocked.size) checks.push('BLOCKED: non-allowlisted reads/writes intercepted; dashboard coverage partial')
  } catch {
    failed = true; checks.push('FAIL at ' + stage + '; payload/identity omitted')
  } finally {
    await context.close()
    outcomes.push({ role, status: failed ? 'FAIL' : 'PASS_LIVE', checks })
    fs.mkdirSync('e2e-private', { recursive: true })
    fs.writeFileSync('e2e-private/experience-live.json', JSON.stringify(outcomes, null, 2))
  }
  if (failed) throw new Error(`${role}: sanitized failure at ${stage}; see e2e-private/experience-live.json`)
})
