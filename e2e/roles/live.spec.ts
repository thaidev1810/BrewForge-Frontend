import { test, expect } from '@playwright/test'
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs'
import { zipSync, unzipSync, strFromU8, strToU8 } from 'fflate'
import { loginAsRole, logout } from '../helpers/auth.js'
import { roles } from '../helpers/environment.js'
import matrix from '../fixtures/permission-matrix.json' with { type: 'json' }

const results: { role: string; login: string; dashboard: string; sidebar: string; permission: string; logout: string; category?: string; reason?: string; artifacts: string[] }[] = []
const pages: Record<string, string[]> = {
  ADMIN: ['users', 'products'], RD_SPECIALIST: ['recipes', 'products'], RD_MANAGER: ['courses', 'courses/pending', 'recipes'],
  TRAINER: ['courses', 'assignments'], TRAINING_MANAGER: ['learning-path', 'assignments', 'courses'],
  TRAINEE: ['learning-path', 'learning'], BRANCH_MANAGER: ['branches', 'training-progress', 'branch-audits'],
  QUALITY_AUDITOR: ['branch-audits', 'corrective-actions', 'compliance'],
}
function saveReport() {
  const summary = 'test-results/auth-summary.json'
  const prior = existsSync(summary) ? JSON.parse(readFileSync(summary, 'utf8')) as typeof results : []
  for (const row of prior) if (!results.some(item => item.role === row.role)) results.push(row)
  results.sort((a, b) => roles.indexOf(a.role as typeof roles[number]) - roles.indexOf(b.role as typeof roles[number]))
  mkdirSync('test-results', { recursive: true }); writeFileSync(summary, JSON.stringify(results))
  mkdirSync('docs', { recursive: true })
  const passed = results.filter(row => [row.login,row.dashboard,row.sidebar,row.permission,row.logout].every(value => value === 'PASS')).length
  const lines = ['# BrewForge live authentication E2E', '', `Executed roles: ${results.length}/8. PASS: ${passed}. FAIL: ${results.length - passed}.`, '', '| Role | Login | Dashboard | Sidebar | Permission | Logout |', '| ---- | ----- | --------- | ------- | ---------- | ------ |', ...results.map(row => `| ${row.role} | ${row.login} | ${row.dashboard} | ${row.sidebar} | ${row.permission} | ${row.logout} |`), '', '## Findings', '- RD_MANAGER dashboard is deliberately PARTIAL because pilot reads may change server state. This is a coverage limitation, not evidence of an authentication defect.', ...results.filter(row => row.category).map(row => `- ${row.role}: ${row.category}: ${row.reason}`), '', '## Categories', ...['FE bug','BE authentication issue','API Integration mismatch','Invalid test credentials','Environment issue'].map(category => `- ${category}: ${results.filter(row => row.category === category).length} observed classifications.`), '', '## Artifacts', ...results.flatMap(row => row.artifacts.map(path => `- ${row.role}: ${path}`)), '', '## Scope and limitations', '- Chromium headed, one worker, no retry, real authentication only. No business create/update/delete/approve/release requests are permitted.', '- Permission checks cover sidebar contract, selected permitted pages, cross-role guards, RD_MANAGER approval-route denial and one safe API GET denial per role. No mutation permission requests are sent.', '- Detail pages needing real IDs, audit evidence downloads, readiness flows that trigger state-changing reads, and business mutations are not covered.', '- If login fails, dashboard/sidebar/permissions/logout are NOT RUN rather than PASS.', '- HTTP 401 is classified as credential rejection, not proof that the supplied password is incorrect. Backend logs/account status may be required.', '- Failure screenshots mask the full page; traces omit DOM, screenshots, sources, network, console and resource payloads. Raw traces are deleted. Artifacts are ignored by Git.', '- Login form: input#username (label Tên đăng nhập), input#password (label Mật khẩu), button Đăng nhập. Zod requires trimmed nonempty username and nonempty password; role=alert displays errors. POST username/password -> /auth/login, then /auth/me supplies active role; redirect uses role workspace dashboard.', '- .env.e2e.local is explicitly ignored; credentials are loaded using Node process.loadEnvFile without modifying application env files. No EMAIL fallback, no stored auth-state export.', '']
  writeFileSync('docs/e2e-auth-report.md', lines.join('\n'))
}
for (const role of roles) {
  test(`${role}: real authentication and read-only permissions`, async ({ page, context }, testInfo) => {
    test.setTimeout(120_000)
    const row = matrix.find(item => item.role === role)!
    const result = { role, login: 'NOT RUN', dashboard: 'NOT RUN', sidebar: 'NOT RUN', permission: 'NOT RUN', logout: 'NOT RUN', category: undefined as string | undefined, reason: undefined as string | undefined, artifacts: [] as string[] }
    results.push(result)
    let traced = false
    const blocked: string[] = []
    // Safety gate: never execute a business write, including an accidental UI effect.
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (url.pathname.includes('/api/') && !['GET','HEAD','OPTIONS'].includes(request.method()) && !/\/auth\/(login|refresh|logout)$/.test(url.pathname)) {
        blocked.push('Business write blocked'); await route.abort(); return
      }
      // Pilot listing is documented as potentially state-changing. Abort rather than mutate.
      if (url.pathname.includes('/api/') && /\/pilots(?:\?|$)/.test(url.pathname)) { await route.abort(); return }
      await route.continue()
    })
    try {
      const login = await loginAsRole(page, role)
      result.login = login.ok ? 'PASS' : 'FAIL'
      if (!login.ok) { result.category = login.category; result.reason = login.reason + (login.status ? ` HTTP ${login.status}.` : ''); throw new Error('Sanitized login failure: ' + login.category) }
      await context.tracing.start({ screenshots: false, snapshots: false, sources: false }); traced = true
      await expect(page.locator('main h1').first()).toBeVisible()
      await expect(page).toHaveURL(row.prefix + '/dashboard')
      // RD_MANAGER dashboard currently reads Pilots.List, blocked above to preserve business state.
      if (role !== 'RD_MANAGER') {
        await expect(page.locator('.state-panel[role="status"]')).toHaveCount(0, { timeout: 30_000 })
        await expect(page.locator('main [role="alert"], main .error-box')).toHaveCount(0)
        result.dashboard = 'PASS'
      } else result.dashboard = 'PARTIAL (pilot read blocked)'
      const nav = page.getByRole('navigation', { name: 'Điều hướng chính' })
      await expect(nav).toBeVisible()
      const links = await nav.getByRole('link', { includeHidden: true }).evaluateAll(elements => elements.map(element => element.getAttribute('href')).sort())
      expect(links).toEqual(row.menu.map(menu => row.prefix + '/' + menu.key).sort())
      result.sidebar = 'PASS'
      for (const key of pages[role]) {
        await page.goto(row.prefix + '/' + key)
        await expect(nav).toBeVisible()
        await expect(page.locator('main h1').first()).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toHaveCount(0)
        await expect(page.locator('.state-panel[role="status"]')).toHaveCount(0, { timeout: 30_000 })
        await expect(page.locator('main [role="alert"], main .error-box')).toHaveCount(0)
      }
      if (role === 'TRAINING_MANAGER') { await page.goto(row.prefix + '/courses/pending'); await expect(page).toHaveURL(row.prefix + '/dashboard') }
      const other = matrix.find(item => item.role !== role)!
      await page.goto(other.prefix + '/dashboard'); await expect(page).toHaveURL(row.prefix + '/dashboard')
      // Safe denied GET chosen from the checked-in method/path permission matrix.
      const denied = matrix.flatMap(item => item.allowed).find(operation => operation.method === 'GET' && row.denied.includes(operation.operation) && !operation.path.includes('{') && !/pilots|content|download|evidence/.test(operation.path))
      if (!denied) throw new Error('No safe denied API GET available in contract.')
      const denial = await page.evaluate(async path => {
        const raw = sessionStorage.getItem('brewforge.session.v1')
        if (!raw) return 0
        const token = JSON.parse(raw).accessToken
        const base = (await import(/* @vite-ignore */ String('/src/constants/config.ts'))).apiBaseUrl
        try { return (await fetch(base + path.replace(/^\/api\/v1/, ''), { headers: { Authorization: 'Bearer ' + token } })).status } catch { return 0 }
      }, denied.path)
      expect(denial, 'Contract denied GET must return HTTP 403').toBe(403)
      expect(blocked.length, 'No business writes').toBe(0)
      result.permission = 'PASS'
    } catch {
      result.category ??= 'API Integration mismatch'
      result.reason ??= 'A read-only dashboard/menu/permission assertion failed; no server payload retained.'
      if (result.login === 'PASS') {
        if (result.dashboard === 'NOT RUN') result.dashboard = 'FAIL'
        else if (result.sidebar === 'NOT RUN') result.sidebar = 'FAIL'
        else if (result.permission === 'NOT RUN') result.permission = 'FAIL'
      }
    } finally {
      if (result.login === 'PASS') {
        try { await logout(page); await page.goto(row.prefix + '/dashboard'); await expect(page).toHaveURL(/\/login$/); result.logout = 'PASS' }
        catch { result.logout = 'FAIL'; result.category ??= 'FE bug'; result.reason ??= 'Logout/reload session guard failed.' }
      }
      const failed = [result.login,result.dashboard,result.sidebar,result.permission,result.logout].some(value => value !== 'PASS')
      if (failed) {
        const screenshot = testInfo.outputPath('failure-masked.png')
        await page.screenshot({ path: screenshot, mask: [page.locator('html')], maskColor: '#4B3028' }).catch(() => {})
        result.artifacts.push(screenshot.replaceAll('\\','/'))
        if (!traced) { await context.tracing.start({ screenshots: false, snapshots: false, sources: false }); traced = true; await page.waitForTimeout(100) }
      }
      if (traced) {
        const raw = testInfo.outputPath('private-raw.zip')
        await context.tracing.stop({ path: raw })
        try {
          if (failed) {
            const files = unzipSync(readFileSync(raw)), clean: Record<string, Uint8Array> = {}
            for (const [name, data] of Object.entries(files)) {
              if (!name.endsWith('.trace')) continue
              const events = strFromU8(data).split('\n').filter(Boolean).map(line => JSON.parse(line) as Record<string, unknown>)
              // Keep only minimal timing/action metadata; never preserve action arguments/results/logs.
              const safe = events.filter(event => ['context-options','before','after'].includes(String(event.type))).map(event => {
                if (event.type === 'context-options') return { ...event, options: {}, origin: 'library' }
                return Object.fromEntries(['type','callId','startTime','endTime','apiName','class','method','parentId'].filter(key => key in event).map(key => [key, event[key]]))
              })
              clean[name] = strToU8(safe.map(event => JSON.stringify(event)).join('\n') + '\n')
            }
            const path = testInfo.outputPath('trace-sanitized.zip'); writeFileSync(path, zipSync(clean)); result.artifacts.push(path.replaceAll('\\','/'))
          }
        } finally { unlinkSync(raw) }
      }
      saveReport()
    }
    expect([result.login,result.dashboard,result.sidebar,result.permission,result.logout].every(value => value === 'PASS'), 'See sanitized docs/e2e-auth-report.md').toBe(true)
  })
}



