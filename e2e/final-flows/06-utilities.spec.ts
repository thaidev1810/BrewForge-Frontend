import { test, expect } from '@playwright/test'
import process from 'node:process'
import crypto from 'node:crypto'
import { Actors, api, entity, manifest, record, save } from './harness.js'
import { authoredCourse } from './owned-course.js'

test('owned utilities: question bank copy, recipe copy/repair/reject/rollback, empty impact, evidence, inbox and exports', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true' || process.env.E2E_ALLOW_ADDITIONAL_TRAINEE !== 'true', 'Local test and authorized additional learner opt-in required')
  test.setTimeout(180_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'question bank'
  const proof = (id: string, flow: string, assertion: string, kind = 'happy', via = 'LIVE_API') => record(m, id, { flow, role: 'test actors', kind, via, status: via === 'LIVE_UI' ? 'PASS_LIVE_UI' : 'PASS_LIVE_API', assertion, evidence: `run ${m.runId}; API/source ownership verified` })
  try {
    const admin = await actors.login('ADMIN'), trainer = await actors.login('TRAINER'), rd = await actors.login('RD_MANAGER'), specialist = await actors.login('RD_SPECIALIST'), auditor = await actors.login('QUALITY_AUDITOR')
    const draftCourse = await authoredCourse(trainer, m, 'utility_course')
    if (!m.cases['question-bank']?.status.startsWith('PASS')) {
    const bankBody = { questionType: 'SINGLE_CHOICE', questionText: m.runId + ' bank question', options: [{ key: 'A', text: 'Work surface' }, { key: 'B', text: 'Nothing' }], correctOptions: ['A'], moduleType: 'TECHNIQUE', courseId: null }
    const created = await api(trainer, 'QuestionBank.Create', {}, bankBody); expect(created.ok).toBe(true)
    const bankId = Number(created.data.id); entity(m, 'question bank item', bankId, 'CREATED own')
    const copied = await api(trainer, 'QuestionBank.AddToCourse', { id: bankId, courseId: draftCourse }); expect(copied.ok).toBe(true)
    expect((await api(trainer, 'QuestionBank.Update', { id: bankId }, { ...bankBody, questionText: m.runId + ' updated bank question' })).ok).toBe(true)
    expect((await api(trainer, 'QuestionBank.Delete', { id: bankId })).ok).toBe(true)
    const questions = await api(trainer, 'Courses.ListQuestions', { id: draftCourse })
    expect((questions.data as unknown as { id: number; questionText: string }[]).find(question => question.id === copied.data.id)?.questionText).toBe(bankBody.questionText)
    entity(m, 'question bank item', bankId, 'DELETED owned test item; copied question preserved')
    proof('question-bank', 'Question bank CRUD/copy isolation', 'Own question copied to draft course; editing/deleting bank item leaves copied course question unchanged')
    }
    stage = 'recipe copy and manual repair/reject'
    if (!m.ids.copiedDraft) {
      const copy = await api(specialist, 'Recipes.CreateVersion', { id: m.ids.recipe }, { copyFromVersionId: m.ids.version }); expect(copy.ok).toBe(true)
      m.ids.copiedDraft = Number(copy.data.id); entity(m, 'version', m.ids.copiedDraft, 'DRAFT copied from own released SOP')
      const data = await api(specialist, 'RecipeVersions.Get', { id: m.ids.copiedDraft })
      const steps = data.data.steps as { stepOrder: number; actionText: string; durationSeconds: number; ingredients: { ingredientId: number; quantity: number; unit: string }[] }[]
      const patch = { steps: steps.map(step => ({ stepOrder: step.stepOrder, actionText: step.actionText + ' (technical repair test)', durationSeconds: step.durationSeconds, ingredients: step.ingredients.map(item => ({ ingredientId: item.ingredientId, quantity: item.quantity, unit: item.unit })), dependsOn: [] })) }
      expect((await api(specialist, 'RecipeVersions.Repair', { id: m.ids.copiedDraft }, { mode: 'MANUAL', patch })).ok).toBe(true)
      expect((await api(specialist, 'RecipeVersions.Submit', { id: m.ids.copiedDraft })).ok).toBe(true)
      const version = await api(rd, 'RecipeVersions.Get', { id: m.ids.copiedDraft })
      const rejected = await api(rd, 'RecipeVersions.Review', { id: m.ids.copiedDraft }, { decisions: (version.data.steps as { id: number }[]).map(step => ({ stepId: step.id, action: 'REJECT' })) }); expect(rejected.ok).toBe(true)
      entity(m, 'version', m.ids.copiedDraft, 'REJECTED test copy; current release unchanged')
    }
    if (!m.ids.rollbackDraft) {
      const rollback = await api(rd, 'RecipeVersions.Rollback', { id: m.ids.version }); expect(rollback.ok).toBe(true)
      m.ids.rollbackDraft = Number(rollback.data.id); entity(m, 'version', m.ids.rollbackDraft, 'DRAFT rollback copy; not released')
    }
    const recipe = await api(specialist, 'Recipes.Get', { id: m.ids.recipe }); expect(recipe.data.releasedVersionId).toBe(m.ids.version)
    proof('recipe-auxiliary', 'Version copy/manual repair/reject/rollback', 'Copy repaired/submitted/rejected; rollback creates a new draft only. Live SOP15 remains released; no release rollback in place')
    stage = 'empty impact'
    if (!m.ids.impactIngredient) {
      const ingredient = await api(admin, 'Ingredients.Create', {}, { ingredientCode: 'E2E_I' + Date.now().toString(36).toUpperCase(), name: m.runId + ' unused impact ingredient', unit: 'g', shelfLifeHours: 1 }); expect(ingredient.ok).toBe(true)
      m.ids.impactIngredient = Number(ingredient.data.id); entity(m, 'ingredient', m.ids.impactIngredient, 'ACTIVE unused own impact fixture')
    }
    if (!m.refs?.impactRun) {
      const analyzed = await api(rd, 'ImpactAnalysis.Analyze', {}, { entityType: 'Ingredient', entityId: m.ids.impactIngredient }); expect(analyzed.ok).toBe(true)
      m.refs = { ...m.refs, impactRun: String(analyzed.data.runId) }; entity(m, 'impact run', m.refs.impactRun, 'EMPTY preview')
    }
    const runId = m.refs.impactRun
    const impact = await api(rd, 'ImpactAnalysis.Get', { runId }); expect(impact.ok).toBe(true)
    if (!impact.data.committed) expect((await api(rd, 'ImpactAnalysis.Commit', { runId })).ok).toBe(true)
    const conflict = await api(rd, 'ImpactAnalysis.Commit', { runId }); expect(conflict.status).toBe(409)
    await rd.goto('/rd-manager/impact/' + runId); await expect(rd.getByText('Đã áp dụng. Không thể gửi áp dụng lần nữa.', { exact: true })).toBeVisible()
    entity(m, 'impact run', runId, 'COMMITTED empty own fixture')
    proof('impact-empty-conflict', 'Empty impact persistence/commit conflict', 'Unused owned ingredient produces persisted run, commit succeeds; second commit409 and UI removes repeat action', 'unhappy', 'LIVE_UI')
    stage = 'audit image UI'
    if (!m.ids.evidenceAudit) {
      await auditor.goto('/quality-auditor/branch-audits'); await auditor.getByRole('button', { name: 'Thêm mới', exact: true }).click()
      const dialog = auditor.getByRole('dialog')
      await dialog.getByRole('combobox', { name: 'Chi nhánh', exact: true }).selectOption(String(m.ids.branch))
      await dialog.getByRole('combobox', { name: 'Chọn công thức để xem phiên bản', exact: true }).selectOption(String(m.ids.recipe))
      await dialog.getByRole('combobox', { name: 'Phiên bản SOP', exact: true }).selectOption(String(m.ids.version))
      await dialog.locator('[data-field="items"]').getByRole('button', { name: /^Thêm/ }).click()
      await dialog.locator('[id="items[0].criterion"]').fill(m.runId + ' synthetic image test')
      await dialog.locator('[id="items[0].passed"]').selectOption('true')
      await dialog.getByLabel('Chọn ảnh minh chứng', { exact: true }).setInputFiles('e2e-private/final-fixtures/technical-audit.png')
      const uploaded = auditor.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/branch-audits/evidence'))
      await dialog.getByRole('button', { name: 'Tải ảnh & gắn minh chứng', exact: true }).click(); expect((await uploaded).status()).toBe(201)
      const saved = auditor.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/branch-audits')
      await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click(); const response = await saved; expect(response.status()).toBe(201)
      const audit = await response.json(); m.ids.evidenceAudit = audit.id; entity(m, 'audit', audit.id, 'PASSED synthetic image fixture')
      await dialog.locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    }
    await auditor.goto('/quality-auditor/branch-audits/' + m.ids.evidenceAudit)
    await auditor.getByRole('tab', { name: 'Ảnh minh chứng', exact: true }).click()
    await auditor.locator('.evidence-gallery summary').first().click()
    await auditor.getByRole('button', { name: 'Xem ảnh minh chứng', exact: true }).click()
    await expect.poll(() => auditor.getByAltText('Ảnh đính kèm').evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(640)
    await auditor.setViewportSize({ width: 360, height: 1000 }); expect(await auditor.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    proof('audit-image', 'Audit evidence upload/read', 'Synthetic PNG uploaded through UI, attached to new test audit, retrieved with auth and decoded at mobile360', 'happy', 'LIVE_UI')
    stage = 'owned test learner inbox'
    const username = m.runId.toLowerCase() + '_learner2', password = 'T!' + crypto.randomBytes(18).toString('base64url') + '6a'
    stage = 'inbox account ownership'
    const user = await api(admin, 'Users.Get', { id: m.ids.additionalLearner }); if (user.data.username !== username) throw new Error('Owned learner mismatch')
    expect((await api(admin, 'Users.Update', { id: m.ids.additionalLearner }, { username, password, email: user.data.email, fullName: user.data.fullName, role: 'TRAINEE', branchId: m.ids.branch, status: 'ACTIVE' })).ok).toBe(true)
    stage = 'inbox generated learner login'
    const learner = await actors.loginGenerated(username, password)
    stage = 'open inbox'
    await learner.goto('/barista/notifications')
    const unread = await api(learner, 'Notifications.UnreadCount'); expect(unread.ok).toBe(true)
    stage = 'inbox mark one'
    if (Number(unread.data.count) > 0) {
      await learner.getByRole('button', { name: 'Đánh dấu đã đọc', exact: true }).first().click()
      const marked = learner.waitForResponse(response => response.request().method() === 'POST' && /\/notifications\/\d+\/read$/.test(new URL(response.url()).pathname))
      await learner.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await marked).status()).toBe(200)
      await learner.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    }
    stage = 'inbox mark all'
    await learner.getByRole('button', { name: 'Đánh dấu tất cả đã đọc', exact: true }).click()
    const all = learner.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/notifications/read-all'))
    await learner.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await all).status()).toBe(200)
    await learner.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    expect((await api(learner, 'Notifications.UnreadCount')).data.count).toBe(0)
    proof('inbox-read-all', 'Inbox/count/read/read-all', 'Only newly authorized run-owned account notifications marked through UI; server unread count reaches0, no guessed deep links', 'happy', 'LIVE_UI')
    stage = 'scoped report download'
    await rd.goto('/rd-manager/compliance')
    await rd.locator('#filter-format').selectOption('csv'); await rd.locator('#filter-courseId').fill(String(m.ids.course)); await rd.locator('#filter-recipeVersionId').fill(String(m.ids.version)); await rd.locator('#filter-branchId').fill(String(m.ids.branch))
    await rd.getByRole('button', { name: 'Áp dụng', exact: true }).click()
    const download = rd.waitForEvent('download'); await rd.getByRole('button', { name: 'Tải báo cáo', exact: true }).click()
    const file = await download; expect(file.suggestedFilename()).toMatch(/\.csv$/i)
    const stream = await file.createReadStream(); expect(stream).toBeTruthy(); let bytes = 0; for await (const chunk of stream!) bytes += chunk.length
    expect(bytes).toBeGreaterThan(20)
    proof('scoped-export', 'CSV export/download filename', 'Real UI download filtered to own course/SOP/branch; suggested CSV filename and nonempty stream verified, names not persisted to report', 'happy', 'LIVE_UI')
  } catch { record(m, 'utilities-failure', { flow: stage, role: 'test actors', kind: 'diagnostic', via: 'LIVE_UI/API', status: 'FAIL', assertion: 'Sanitized failure at ' + stage, evidence: 'Raw error/cause deliberately omitted to protect credentials' }); throw new Error('Sanitized utilities failure at ' + stage) }
  finally { save(m); await actors.close() }
})
