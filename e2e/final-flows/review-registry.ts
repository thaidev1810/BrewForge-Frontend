import fs from 'node:fs'
export type ReviewStatus = 'PASS_LIVE_UI' | 'PASS_LIVE_API' | 'PASS_ISOLATED' | 'FAIL' | 'BLOCKED_DATA' | 'BLOCKED_ENV' | 'BLOCKED_TIME' | 'BLOCKED_BE' | 'NOT_RUN'
type Row = { module: string; role: string; flow: string; kind: string; prerequisites: string; via: string; assertion: string; status: ReviewStatus; evidence: string; blocker?: string }
export const reviewFile = 'e2e-private/product-review.json'
export function review() {
  if (fs.existsSync(reviewFile)) return JSON.parse(fs.readFileSync(reviewFile, 'utf8')) as { runId: string; ids: Record<string, number>; cases: Record<string, Row> }
  return { runId: 'E2E_REVIEW_' + Date.now().toString(36).toUpperCase(), ids: {} as Record<string, number>, cases: {} as Record<string, Row> }
}
export function checkpoint(value: ReturnType<typeof review>) {
  const latest = review()
  fs.mkdirSync('e2e-private', { recursive: true })
  fs.writeFileSync(reviewFile, JSON.stringify({ ...latest, runId: value.runId, ids: { ...latest.ids, ...value.ids } }, null, 2))
}
export function reviewed(id: string, row: Row) { const state = review(); state.cases[id] = row; fs.mkdirSync('e2e-private', { recursive: true }); fs.writeFileSync(reviewFile, JSON.stringify(state, null, 2)) }
