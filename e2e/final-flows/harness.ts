import fs from 'node:fs'
import type { Browser, BrowserContext, Page } from '@playwright/test'
import type { Operation } from '../../src/services/backend/contracts.js'
import { loginAsRole } from '../helpers/auth.js'
import type { TestRole } from '../helpers/environment.js'
import catalog from '../fixtures/business-readiness.json' with { type: 'json' }

function observe(page: Page, role: string, file: string) {
  page.on('response', response => {
    const url = new URL(response.url()); if (!url.pathname.startsWith('/api/')) return
    const match = Object.entries(catalog.endpoints).find(([, endpoint]) => endpoint.method === response.request().method() && new RegExp('^' + endpoint.path.replace(/\{[^}]+\}/g, '[^/]+') + '$').test(url.pathname))
    if (!match) return
    const rows: Record<string, { roles: string[]; statuses: number[]; observations: number }> = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
    const row = rows[match[0]] ?? { roles: [], statuses: [], observations: 0 }
    if (!row.roles.includes(role)) row.roles.push(role)
    if (!row.statuses.includes(response.status())) row.statuses.push(response.status())
    row.observations++; rows[match[0]] = row
    fs.mkdirSync('e2e-private', { recursive: true }); fs.writeFileSync(file, JSON.stringify(rows, null, 2))
  })
}

export type CaseStatus = 'PASS_LIVE_UI' | 'PASS_LIVE_API' | 'PASS_ISOLATED' | 'FAIL' | 'BLOCKED' | 'NOT_RUN'
export type Manifest = { runId: string; ids: Record<string, number>; refs?: Record<string, string>; entities: { type: string; id: number | string; state: string; next: string }[]; cases: Record<string, { flow: string; role: string; kind: string; via: string; status: CaseStatus; assertion: string; evidence: string; blocker?: string; next?: string }>; safety?: Record<string, boolean> }
const file = 'e2e-private/final-flows-manifest.json'
export function manifest(): Manifest {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'))
  const checkpoint = JSON.parse(fs.readFileSync('e2e-private/experience-quality.json', 'utf8'))
  return { runId: checkpoint.runId, ids: checkpoint.ids, entities: [], cases: {} }
}
export function save(value: Manifest) { fs.mkdirSync('e2e-private', { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2)) }
export function entity(value: Manifest, type: string, id: number | string, state: string, next = '') {
  const index = value.entities.findIndex(item => item.type === type && item.id === id)
  const row = { type, id, state, next }; if (index < 0) value.entities.push(row); else value.entities[index] = row
  save(value)
}
export function record(value: Manifest, id: string, row: Manifest['cases'][string]) { value.cases[id] = row; save(value) }
export class Actors {
  contexts: BrowserContext[] = []
  private browser: Browser
  private baseURL: string
  private operationsFile: string
  constructor(browser: Browser, baseURL: string, operationsFile = 'e2e-private/final-flow-operations.json') { this.browser = browser; this.baseURL = baseURL; this.operationsFile = operationsFile }
  async login(role: TestRole) {
    const context = await this.browser.newContext({ baseURL: this.baseURL, viewport: { width: 1440, height: 1000 } }); this.contexts.push(context)
    const page = await context.newPage()
    observe(page, role, this.operationsFile)
    await page.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.pathname.startsWith('/api/') && !['http://localhost:5113', 'http://127.0.0.1:5113'].includes(url.origin)) return route.abort()
      return route.continue()
    })
    const result = await loginAsRole(page, role)
    if (!result.ok) throw new Error('Authentication prerequisite rejected; HTTP ' + (result.status ?? 0))
    const local = await page.evaluate(async () => { const { apiBaseUrl } = await import(/* @vite-ignore */ String('/src/constants/config.ts')); return ['http://localhost:5113/api/v1', 'http://127.0.0.1:5113/api/v1'].includes(apiBaseUrl) })
    if (!local) throw new Error('Destination did not match approved local test API')
    return page
  }
  async close() { for (const context of this.contexts) await context.close().catch(() => {}) }
  async loginGenerated(username: string, password: string) {
    const context = await this.browser.newContext({ baseURL: this.baseURL, viewport: { width: 1440, height: 1000 } }); this.contexts.push(context)
    const page = await context.newPage()
    observe(page, 'AUTHORIZED_TEST_TRAINEE', this.operationsFile)
    await page.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.pathname.startsWith('/api/') && !['http://localhost:5113', 'http://127.0.0.1:5113'].includes(url.origin)) return route.abort()
      return route.continue()
    })
    await page.goto('/login')
    for (const [id, secret] of [['username', username], ['password', password]]) await page.locator('#' + id).evaluate((element, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value)
      element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true }))
    }, secret)
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await page.waitForURL('**/barista/dashboard')
    return page
  }
}
export async function identity(page: Page) {
  // Read identity from the authenticated server, not an optionally stale HMR store import.
  const result = await api(page, 'Auth.Me')
  if (!result.ok || !Number.isSafeInteger(Number(result.data.id))) throw new Error('Cannot verify authenticated identity')
  return { id: Number(result.data.id), branchId: result.data.branchId ? Number(result.data.branchId) : null }
}
export async function api(page: Page, operation: Operation, params: Record<string, number | string> = {}, body?: unknown, query?: Record<string, unknown>) {
  return page.evaluate(async input => {
    // Full document navigation can finish before React/AuthBootstrap. Use the same
    // single-flight bootstrap as the application before issuing helper requests.
    const { bootstrapAuth } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    await bootstrapAuth()
    const { executeOperation } = await import(/* @vite-ignore */ String('/src/services/backend/operations.ts'))
    const { normalizeApiError } = await import(/* @vite-ignore */ String('/src/services/apiError.ts'))
    try { return { ok: true, status: 200, data: await executeOperation(input.operation, { params: input.params, body: input.body, query: input.query }) as Record<string, unknown>, rule: '' } }
    catch (error) { const e = normalizeApiError(error); return { ok: false, status: e.status || 0, data: {} as Record<string, unknown>, rule: String(e.rule || e.code || 'unspecified') } }
  }, { operation, params, body, query })
}
export async function ownCheckpoint(page: Page, m: Manifest) {
  const recipe = await api(page, 'Recipes.Get', { id: m.ids.recipe })
  const version = await api(page, 'RecipeVersions.Get', { id: m.ids.version })
  const course = await api(page, 'Courses.Get', { id: m.ids.course })
  if (!recipe.ok || recipe.data.recipeCode !== m.runId || version.data.recipeId !== m.ids.recipe || course.data.recipeVersionId !== m.ids.version || course.data.title !== m.runId + ' training') throw new Error('Run ownership/relationship validation failed')
  entity(m, 'recipe', m.ids.recipe, String(recipe.data.origin)); entity(m, 'version', m.ids.version, String(version.data.state)); entity(m, 'course', m.ids.course, String(course.data.state))
  return { recipe: recipe.data, version: version.data, course: course.data }
}
export async function upload(page: Page, operation: 'Enrollments.UploadPracticalVideo' | 'BranchAudits.UploadEvidence' | 'Sales.Import', params: Record<string, number | string>, path: string, idempotencyKey?: string) {
  const bytes = Array.from(fs.readFileSync(path)), name = path.split(/[\\/]/).at(-1)!
  return page.evaluate(async input => {
    const { bootstrapAuth } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    await bootstrapAuth()
    const { executeOperation } = await import(/* @vite-ignore */ String('/src/services/backend/operations.ts'))
    const { normalizeApiError } = await import(/* @vite-ignore */ String('/src/services/apiError.ts'))
    const body = new FormData(); body.append('file', new File([new Uint8Array(input.bytes)], input.name))
    try { return { ok: true, status: 200, data: await executeOperation(input.operation, { params: input.params, body, idempotencyKey: input.idempotencyKey }) as Record<string, unknown>, rule: '' } }
    catch (error) { const e = normalizeApiError(error); return { ok: false, status: e.status || 0, data: {} as Record<string, unknown>, rule: String(e.rule || e.code || 'unspecified') } }
  }, { operation, params, bytes, name, idempotencyKey })
}
