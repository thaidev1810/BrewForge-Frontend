import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import { Actors, api, entity, manifest, record, save } from './harness.js'

test('reuse separately owned older run for SOP supersession and course rebuild; preserve current NEW launch', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Local test write authorization required')
  test.setTimeout(90_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'legacy ownership proof'
  try {
    const history = JSON.parse(fs.readFileSync('e2e-private/experience-business-history.json', 'utf8')) as { runId: string; ids: Record<string, number>; status: string }[]
    const owned = history.find(row => row.status === 'PASS_LIVE' && row.ids.recipe !== m.ids.recipe && row.ids.course && row.ids.version)
    if (!owned) { test.skip(true, 'No separately proven owned older run available; current happy chain retained'); return }
    const specialist = await actors.login('RD_SPECIALIST'), manager = await actors.login('RD_MANAGER'), trainer = await actors.login('TRAINER')
    const recipe = await api(specialist, 'Recipes.Get', { id: owned.ids.recipe }), course = await api(trainer, 'Courses.Get', { id: owned.ids.course })
    if (recipe.data.recipeCode !== owned.runId || course.data.title !== owned.runId + ' training') throw new Error('Legacy ownership mismatch')
    const pilots = await api(manager, 'Pilots.List', {}, undefined, { recipeVersionId: owned.ids.version, size: 100 })
    if ((pilots.data.items as { state: string }[]).some(pilot => ['DRAFT','RUNNING'].includes(pilot.state))) {
      record(m, 'course-rebuild', { flow: 'Course rebuild after source change', role: 'TRAINER/RD', kind: 'happy', via: 'LIVE_API', status: 'BLOCKED', assertion: 'No active older pilot cancelled to make test pass', evidence: 'Verified old E2E run has active pilot', blocker: 'Legacy source is in use; preserve current and legacy checkpoints' }); return
    }
    if (!m.ids.rebuildSource) {
      stage = 'new owned legacy SOP version'
      const made = await api(specialist, 'Recipes.CreateVersion', { id: owned.ids.recipe }, { copyFromVersionId: owned.ids.version }); expect(made.ok).toBe(true)
      m.ids.rebuildSource = Number(made.data.id); entity(m, 'legacy owned version', m.ids.rebuildSource, 'DRAFT recipe ' + owned.ids.recipe)
      const steps = made.data.steps as { stepOrder: number; actionText: string; durationSeconds: number; ingredients: { ingredientId: number; quantity: number; unit: string }[] }[]
      const patch = { steps: steps.map(step => ({ stepOrder: step.stepOrder, actionText: step.actionText + ' - automated technical revision', durationSeconds: step.durationSeconds, ingredients: step.ingredients.map(i => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit })), dependsOn: [] })) }
      expect((await api(specialist, 'RecipeVersions.Update', { id: m.ids.rebuildSource }, patch)).ok).toBe(true)
      expect((await api(specialist, 'RecipeVersions.Submit', { id: m.ids.rebuildSource })).ok).toBe(true)
      const source = await api(manager, 'RecipeVersions.Get', { id: m.ids.rebuildSource })
      expect((await api(manager, 'RecipeVersions.Review', { id: m.ids.rebuildSource }, { decisions: (source.data.steps as { id: number }[]).map(step => ({ stepId: step.id, action: 'ACCEPT' })) })).ok).toBe(true)
      expect((await api(manager, 'RecipeVersions.Release', { id: m.ids.rebuildSource })).ok).toBe(true)
      entity(m, 'legacy owned version', m.ids.rebuildSource, 'RELEASED separate legacy recipe ' + owned.ids.recipe)
    }
    stage = 'outdated source and rebuild'
    const changed = await api(trainer, 'Courses.Get', { id: owned.ids.course }); expect(changed.data.state).toBe('OUT_OF_DATE')
    const rebuild = await api(trainer, 'Courses.Rebuild', { id: owned.ids.course }); expect(rebuild.ok).toBe(true); expect(rebuild.data.state).toBe('DRAFT'); expect(rebuild.data.recipeVersionId).toBe(m.ids.rebuildSource)
    const current = await api(specialist, 'Recipes.Get', { id: m.ids.recipe }); expect(current.data.releasedVersionId).toBe(m.ids.version)
    const launches = await api(manager, 'BranchLaunchStatus.List', {}, undefined, { recipeId: m.ids.recipe, branchId: m.ids.branch }); expect((launches.data as unknown as { status: string }[])[0].status).toBe('LIVE')
    m.ids.rebuiltLegacyCourse = owned.ids.course; entity(m, 'legacy owned course', owned.ids.course, 'DRAFT rebuilt against own new source'); save(m)
    record(m, 'course-rebuild', { flow: 'Course OUT_OF_DATE/rebuild', role: 'RD_SPECIALIST/RD_MANAGER/TRAINER', kind: 'happy', via: 'LIVE_API', status: 'PASS_LIVE_API', assertion: 'Proof from prior run ledger → own older recipe revised/released → its course OUT_OF_DATE → rebuild DRAFT on new SOP; current NEW recipe16/SOP15/LIVE launch unchanged', evidence: 'Separate verified older E2E run only; no shared or current main chain modified' })
  } catch { record(m, 'rebuild-failure', { flow: stage, role: 'test actors', kind: 'diagnostic', via: 'LIVE_API', status: 'FAIL', assertion: 'Sanitized rebuild failure at ' + stage, evidence: 'No response payload retained' }); throw new Error('Sanitized rebuild failure at ' + stage) }
  finally { await actors.close() }
})
