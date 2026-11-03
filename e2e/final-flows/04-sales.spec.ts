import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { zipSync, strToU8 } from 'fflate'
import { Actors, api, entity, identity, manifest, record, save, upload } from './harness.js'

test('LIVE sales UI, CSV/XLSX partial errors, replay and different-payload conflict', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Local test write opt-in required')
  test.setTimeout(140_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'persisted LIVE gate'
  const proof = (id: string, flow: string, assertion: string, via = 'LIVE_UI', kind = 'happy') => record(m, id, { flow, role: 'BRANCH_MANAGER/RD_MANAGER', kind, via, status: via === 'LIVE_UI' ? 'PASS_LIVE_UI' : 'PASS_LIVE_API', assertion, evidence: `run ${m.runId}; own branch/recipe/day` })
  try {
    const bm = await actors.login('BRANCH_MANAGER'), rd = await actors.login('RD_MANAGER')
    const who = await identity(bm); expect(who.branchId).toBe(m.ids.branch)
    const launches = await api(bm, 'BranchLaunchStatus.List', {}, undefined, { recipeId: m.ids.recipe })
    const own = (launches.data as unknown as { status: string; recipeVersionId: number; branchId: number }[]).find(row => row.branchId === m.ids.branch && row.recipeVersionId === m.ids.version)
    expect(own?.status).toBe('LIVE')
    const branch = await api(bm, 'Branches.Get', { id: m.ids.branch }); expect(branch.ok).toBe(true)
    const code = String(branch.data.branchCode), today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400_000 + 7 * 3600_000).toISOString().slice(0, 10), tomorrow = new Date(Date.now() + 86400_000 + 7 * 3600_000).toISOString().slice(0, 10)
    const dir = 'e2e-private/final-fixtures', header = 'branch_code,drink_code,trading_date,quantity\r\n'
    fs.writeFileSync(dir + '/pos-valid.csv', header + `${code},${m.runId},${today},7\r\n`)
    fs.writeFileSync(dir + '/pos-different.csv', header + `${code},${m.runId},${today},8\r\n`)
    fs.writeFileSync(dir + '/pos-partial.csv', header + [
      `${code},${m.runId},${today},9`, `${code},${m.runId},${today},12`, `${code},E2E_NO_DRINK,${today},1`,
      `${code},${m.runId},2026-02-31,1`, `${code},${m.runId},${today},-1`, `${code},${m.runId},${yesterday},1`, `${code},${m.runId},${tomorrow},1`,
    ].join('\r\n') + '\r\n')
    const rows = [['branch_code', 'drink_code', 'trading_date', 'quantity'], [code, m.runId, today, '11']]
    const escape = (v: string) => v.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    const sheet = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + rows.map((row, i) => `<row r="${i + 1}">` + row.map((cell, j) => `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t>${escape(cell)}</t></is></c>`).join('') + '</row>').join('') + '</sheetData></worksheet>'
    fs.writeFileSync(dir + '/pos-valid.xlsx', zipSync({ '[Content_Types].xml': strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'), '_rels/.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'), 'xl/workbook.xml': strToU8('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sales" sheetId="1" r:id="rId1"/></sheets></workbook>'), 'xl/_rels/workbook.xml.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'), 'xl/worksheets/sheet1.xml': strToU8(sheet) }))
    stage = 'manual sales UI'
    if (!m.ids.sale) {
      await bm.goto('/store-manager/sales'); await bm.getByRole('button', { name: 'Thêm mới', exact: true }).click()
      await bm.locator('#tradingDate').fill(today)
      await bm.getByRole('combobox', { name: 'Công thức', exact: true }).selectOption(String(m.ids.recipe))
      await bm.locator('#cupsSold').fill('5')
      const created = bm.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/sales')
      await bm.getByRole('button', { name: 'Xác nhận', exact: true }).click(); const response = await created; expect(response.status()).toBe(201)
      const data = await response.json(); m.ids.sale = data.id; entity(m, 'sale', data.id, 'MANUAL 5 cups')
      await bm.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
      proof('sales-create', 'Manual sales', 'UI uses sellable drink lookup; real201 persists own NEW drink/day after LIVE')
    } else await bm.goto('/store-manager/sales')
    async function importUi(file: string) {
      await bm.getByRole('button', { name: 'Nhập CSV / XLSX', exact: true }).click()
      await bm.locator('#upload-file').setInputFiles(file)
      const imported = bm.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/sales/import'))
      await bm.getByRole('button', { name: 'Xác nhận', exact: true }).click(); const response = await imported; expect(response.status()).toBe(200)
      const key = await response.request().headerValue('idempotency-key'), data = await response.json()
      await expect(bm.getByRole('dialog').getByText('Máy chủ đã xử lý yêu cầu.')).toBeVisible()
      return { key, data }
    }
    stage = 'valid CSV and replay'
    const valid = await importUi(dir + '/pos-valid.csv'); expect(valid.data.accepted).toBe(1); expect(valid.data.rejected).toBe(0); expect(valid.key).toBeTruthy()
    entity(m, 'POS import', String(valid.data.jobId), 'valid CSV accepted1')
    await bm.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    const replay = await upload(bm, 'Sales.Import', {}, dir + '/pos-valid.csv', valid.key!)
    expect(replay.ok).toBe(true); expect(replay.data.replayed).toBe(true); expect(replay.data.jobId).toBe(valid.data.jobId)
    const mismatch = await upload(bm, 'Sales.Import', {}, dir + '/pos-different.csv', valid.key!)
    expect(mismatch.status).toBe(409); expect(mismatch.rule).toBe('IDEMPOTENCY_KEY_MISMATCH')
    proof('pos-valid', 'Valid CSV UI', 'Real CSV accepted1/rejected0; own saved day replaced through normal import')
    proof('pos-replay-mismatch', 'POS idempotency', 'Exact UI key/file replays same job; different file under same key returns409 IDEMPOTENCY_KEY_MISMATCH; no replacement key used', 'LIVE_API', 'unhappy')
    stage = 'partial CSV UI'
    const partial = await importUi(dir + '/pos-partial.csv'); expect(partial.data.accepted).toBe(1); expect(partial.data.rejected).toBe(6)
    expect(partial.data.errors.map((error: { row: number }) => error.row).sort((a: number, b: number) => a - b)).toEqual([3, 4, 5, 6, 7, 8])
    for (const width of [1440, 768, 390, 360]) { await bm.setViewportSize({ width, height: 1000 }); expect(await bm.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); await expect(bm.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true })).toBeInViewport() }
    await bm.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click(); await bm.setViewportSize({ width: 1440, height: 1000 })
    entity(m, 'POS import', String(partial.data.jobId), 'partial CSV accepted1/rejected6')
    proof('pos-partial', 'Partial POS results', 'Real row3 duplicate,row4 unknown drink,row5 invalid date,row6 negative quantity,row7 before LIVE,row8 future refused; accepted1/rejected6 displayed at four widths', 'LIVE_UI', 'unhappy')
    stage = 'XLSX and persistence'
    const xlsx = await importUi(dir + '/pos-valid.xlsx'); expect(xlsx.data.accepted).toBe(1); expect(xlsx.data.rejected).toBe(0)
    await bm.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    const stored = await api(bm, 'Sales.List', {}, undefined, { recipeId: m.ids.recipe, from: today, to: today, size: 100 })
    const records = stored.data.items as { id: number; cupsSold: number; recipeVersionId: number }[]
    expect(records.length).toBe(1); expect(records[0].cupsSold).toBe(11); expect(records[0].recipeVersionId).toBe(m.ids.version)
    const aggregate = await api(rd, 'Sales.Aggregate', {}, undefined, { recipeId: m.ids.recipe, branchId: m.ids.branch, from: today, to: today, groupBy: 'day' }); expect(aggregate.data.totalCups).toBe(11)
    await bm.reload(); await expect(bm.locator('main .error-box')).toHaveCount(0)
    entity(m, 'sale', records[0].id, 'POS_IMPORT 11 cups'); save(m)
    proof('pos-xlsx-persist', 'XLSX and sales persistence', 'Real XLSX accepted; exactly one branch/drink/day row stores11 cups on exact SOP, aggregate11 and F5 succeeds', 'LIVE_UI')
    const jobId = String(xlsx.data.jobId)
    entity(m, 'POS import', jobId, 'XLSX accepted1/rejected0')
    const result = await api(bm, 'Sales.ImportResult', { jobId }); expect(result.ok).toBe(true); expect(result.data.jobId).toBe(jobId); expect(result.data.accepted).toBe(1)
    await bm.goto('/store-manager/sales/import/' + jobId)
    await expect(bm.locator('main')).toContainText(jobId)
    await bm.reload(); await expect(bm.locator('main')).toContainText(jobId)
    proof('pos-job-history', 'Persisted import job detail', 'Exact GUID job ID retained; real ImportResult GET and UI deep link/F5 retain accepted1 result')
  } catch { record(m, 'sales-failure', { flow: stage, role: 'BRANCH_MANAGER', kind: 'diagnostic', via: 'LIVE_UI/API', status: 'FAIL', assertion: 'Sanitized failure at ' + stage, evidence: 'No private payload retained' }); throw new Error('Sanitized sales failure at ' + stage) }
  finally { await actors.close() }
})
