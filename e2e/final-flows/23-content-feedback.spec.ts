import { test, expect, type Page } from '@playwright/test'
import process from 'node:process'
import fs from 'node:fs'
import { Actors } from './harness.js'
import { captureEvidence } from '../helpers/evidence.js'
const before=process.env.OPS_PHASE==='before'
async function shots(page:Page, caseId:string, scope:'ISOLATED_UI'|'LIVE_UI', role='ADMIN', routeTemplate='/admin/ingredients') {
  for(const width of [1440,768,390,360]) { await page.setViewportSize({width,height:900}); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true); await captureEvidence(page,{runId:'OPS_20261106',caseId,role,routeTemplate,scope,phase:before?'before':'after',result:before?'REPRODUCED':'PASS',assertion:'Contextual field errors/recovery and result composition; fault cases never prove backend behavior'}) }
}
test('OPS content local required errors name the field and preserve draft',async({browser},info)=>{
  const actors=new Actors(browser,String(info.project.use.baseURL),'e2e-private/ops-operations.json')
  try { const page=await actors.login('ADMIN'); await page.goto('/admin/ingredients'); await page.getByRole('button',{name:'Thêm mới',exact:true}).click(); await page.locator('#name').fill('OPS261106 retained draft'); await page.getByRole('dialog').locator('button[type=submit]').click(); await expect(page.locator('[aria-invalid=true]').first()).toBeVisible();
    if(!before) { await expect(page.locator('#ingredientCode-error-0')).toHaveText('Nhập mã nguyên liệu.'); await expect(page.getByRole('region',{name:'Cần kiểm tra trước khi gửi'})).toBeFocused(); await expect(page.locator('#name')).toHaveValue('OPS261106 retained draft') }
    await shots(page,'FIELD-FEEDBACK','LIVE_UI')
  } finally { await actors.close() }
})
test('OPS content isolated server fault hides raw exception and supports recovery',async({browser},info)=>{
  const actors=new Actors(browser,String(info.project.use.baseURL),'e2e-private/ops-operations.json')
  try { const page=await actors.login('ADMIN'); await page.route('**/api/v1/ingredients?*',r=>r.fulfill({status:500,json:{message:'TEST_ONLY SQL server exception payload schema API',code:'UNMAPPED_TEST_ONLY',traceId:'TEST_ONLY_TRACE',details:[]}})); await page.goto('/admin/ingredients'); await expect(page.getByRole('alert').first()).toBeVisible();
    if(!before) { expect(await page.locator('main').innerText()).not.toMatch(/SQL|payload|schema|UNMAPPED_TEST_ONLY/); await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeVisible() }
    await shots(page,'UNKNOWN-ERROR','ISOLATED_UI')
  } finally { await actors.close() }
})
test('OPS content actual persisted POS partial result is readable without protocol terms',async({browser},info)=>{
  const actors=new Actors(browser,String(info.project.use.baseURL),'e2e-private/ops-operations.json')
  try { const old=JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json','utf8')); const job=[...old.entities].reverse().find(r=>r.type==='POS import'&&typeof r.id==='string'&&r.state.includes('partial CSV')); if(!job)throw Error('Owned partial checkpoint unavailable'); const page=await actors.login('BRANCH_MANAGER'); await page.goto('/store-manager/sales/import/'+job.id); await expect(page.locator('main')).toContainText('6'); if(!before)await expect(page.locator('main')).not.toContainText(/Idempotency|payload|backend|replay|API/); await shots(page,'POS-RECEIPT','LIVE_UI','BRANCH_MANAGER','/store-manager/sales/import/:jobId')
  } finally { await actors.close() }
})
