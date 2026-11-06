import { test,expect } from '@playwright/test'
import fs from 'node:fs'
import { Actors } from './harness.js'
import { captureEvidence } from '../helpers/evidence.js'
test('OPS pilot real learning path and practical gate are read without creating shared data',async({browser},info)=>{
 const actors=new Actors(browser,String(info.project.use.baseURL),'e2e-private/ops-operations.json')
 try {const page=await actors.login('TRAINER');const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1/me/learning-path'&&r.request().method()==='GET');await page.goto('/trainer/learning-path');expect((await response).status()).toBe(200)
 await page.getByRole('button',{name:'Giao các khóa đang mở',exact:true}).click();await expect(page.getByRole('dialog').locator('button[type=submit]')).toHaveText('Giao khóa học');expect(await page.getByRole('dialog').innerText()).not.toMatch(/\b(BE|AVAILABLE|enrollmentIds|path)\b/)
 for(const width of [1440,768,390,360]) {await page.setViewportSize({width,height:900});await captureEvidence(page,{runId:'OPS_20261106',caseId:'LIVE-PATH-READ',role:'TRAINER',routeTemplate:'/trainer/learning-path',scope:'LIVE_UI',phase:'retest',result:'PASS',assertion:'Actual own learning-path GET200 and dialog; no assignment to a shared account; pre-change live screenshot NOT_CAPTURED, isolated pilot pair supplied'})}
 await page.keyboard.press('Escape');const old=JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json','utf8'));await page.goto('/trainer/assessment/'+old.ids.enrollment)
 const section=page.locator('section').filter({has:page.getByRole('heading',{name:'Lịch thực hành',exact:true})}).last();await expect(section.getByRole('button',{name:'Đặt lịch',exact:true})).toBeDisabled();await expect(section).toContainText('đã đạt khóa học');await section.scrollIntoViewIfNeeded()
 for(const width of [1440,768,390,360]) {await page.setViewportSize({width,height:900});await captureEvidence(page,{runId:'OPS_20261106',caseId:'LIVE-SCHEDULE-READ',role:'TRAINER',routeTemplate:'/trainer/assessment/:id',scope:'LIVE_UI',phase:'retest',result:'PASS',assertion:'Actual persisted PASSED enrollment remains blocked for new booking; no gate change; positive pending/save behavior tested only in isolated setup'})}
 }catch{throw Error('Sanitized real pilot read failure')}finally{await actors.close()}
})
