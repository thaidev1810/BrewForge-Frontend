import { test, expect, type Page } from '@playwright/test'
import process from 'node:process'
import type { InternalAxiosRequestConfig } from 'axios'
import { captureEvidence } from '../helpers/evidence.js'
const before = process.env.OPS_PHASE === 'before'
const runId = 'OPS_20261106'
async function capture(page: Page, caseId: string, routeTemplate: string, role='TRAINER') {
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await captureEvidence(page, { runId, caseId, routeTemplate, role, scope: 'ISOLATED_UI', phase: before ? 'before' : 'after', result: before ? 'REPRODUCED' : 'PASS', assertion: 'Task language, meaningful next step and responsive composition; isolated synthetic transport, no backend proof' })
  }
}
async function receipt(page:Page,caseId:string,routeTemplate:string){
 for(const width of [1440,768,390,360]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await captureEvidence(page,{runId,caseId,routeTemplate,role:'TRAINER',scope:'ISOLATED_UI',phase:'retest',result:'PASS',assertion:'Verified synthetic result from controlled adapter after one submit; no live backend claim; form before/after supplied separately'})}
}
async function setup(page: Page, route: string, eligible = false) {
  await page.route('**/api/**', r => r.abort()); await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/login'); await page.locator('#username').waitFor()
  await page.evaluate(async eligible => {
    const { store } = await import(/* @vite-ignore */ String('/src/app/store.ts'))
    const auth = await import(/* @vite-ignore */ String('/src/features/auth/authSlice.ts'))
    const { apiClient } = await import(/* @vite-ignore */ String('/src/services/apiClient.ts'))
    const course = (id: number, status: string) => ({ courseId: id, title: 'TEST_ONLY Quy trình phục vụ đồ uống và kiểm soát chất lượng tại quầy ' + id, status, enrollmentId: status === 'ENROLLED' ? 702 : null, enrollmentState: status === 'ENROLLED' ? 'IN_PROGRESS' : null, certificateId: null, recipeVersionId: null, dueDate: null })
    const path = { userId: 991, username: 'TEST_ONLY', fullName: 'TEST_ONLY Học viên đối soát', role: 'TRAINER', branchId: 2, stages: [{ regulationId: 1, courseType: 'INDUCTION', prerequisiteType: null, blocked: false, dueDays: 7, courses: [course(701, 'AVAILABLE'), course(702, 'ENROLLED')] }, { regulationId: 2, courseType: 'PRODUCT', prerequisiteType: 'INDUCTION', blocked: true, dueDays: 7, courses: [course(703, 'BLOCKED')] }] }
    const w = window as unknown as { opsWrites: number; opsRelease?: () => void }; w.opsWrites = 0
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      let data: unknown = { items: [], total: 0, page: 1, size: 20 }
      if (config.url?.includes('unread-count')) data = { count: 0 }
      if (config.url === '/me/notifications') data = { items: [{ id: 1, subject: 'Course due soon', message: "'TEST_ONLY Kỹ thuật pha chế' is due on 2026-11-10.", createdAt: '2026-11-06T09:00:00Z', read: false, readAt: null }], total: 1, page: 1, size: 20 }
      if (config.url?.includes('learning-path')) data = path
      if (config.url?.endsWith('/assign')) { w.opsWrites++; await new Promise<void>(resolve => { w.opsRelease = resolve }); data = { path: { ...path, stages: path.stages.map(s => ({ ...s, courses: s.courses.map(c => c.courseId === 701 ? { ...c, status: 'ENROLLED', enrollmentId: 704, enrollmentState: 'ASSIGNED' } : c) })) }, enrollmentIds: [704] } }
      if (config.url === '/enrollments/701') data = { id: 701, userId: 992, courseId: 701, courseTitle: 'TEST_ONLY Kỹ thuật pha chế', state: eligible ? 'ELIGIBLE' : 'IN_PROGRESS', enrolledAt: '2026-11-01T00:00:00Z', trainingClassId: null, progressPercent: 50 }
      if (config.url === '/courses/701') data = { id: 701, title: 'TEST_ONLY Kỹ thuật pha chế', state: 'PUBLISHED', modules: [], practicalChecklist: [], recipeVersionId: null }
      if (config.url?.endsWith('/quiz-attempts')) data = eligible ? [{ passed: true, attemptedAt: '2026-11-02T00:00:00Z', attemptNo: 1, score: 100 }] : []
      if (config.url?.endsWith('/practical-schedules') || config.url?.endsWith('/practical-videos')) data = []
      if(config.url?.endsWith('/practical-schedules')&&config.method==='post'){w.opsWrites++;const body=JSON.parse(String(config.data));await new Promise<void>(resolve=>{w.opsRelease=resolve});data={id:9001,enrollmentId:701,courseId:701,courseTitle:'TEST_ONLY Kỹ thuật pha chế',traineeName:'TEST_ONLY Học viên',trainerName:'TEST_ONLY Giảng viên',trainerId:991,status:'SCHEDULED',...body}}
      return { config, data, status: 200, statusText: 'OK', headers: {} }
    }
    const arg = { username: 'TEST_ONLY', password: 'TEST_ONLY' }
    store.dispatch(auth.login.pending('TEST_ONLY', arg)); store.dispatch(auth.login.fulfilled({ user: { id: '991', name: 'TEST_ONLY', role: 'TRAINER', email: 'test@example.invalid', branchId: 2 }, accessToken: 'TEST_ONLY', refreshToken: 'TEST_ONLY' }, 'TEST_ONLY', arg))
  }, eligible)
  await expect(page).toHaveURL(/trainer\/dashboard/)
  await page.evaluate(route => { history.pushState({ ...history.state, idx: Number(history.state?.idx ?? 0) + 1 }, '', route); dispatchEvent(new PopStateEvent('popstate', { state: history.state })) }, route)
}
test('OPS pilot learning-path assignment explains selection and truthful per-course result', async ({ page }) => {
  await setup(page, '/trainer/learning-path'); const opener = page.getByRole('button', { name: 'Giao các khóa đang mở', exact: true }); await opener.click()
  if (before) { await capture(page, 'PATH-DIALOG', '/trainer/learning-path'); return }
  const dialog = page.getByRole('dialog'); await expect(dialog).not.toContainText(/\b(BE|AVAILABLE|enrollmentIds|path)\b/)
  await expect(dialog).toContainText('TEST_ONLY Học viên'); const submit = dialog.locator('button[type=submit]'); await expect(submit).toHaveText('Giao khóa học')
  await capture(page, 'PATH-DIALOG', '/trainer/learning-path')
  await submit.click(); await expect(submit).toBeDisabled(); expect(await page.evaluate(() => (window as unknown as { opsWrites: number }).opsWrites)).toBe(1)
  await page.evaluate(() => (window as unknown as { opsRelease: () => void }).opsRelease()); await expect(dialog).toContainText('Giao mới: 1')
  await expect(dialog).toContainText('Chưa đủ điều kiện'); await expect(dialog).not.toContainText('704')
  await receipt(page,'PATH-RECEIPT','/trainer/learning-path')
  await dialog.locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click(); await expect(opener).toBeFocused()
})
test('OPS pilot practical blocked explains next step without wire terms', async ({ page }) => {
  await setup(page, '/trainer/assessment/701'); const panel = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Lịch thực hành', exact: true }) }).last()
  await expect(panel.getByRole('button', { name: 'Đặt lịch', exact: true })).toBeDisabled(); await panel.scrollIntoViewIfNeeded()
  if (!before) { await expect(panel).not.toContainText(/ELIGIBLE|API|ISO|offset/); await expect(panel).toContainText('hoàn thành') }
  await capture(page, 'PRACTICAL-BLOCKED', '/trainer/assessment/:id')
})
test('OPS pilot practical ready has local time guidance and action-specific submit', async ({ page }) => {
  await setup(page, '/trainer/assessment/701', true); await page.getByRole('button', { name: 'Đặt lịch', exact: true }).click()
  if (!before) { await expect(page.getByRole('dialog').locator('button[type=submit]')).toHaveText('Lưu lịch thực hành'); await expect(page.getByRole('dialog')).toContainText('múi giờ'); await expect(page.locator('#scheduledAt')).toHaveAttribute('type', 'datetime-local') }
  await capture(page, 'PRACTICAL-FORM', '/trainer/assessment/:id')
  if(!before){
    await page.locator('#scheduledAt').fill('2099-01-31T10:00');await page.locator('#location').fill('TEST_ONLY Khu vực pha chế và đối chiếu tiêu chuẩn tại chi nhánh · bàn thực hành có tên dài');await page.getByRole('dialog').locator('button[type=submit]').click();await expect(page.getByRole('dialog').locator('button[type=submit]')).toBeDisabled();expect(await page.evaluate(()=>(window as unknown as {opsWrites:number}).opsWrites)).toBe(1);await page.evaluate(()=>(window as unknown as {opsRelease:()=>void}).opsRelease());await expect(page.getByRole('dialog')).toContainText('Đã đặt lịch');await expect(page.getByRole('dialog')).toContainText('TEST_ONLY Khu vực pha chế');await receipt(page,'PRACTICAL-RECEIPT','/trainer/assessment/:id')
  }
})
test('OPS inbox translates verified notification template without invented navigation', async ({ page }) => {
  await setup(page, '/trainer/notifications'); await expect(page.locator('main article')).toHaveCount(1)
  if(!before) { await expect(page.locator('main article')).toContainText('Khóa học sắp đến hạn'); await expect(page.locator('main article')).toContainText('10/11/2026'); await expect(page.locator('main article a')).toHaveCount(0) }
  await capture(page,'INBOX-CONTENT','/trainer/notifications')
})
test('OPS login refusal is understandable without exposing server wording',async({page})=>{
 await page.route('**/api/v1/auth/login',r=>r.fulfill({status:401,json:{code:'UNAUTHENTICATED',message:'Invalid username or password.',details:[]}}))
 await page.goto('/login');await page.getByLabel('Tên đăng nhập').fill('TEST_ONLY');await page.getByLabel('Mật khẩu').fill('TEST_ONLY');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible()
 if(!before)await expect(page.getByRole('alert')).toContainText('Tên đăng nhập hoặc mật khẩu chưa đúng')
 await capture(page,'LOGIN-REFUSAL','/login','ANONYMOUS')
})
test('OPS bootstrap recovery keeps the pair and hides a server exception',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({status:503,json:{message:'TEST_ONLY API SQL exception payload',code:'TEST_ONLY',details:[]}}))
 await page.addInitScript(()=>sessionStorage.setItem('brewforge.session.v1',JSON.stringify({version:1,accessToken:'TEST_ONLY',refreshToken:'TEST_ONLY'})))
 await page.goto('/trainer/dashboard');await expect(page.getByRole('alert')).toBeVisible()
 if(!before){expect(await page.locator('main').innerText()).not.toMatch(/SQL|payload|API/);await expect(page.getByRole('button',{name:'Thử lại khôi phục phiên'})).toBeVisible();expect(await page.evaluate(()=>Boolean(sessionStorage.getItem('brewforge.session.v1')))).toBe(true)}
 await capture(page,'BOOTSTRAP-RECOVERY','/trainer/dashboard','ANONYMOUS')
})
test('OPS primary action and neutral guidance meet text contrast and keyboard close',async({page})=>{
 await setup(page,'/trainer/learning-path');const opener=page.getByRole('button',{name:'Giao các khóa đang mở',exact:true});await opener.click()
 const ratios=await page.getByRole('dialog').evaluate(dialog=>{
   const luminance=(color:string)=>{const rgb=color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}
   return ['button[type=submit]','.notice-box'].map(selector=>{const style=getComputedStyle(dialog.querySelector(selector)!);const a=luminance(style.color),b=luminance(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)})
 });for(const ratio of ratios)expect(ratio).toBeGreaterThanOrEqual(4.5)
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(opener).toBeFocused()
})
