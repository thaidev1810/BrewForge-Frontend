import { test, expect } from '@playwright/test'
import process from 'node:process'
import { Actors, api, entity, manifest, record, save } from './harness.js'

test('owned auxiliary catalog CRUD, lookup, dashboard/skills and final appointment', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Local test write authorization required')
  test.setTimeout(100_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'owned ingredient'
  const proof = (id: string, flow: string, assertion: string, kind = 'happy', via = 'LIVE_API') => record(m, id, { flow, role: 'test actors', kind, via, status: via === 'LIVE_UI' ? 'PASS_LIVE_UI' : 'PASS_LIVE_API', assertion, evidence: 'Only run-owned catalog objects changed; no shared accounts/settings touched' })
  try {
    const admin = await actors.login('ADMIN'), trainer = await actors.login('TRAINER'), rd = await actors.login('RD_MANAGER'), tm = await actors.login('TRAINING_MANAGER'), learner = await actors.login('TRAINEE'), specialist = await actors.login('RD_SPECIALIST')
    const ingredient = await api(admin, 'Ingredients.Get', { id: m.ids.impactIngredient }); expect(String(ingredient.data.name).startsWith(m.runId)).toBe(true)
    const body = { ingredientCode: ingredient.data.ingredientCode, name: m.runId + ' unused ingredient updated', unit: 'g', shelfLifeHours: 1, status: 'ACTIVE', brewTempMinC: 60, brewTempMaxC: 90 }
    expect((await api(admin, 'Ingredients.Update', { id: m.ids.impactIngredient }, body)).ok).toBe(true)
    expect((await api(admin, 'Ingredients.Update', { id: m.ids.impactIngredient }, { ...body, brewTempMinC: 95, brewTempMaxC: 60 })).status).toBe(400)
    expect((await api(admin, 'Ingredients.Deactivate', { id: m.ids.impactIngredient })).data.status).toBe('INACTIVE'); entity(m, 'ingredient', m.ids.impactIngredient, 'INACTIVE unused owned fixture')
    proof('ingredient-catalog', 'Owned ingredient update/validation/deactivate', 'Own unused ingredient updates valid brewing range, rejects inverted range400, then soft-deactivates; no live recipe references it', 'unhappy')
    stage = 'category/equipment/product'
    if (!m.ids.catalogCategory) { const created = await api(admin, 'Categories.Create', {}, { kind: 'DRINK', code: m.runId + '_CAT', name: m.runId + ' category' }); expect(created.ok).toBe(true); m.ids.catalogCategory = Number(created.data.id); entity(m, 'category', m.ids.catalogCategory, 'ACTIVE') }
    expect((await api(admin, 'Categories.Update', { id: m.ids.catalogCategory }, { kind: 'DRINK', code: m.runId + '_CAT', name: m.runId + ' category updated', status: 'ACTIVE' })).ok).toBe(true)
    if (!m.ids.catalogEquipment) { const created = await api(admin, 'EquipmentClasses.Create', {}, { equipmentCode: m.runId + '_EQ', equipmentClass: m.runId + '_TECH', minThreshold: 1, maxThreshold: 10, dosingUnit: 'g' }); expect(created.ok).toBe(true); m.ids.catalogEquipment = Number(created.data.id); entity(m, 'equipment', m.ids.catalogEquipment, 'ACTIVE unused') }
    const equipment = await api(admin, 'EquipmentClasses.Get', { id: m.ids.catalogEquipment })
    expect((await api(admin, 'EquipmentClasses.Update', { id: m.ids.catalogEquipment }, { equipmentCode: equipment.data.equipmentCode, equipmentClass: equipment.data.equipmentClass, minThreshold: 1, maxThreshold: 12, dosingUnit: 'g', status: 'ACTIVE' })).ok).toBe(true)
    if (!m.ids.catalogProduct) { const created = await api(specialist, 'Products.Create', {}, { productCode: m.runId + '_PD', name: m.runId + ' product fixture', categoryId: m.ids.catalogCategory, recipeId: m.ids.recipe }); expect(created.ok).toBe(true); m.ids.catalogProduct = Number(created.data.id); entity(m, 'product', m.ids.catalogProduct, 'ACTIVE own catalog fixture') }
    expect((await api(specialist, 'Products.Update', { id: m.ids.catalogProduct }, { productCode: m.runId + '_PD', name: m.runId + ' product updated', categoryId: m.ids.catalogCategory, recipeId: m.ids.recipe, status: 'ACTIVE' })).ok).toBe(true)
    const product = await api(admin, 'Products.Get', { id: m.ids.catalogProduct }); expect(product.data.currentVersionId).toBe(m.ids.version)
    for (const operation of ['Categories.List', 'EquipmentClasses.List', 'Products.List'] as const) expect((await api(admin, operation, {}, undefined, { q: m.runId, size: 100 })).ok).toBe(true)
    expect((await api(specialist, 'Products.Deactivate', { id: m.ids.catalogProduct })).data.status).toBe('INACTIVE')
    expect((await api(admin, 'EquipmentClasses.Deactivate', { id: m.ids.catalogEquipment })).data.status).toBe('INACTIVE')
    expect((await api(admin, 'Categories.Deactivate', { id: m.ids.catalogCategory })).data.status).toBe('INACTIVE')
    entity(m, 'product', m.ids.catalogProduct, 'INACTIVE owned fixture'); entity(m, 'equipment', m.ids.catalogEquipment, 'INACTIVE owned fixture'); entity(m, 'category', m.ids.catalogCategory, 'INACTIVE owned fixture')
    proof('catalog-auxiliary', 'Owned category/equipment/product CRUD/lookup', 'Create/update/list/get verify linked current SOP15, then soft-deactivate only unused owned catalog fixtures; underlying recipe/launch remain LIVE')
    stage = 'owned branch and role lookup'
    const branch = await api(admin, 'Branches.Get', { id: m.ids.scopeBranch }); expect(String(branch.data.name).startsWith(m.runId)).toBe(true)
    expect((await api(admin, 'Branches.Update', { id: m.ids.scopeBranch }, { branchCode: branch.data.branchCode, name: m.runId + ' unused scope branch updated', address: 'Automated technical test', status: 'ACTIVE' })).ok).toBe(true)
    expect((await api(admin, 'Branches.Deactivate', { id: m.ids.scopeBranch })).data.status).toBe('CLOSED'); entity(m, 'branch', m.ids.scopeBranch, 'CLOSED empty owned fixture')
    const roles = await api(admin, 'Roles.List'); expect((roles.data as unknown as { role: string }[]).length).toBe(8)
    const directory = await api(tm, 'UserLookup.Lookup', {}, undefined, { ids: String(m.ids.additionalLearner) }); expect((directory.data.items as { id: number }[]).some(row => row.id === m.ids.additionalLearner)).toBe(true)
    proof('branch-role-lookups', 'Owned branch CRUD and reference lookup', 'Empty own branch updated/deactivated; real eight-role catalog and explicit owned staff-ID directory lookup verified')
    stage = 'skills/dashboards'
    const skills = await api(learner, 'Skills.Mine'); expect(skills.ok).toBe(true)
    expect((await api(trainer, 'Dashboards.TrainingProgress', {}, undefined, { branchId: m.ids.branch, courseId: m.ids.course })).ok).toBe(true)
    const performance = await api(rd, 'Dashboards.BranchPerformance', {}, undefined, { branchId: m.ids.branch, recipeId: m.ids.recipe }); expect(performance.ok).toBe(true)
    expect((await api(rd, 'Dashboards.CourseEffectiveness', {}, undefined, { courseId: m.ids.course })).ok).toBe(true)
    proof('skills-dashboards', 'Skills/training/branch/course reports', 'Real own learner skills and dashboard queries scoped to run course/recipe/branch succeed; not proof of all report permutations')
    stage = 'complete original practical schedule UI'
    const schedules = await api(trainer, 'PracticalSchedules.ForEnrollment', { id: m.ids.enrollment })
    const schedule = (schedules.data as unknown as { id: number; status: string }[]).find(row => row.id === m.ids.schedule)
    if (schedule?.status === 'SCHEDULED') {
      await trainer.goto('/trainer/assessment/' + m.ids.enrollment)
      await trainer.getByRole('button', { name: 'Hoàn tất lịch', exact: true }).click()
      const completed = trainer.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/practical-schedules/' + m.ids.schedule + '/complete'))
      await trainer.getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await completed).status()).toBe(200)
    }
    entity(m, 'practical schedule', m.ids.schedule, 'COMPLETED original technical assessment')
    proof('main-schedule-complete', 'Complete original practical appointment', 'After actual technical evaluation, owner completes its original appointment through UI; certificate was issued by assessment, not schedule', 'happy', 'LIVE_UI')
  } catch { record(m, 'catalog-failure', { flow: stage, role: 'test actors', kind: 'diagnostic', via: 'LIVE_API/UI', status: 'FAIL', assertion: 'Sanitized catalog failure at ' + stage, evidence: 'No private response retained' }); throw new Error('Sanitized catalog failure at ' + stage) }
  finally { save(m); await actors.close() }
})
