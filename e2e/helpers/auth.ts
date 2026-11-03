import { expect, type Page } from '@playwright/test'
import { getTestCredentials, type TestRole } from './environment.js'
import matrix from '../fixtures/permission-matrix.json' with { type: 'json' }
export { getTestCredentials } from './environment.js'
export type LoginResult = { ok: true; role: TestRole } | { ok: false; category: string; reason: string; status?: number }
export async function loginAsRole(page: Page, role: TestRole): Promise<LoginResult> {
  let credentials: ReturnType<typeof getTestCredentials>
  try { credentials = getTestCredentials(role) } catch (error) { return { ok: false, category: 'Environment issue', reason: (error as Error).message } }
  let loginStatus: number | undefined, meRole: string | undefined, payloadMatches = false, validToken = false
  let responseCode: string | undefined
  let networkFailure = false
  page.on('requestfailed', request => { if (new URL(request.url()).pathname.endsWith('/auth/login')) networkFailure = true })
  const listener = async (response: import('@playwright/test').Response) => {
    const path = new URL(response.url()).pathname
    try {
      if (path.endsWith('/auth/login') && response.request().method() === 'POST') {
        loginStatus = response.status()
        const body = response.request().postDataJSON()
        payloadMatches = body?.username === credentials.username && body?.password === credentials.password && !('email' in body)
        const data = await response.json().catch(() => ({}))
        validToken = typeof data.accessToken === 'string' && data.accessToken.split('.').length === 3
        // Only allowlisted error codes leave memory. Never retain server text or JWT.
        if (['INVALID_CREDENTIALS', 'ACCOUNT_LOCKED', 'ACCOUNT_DISABLED'].includes(data.code)) responseCode = data.code
      }
      if (path.endsWith('/auth/me') && response.ok()) {
        const me = await response.json(); meRole = me.role
      }
    } catch { /* No response payload logging. */ }
  }
  page.on('response', listener)
  try {
    await page.goto('/login')
    // evaluate avoids fill/type values in Playwright action logs; tracing is OFF during login.
    for (const [id, value] of [['username', credentials.username], ['password', credentials.password]]) {
      await page.locator('input#' + id).evaluate((element, secret) => {
        const input = element as HTMLInputElement
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, secret)
        input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }))
      }, value)
    }
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    const row = matrix.find(item => item.role === role)!
    await page.waitForURL(url => url.pathname === row.prefix + '/dashboard', { timeout: 25_000 })
    if (!payloadMatches) return { ok: false, category: 'API Integration mismatch', reason: 'Login payload does not match username/password contract.' }
    await expect.poll(() => !!meRole && validToken, { timeout: 5000 }).toBe(true)
    if (!validToken || meRole !== role) return { ok: false, category: 'API Integration mismatch', reason: 'JWT structure valid=' + validToken + '; expected role matched=' + (meRole === role) + '; identity response observed=' + !!meRole + '.' }
    return { ok: true, role }
  } catch {
    if (loginStatus === 401) return { ok: false, category: 'Invalid test credentials', reason: responseCode || 'Login returned HTTP 401; credential rejection requires backend confirmation.', status: loginStatus }
    if (loginStatus && loginStatus >= 500) return { ok: false, category: 'BE authentication issue', reason: 'Login returned a server error.', status: loginStatus }
    if (loginStatus && loginStatus >= 400) return { ok: false, category: 'API Integration mismatch', reason: 'Login request rejected.', status: loginStatus }
    return { ok: false, category: loginStatus === 200 ? 'FE bug' : 'Environment issue', reason: loginStatus === 200 ? 'Login succeeded but authenticated redirect did not complete.' : (networkFailure ? 'Login network request failed; check API origin/CORS/TLS.' : 'No login response observed; verify form submission and API mapping.'), status: loginStatus }
  } finally {
    page.off('response', listener)
    // Erase form before any failure artifact; never export auth storage.
    await page.locator('input#username, input#password').evaluateAll(inputs => inputs.forEach(element => {
      const input = element as HTMLInputElement; input.value = ''; input.setAttribute('value', '')
    })).catch(() => {})
  }
}
export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await page.waitForURL(/\/login$/)
  await page.reload()
  if (!await page.evaluate(() => sessionStorage.getItem('brewforge.session.v1') === null)) throw new Error('FE bug: session persists after logout.')
}




