import fs from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'

type Evidence = { runId: string; caseId: string; role: string; routeTemplate: string; scope: 'PUBLIC_UI' | 'LIVE_UI' | 'ISOLATED_UI'; phase: 'before' | 'after' | 'retest'; assertion: string; result: 'REPRODUCED' | 'PASS' | 'FAIL' | 'NOT_CAPTURED'; masks?: string[] }
const safe = (value: string) => { if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid evidence identifier'); return value }

/** Minimal, redacted UI evidence. Never exports storage, identity, API payload or raw DOM. */
export async function captureEvidence(page: Page, input: Evidence) {
  const viewport = page.viewportSize(); if (!viewport) throw new Error('A fixed viewport is required for comparable evidence')
  const folder = path.join('ui-test-results', safe(input.runId), safe(input.caseId), safe(input.role) + '-' + viewport.width + 'x' + viewport.height)
  fs.mkdirSync(folder, { recursive: true })
  if (input.phase === 'before' && fs.existsSync(path.join(folder, 'before.png'))) throw new Error('Before evidence already exists; preserve original capture and select after/retest')
  await page.evaluate(async () => { await document.fonts.ready })
  await page.evaluate(async () => {
    const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    const user = store.getState().auth.user as { name?: string; username?: string; email?: string } | null
    const privateText = [user?.name, user?.username, user?.email].filter((value): value is string => !!value && value.length > 2 && !value.startsWith('TEST_ONLY'))
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode, el = node.parentElement
      if (el && !['SCRIPT', 'STYLE'].includes(el.tagName) && privateText.some(value => node.textContent?.includes(value))) el.setAttribute('data-evidence-mask', '')
    }
    const piiLabels = /^(Tên đăng nhập|Họ tên|Email|Nhân viên|Người học|Học viên|Giảng viên|Người tạo|Người thực hiện|Người cập nhật|Người kiểm định|Người đánh giá|Giảng viên đánh giá|Người cấp|Người chấm)$/i
    document.querySelectorAll('dt').forEach(dt => { if (piiLabels.test(dt.textContent?.trim() ?? '')) dt.nextElementSibling?.setAttribute('data-evidence-mask', '') })
    document.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('thead th').forEach((th, index) => {
        if (piiLabels.test(th.textContent?.trim() ?? '')) table.querySelectorAll('tbody tr').forEach(tr => tr.children[index]?.setAttribute('data-evidence-mask', ''))
      })
    })
  })
  try {
    const masks = ['[data-evidence-mask]', '[data-private-person]', '.person-name', 'input[type="password"]', 'input[autocomplete="username"]', 'input[type="email"]', 'input[name="email"]', 'input[name="fullName"]', '.user-chip strong', ...(input.masks ?? [])]
    await page.screenshot({ path: path.join(folder, input.phase + '.png'), fullPage: false, animations: 'disabled', caret: 'hide', mask: masks.map(selector => page.locator(selector)) })
    const metadataFile = path.join(folder, 'evidence.json')
    const prior = fs.existsSync(metadataFile) ? JSON.parse(fs.readFileSync(metadataFile, 'utf8')) : {}
    const screenshot = input.phase + '.png'
    fs.writeFileSync(metadataFile, JSON.stringify({ runId: input.runId, caseId: input.caseId, role: input.role, routeTemplate: input.routeTemplate, viewport, scope: input.scope, screenshotPolicy: 'viewport; fonts-ready; animations-disabled; identity/PII masked; no storage/trace/HAR', phases: { ...(prior.phases ?? {}), [input.phase]: { screenshot, result: input.result, assertion: input.assertion } }, ...(input.phase === 'after' && input.result === 'PASS' ? { afterAlsoRetest: true } : {}) }, null, 2))
  } finally { await page.locator('[data-evidence-mask]').evaluateAll(elements => elements.forEach(el => el.removeAttribute('data-evidence-mask'))) }
  return path.join(folder, input.phase + '.png')
}
