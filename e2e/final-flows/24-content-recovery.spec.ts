import { test,expect } from '@playwright/test'
import { Actors } from './harness.js'
for(const fault of ['field400','duplicate409','network'] as const)test('OPS isolated mutation '+fault+' retains draft without replay',async({browser},info)=>{
 const actors=new Actors(browser,String(info.project.use.baseURL),'e2e-private/ops-operations.json')
 try {const page=await actors.login('ADMIN');let calls=0
 await page.route('**/api/v1/ingredients',r=>{if(r.request().method()!=='POST')return r.continue();calls++;return fault==='network'?r.abort():r.fulfill({status:fault==='field400'?400:409,json:{code:fault==='field400'?'VALIDATION_FAILED':'CONFLICT',rule:fault==='duplicate409'?'UNIQUE':null,message:'TEST_ONLY raw payload SQL',details:[{field:'ingredientCode',issue:fault==='duplicate409'?'must be unique':'is required'}]}})})
 await page.goto('/admin/ingredients');await page.getByRole('button',{name:'Thêm mới',exact:true}).click();await page.locator('#ingredientCode').fill('OPS_RECOVERY_ONLY');await page.locator('#name').fill('TEST_ONLY retained without BE write');await page.locator('#unit').selectOption('g');await page.locator('#shelfLifeHours').fill('24');await page.getByRole('dialog').locator('button[type=submit]').click()
 await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible();await expect(page.locator('#name')).toHaveValue('TEST_ONLY retained without BE write');expect(calls).toBe(1);expect(await page.getByRole('dialog').innerText()).not.toMatch(/SQL|payload/)
 if(fault==='network')await expect(page.getByRole('dialog')).toContainText('Chưa xác nhận được kết quả');else {await expect(page.locator('#ingredientCode')).toBeFocused();await expect(page.locator('#ingredientCode')).toHaveAttribute('aria-invalid','true')}
 page.once('dialog',d=>d.dismiss());await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeVisible()
 page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'Thêm mới',exact:true})).toBeFocused()
 }finally{await actors.close()}
})
test('OPS nested validation points to the second step ingredient row',async({browser},info)=>{
 const actors=new Actors(browser,String(info.project.use.baseURL),'e2e-private/ops-operations.json')
 try{const page=await actors.login('RD_SPECIALIST');let writes=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/v1/recipes'))writes++})
 await page.goto('/rd-specialist/recipes');await page.getByRole('button',{name:'Nhập công thức hiện có',exact:true}).click()
 await page.getByRole('button',{name:'Thêm các bước thực hiện',exact:true}).click();await page.getByRole('button',{name:'Thêm các bước thực hiện',exact:true}).click()
 await page.locator('[data-field="steps[1].ingredients"]').getByRole('button',{name:'Thêm nguyên liệu',exact:true}).click()
 await page.locator('[id="steps[1].actionText"]').fill('TEST_ONLY second step draft')
 await page.getByRole('dialog').locator('button[type=submit]').click()
 const summary=page.getByRole('region',{name:'Cần kiểm tra trước khi gửi'});await expect(summary).toBeFocused()
 await summary.getByRole('button',{name:'Các bước thực hiện 2 · Nguyên liệu 1 · Định lượng: Nhập định lượng.',exact:true}).click()
 await expect(page.locator('[id="steps[1].ingredients[0].quantity"]')).toBeFocused();await expect(page.locator('[id="steps[1].actionText"]')).toHaveValue('TEST_ONLY second step draft');expect(writes).toBe(0)
 }finally{await actors.close()}
})
test('OPS sales offers an exact blank CSV template without a business write',async({browser},info)=>{
 const actors=new Actors(browser,String(info.project.use.baseURL),'e2e-private/ops-operations.json')
 try {const page=await actors.login('BRANCH_MANAGER');await page.goto('/store-manager/sales');await page.getByRole('button',{name:'Nhập CSV / XLSX',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Tải tệp mẫu CSV',exact:true}).click();const download=await pending;expect(download.suggestedFilename()).toBe('BrewForge-mau-doanh-so.csv');const stream=await download.createReadStream();const chunks:Buffer[]=[];for await(const chunk of stream)chunks.push(Buffer.from(chunk));expect(Buffer.concat(chunks).toString()).toBe('branch_code,drink_code,trading_date,quantity\r\n')
 }finally{await actors.close()}
})
