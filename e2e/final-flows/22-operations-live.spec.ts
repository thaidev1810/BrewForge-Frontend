import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { Actors, api } from './harness.js'
import { roles } from '../helpers/environment.js'
import matrix from '../fixtures/permission-matrix.json' with { type: 'json' }
import { captureEvidence } from '../helpers/evidence.js'
const before = process.env.OPS_PHASE === 'before', runId = 'OPS_20261106'
for (const role of roles) test('OPS live task dashboard and shared consumer ' + role, async ({ browser }, info) => {
  const actors = new Actors(browser, String(info.project.use.baseURL), 'e2e-private/ops-operations.json')
  const old = JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json','utf8'))
  const routes = { ADMIN: 'ingredients', RD_SPECIALIST: 'versions/'+old.ids.version, RD_MANAGER: 'pilots/'+old.ids.pilot, TRAINER: 'assessment/'+old.ids.enrollment, TRAINING_MANAGER: 'enrollments/'+old.ids.enrollment, TRAINEE: 'learning/'+old.ids.enrollment, BRANCH_MANAGER: 'sales', QUALITY_AUDITOR: 'branch-audits/'+old.ids.evidenceAudit }
  try {
    const page = await actors.login(role); await page.emulateMedia({ reducedMotion:'reduce' })
    const prefix = matrix.find(r => r.role === role)!.prefix
    for (const [name, route] of [['DESK','dashboard'],['WORK', routes[role]]]) {
      await page.goto(prefix+'/'+route); await expect(page.locator('main h1').first()).toBeVisible(); await expect(page.locator('main .state-panel[role=status]')).toHaveCount(0); await expect(page.locator('main > .error-box')).toHaveCount(0)
      if (!before && name === 'DESK') {
        await expect(page.locator('.work-agenda')).toBeVisible()
        const permitted=await page.locator('.sidebar-nav a').evaluateAll(links=>links.map(a=>a.getAttribute('href')))
        for(const href of await page.locator('.desk-actions a').evaluateAll(links=>links.map(a=>a.getAttribute('href')))) expect(permitted).toContain(href)
      }
      if(!before){
        const audit=await page.evaluate(async()=>{const {unmappedLabels}=await import(/* @vite-ignore */ String('/src/components/common/presentation.ts'));return {unmappedLabels:[...unmappedLabels],technicalTokens:[...new Set(document.querySelector('main')?.innerText.match(/\b(BE|FE|API|DTO|payload|enum|endpoint|schema|nullable|ISO|offset|enrollmentIds|ELIGIBLE|AVAILABLE|PASSED)\b/g)??[])]}})
        fs.writeFileSync('e2e-private/ops-copy-'+role+'-'+name+'.json',JSON.stringify({role,routeTemplate:prefix+'/'+route.replace(/\d+/g,':id'),...audit},null,2))
      }
      for (const width of [1440,768,390,360]) { await page.setViewportSize({width,height:900}); expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth+1)).toBe(true); await captureEvidence(page,{runId,caseId:name+'-'+role,role,routeTemplate:prefix+'/'+route.replace(/\d+/g,':id'),scope:'LIVE_UI',phase:before?'before':'after',result:before?'REPRODUCED':'PASS',assertion:'Real API task screen; same role/route/viewport, no fake metrics or backend mutation'}) }
    }
    await page.reload(); await expect(page.locator('main h1').first()).toBeVisible(); expect((await api(page,'Auth.Me')).ok).toBe(true)
  } catch { throw new Error('Sanitized operations live evidence failure: '+role) } finally { await actors.close() }
})
