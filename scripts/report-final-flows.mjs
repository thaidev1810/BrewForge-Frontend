import fs from 'node:fs'
const manifest = JSON.parse(fs.readFileSync('e2e-private/final-flows-manifest.json', 'utf8'))
const catalog = JSON.parse(fs.readFileSync('e2e/fixtures/business-readiness.json', 'utf8'))
const observations = fs.existsSync('e2e-private/final-flow-operations.json') ? JSON.parse(fs.readFileSync('e2e-private/final-flow-operations.json', 'utf8')) : {}
const cases = Object.entries(manifest.cases).filter(([, row]) => row.kind !== 'diagnostic')
const counts = Object.fromEntries(['PASS_LIVE_UI','PASS_LIVE_API','PASS_ISOLATED','FAIL','BLOCKED','NOT_RUN'].map(status => [status, cases.filter(([, row]) => row.status === status).length]))
const caseFor = {
  'Auth.Login':'checkpoint','Auth.Me':'checkpoint','Users.Create':'additional-user','Users.Update':'own-account-reset','Users.Deactivate':'inactive-account',
  'Recipes.Get':'checkpoint','RecipeVersions.Get':'checkpoint','Courses.Get':'checkpoint','Enrollments.Get':'certificate-read',
  'Recipes.CreateVersion':'recipe-auxiliary','RecipeVersions.Repair':'recipe-auxiliary','RecipeVersions.Submit':'recipe-auxiliary','RecipeVersions.Review':'recipe-auxiliary','RecipeVersions.Rollback':'recipe-auxiliary',
  'Courses.Create':'additional-learn-INDUCTION','CourseModules.Update':'additional-learn-INDUCTION','CourseModules.AddLesson':'additional-learn-INDUCTION','Courses.AddQuestion':'additional-learn-INDUCTION',
  'Courses.Submit':'course-return','Courses.Return':'course-return','Courses.Approve':'course-return',
  'Assignments.Assign':'additional-learn-PRODUCT','Enrollments.Modules':'additional-learn-PRODUCT','Enrollments.CompleteLesson':'additional-learn-PRODUCT','Enrollments.Quiz':'additional-learn-PRODUCT','Enrollments.AttemptQuiz':'quiz-lock-reset','Enrollments.QuizAttempts':'quiz-lock-reset','Enrollments.Reset':'quiz-lock-reset',
  'Enrollments.UploadPracticalVideo':'practical-upload','Enrollments.PracticalVideos':'old-cycle-video','Enrollments.PracticalVideoContent':'practical-playback','Enrollments.EvaluatePractical':'practical-evaluate','Certificates.Mine':'certificate-read',
  'PracticalSchedules.Create':'practical-schedule','PracticalSchedules.ForEnrollment':'practical-schedule','PracticalSchedules.Reschedule':'practical-schedule-transitions','PracticalSchedules.Cancel':'practical-schedule-transitions','PracticalSchedules.Complete':'practical-schedule-transitions',
  'Pilots.Create':'pilot-create','Pilots.Get':'pilot-readiness','Pilots.Start':'pilot-start','Pilots.Readiness':'pilot-readiness','Pilots.GoLive':'go-live','Pilots.Decide':'pilot-transitions','BranchLaunchStatus.List':'go-live',
  'Sales.Create':'sales-create','Sales.Import':'pos-partial','Sales.List':'pos-xlsx-persist','Sales.Aggregate':'pos-xlsx-persist','Sales.ImportResult':'pos-job-history',
  'TrainingClasses.Create':'class-attendance','TrainingClasses.AddSession':'class-attendance','TrainingClasses.Open':'class-attendance','TrainingClasses.Close':'class-close','TrainingClasses.Cancel':'br34-server-denial','TrainingSessions.RecordAttendance':'class-attendance',
  'QuestionBank.Create':'question-bank','QuestionBank.Update':'question-bank','QuestionBank.Delete':'question-bank','QuestionBank.AddToCourse':'question-bank','Courses.ListQuestions':'question-bank',
  'Ingredients.Create':'impact-empty-conflict','ImpactAnalysis.Analyze':'impact-empty-conflict','ImpactAnalysis.Get':'impact-empty-conflict','ImpactAnalysis.Commit':'impact-empty-conflict',
  'BranchAudits.UploadEvidence':'audit-image','BranchAudits.Create':'audit-image','BranchAudits.Get':'audit-image','BranchAudits.Evidence':'audit-image','CorrectiveActions.Get':'retraining-close','CorrectiveActions.Close':'retraining-close',
  'Notifications.Inbox':'inbox-read-all','Notifications.UnreadCount':'inbox-read-all','Notifications.MarkRead':'inbox-read-all','Notifications.MarkAllRead':'inbox-read-all','Reports.Compliance':'scoped-export',
  'Certificates.Get':'certificate-read','Pilots.Evaluation':'pilot-interim','Enrollments.Close':'enrollment-close',
  'Ingredients.Get':'ingredient-catalog','Ingredients.Update':'ingredient-catalog','Ingredients.Deactivate':'ingredient-catalog',
  'Categories.Create':'catalog-auxiliary','Categories.Update':'catalog-auxiliary','Categories.List':'catalog-auxiliary','Categories.Deactivate':'catalog-auxiliary',
  'EquipmentClasses.Create':'catalog-auxiliary','EquipmentClasses.Get':'catalog-auxiliary','EquipmentClasses.Update':'catalog-auxiliary','EquipmentClasses.List':'catalog-auxiliary','EquipmentClasses.Deactivate':'catalog-auxiliary',
  'Products.Create':'catalog-auxiliary','Products.Get':'catalog-auxiliary','Products.Update':'catalog-auxiliary','Products.List':'catalog-auxiliary','Products.Deactivate':'catalog-auxiliary',
  'Branches.Get':'branch-role-lookups','Branches.Update':'branch-role-lookups','Branches.Deactivate':'branch-role-lookups','Roles.List':'branch-role-lookups','UserLookup.Lookup':'branch-role-lookups',
  'Skills.Mine':'skills-dashboards','Dashboards.TrainingProgress':'skills-dashboards','Dashboards.BranchPerformance':'skills-dashboards','Dashboards.CourseEffectiveness':'skills-dashboards',
  'Courses.Rebuild':'course-rebuild','RecipeVersions.Update':'course-rebuild','RecipeVersions.Release':'course-rebuild',
}
function prerequisite(id) {
  if (/isolated/.test(id)) return 'TEST_ONLY adapter; real backend traffic aborted; genuine synthetic media bytes'
  if (/pilot-end/.test(id)) return 'RUNNING NEW pilot; actual EndDate must elapse'
  if (/pilot|go-live/.test(id)) return 'Released NEW SOP15; branch1; VALID exact-version coverage2 for go-live'
  if (/sales|pos-/.test(id)) return 'Actual LIVE launch10; owned recipe16/branch1/day'
  if (/bound-class|br34/.test(id)) return 'Published bound-SOP course8; trainer must have VALID exact-version certificate'
  if (/additional|prerequisite|own-account|inactive/.test(id)) return 'Explicit additional-TRAINEE permission; owned user19; public learning path'
  if (/retraining/.test(id)) return 'Owned action3 and employee enrollment12/current cycle; full technical pass'
  if (/practical|certificate|video|media|schedule/.test(id)) return 'Owned enrollment/current cycle; quiz pass for scheduling/evaluation; authorized recording owner'
  if (/class|quiz|course-return|old-cycle/.test(id)) return 'Separate owned INDUCTION course10/class3/enrollment18; supplied trainer'
  if (/rebuild/.test(id)) return 'Verified legacy run-owned source; no active pilot; new legal release makes course OUT_OF_DATE'
  if (/catalog|ingredient|branch-role/.test(id)) return 'Owned unused catalog/empty branch fixtures; controller-authorized role'
  return 'Validated run ownership, approved local destination and role-specific session; see assertion'
}
function binding(operation) {
  const found = []
  for (const resource of catalog.resources) {
    for (const key of ['list','detail','create','update']) if (resource[key] === operation) found.push(resource.key + ':' + key)
    for (const action of resource.actions ?? []) if (action.operation === operation) found.push(resource.key + ':action')
  }
  for (const report of catalog.reportPages) if (report.operation === operation) found.push(report.key + ':report')
  return [...new Set(found)].join(', ') || 'special component / API capability; see source'
}
function why(operation) {
  if (/^Stock\./.test(operation)) return 'No stock UI; API-only capability outside requested stock UI scope'
  if (/GenerateDraft|ExtractDocument/.test(operation)) return 'External LLM/document provider not authorized/configured for live calls'
  if (/Notifications\.(Subscribe|Unsubscribe|PushConfig|Mine)/.test(operation)) return 'No external Push subscription/send; configuration was only inspected for safety'
  if (/Pilots\.(Decide|Evaluation)/.test(operation)) return 'Final ENDED decision is TIME_DEPENDENT; premature409 has separate evidence'
  if (/Pilots\.(Cancel|Update)|BranchLaunchStatus.Withdraw/.test(operation)) return 'Main NEW pilot/launch retained RUNNING/LIVE; no mutation just to destroy happy checkpoint'
  if (/Courses.Rebuild/.test(operation)) return 'OUT_OF_DATE prerequisite would require a new release/impact on owned live chain; retained intact'
  if (/Auth.Refresh/.test(operation)) return 'Live expired/invalid cases partially observed; happy refresh/race remains prior isolated coverage, not rerun as live concurrency proof'
  return 'No dedicated continuation assertion for this operation; observed HTTP alone is not behavioral PASS. Prior baseline/isolated evidence remains separate.'
}
const inventory = Object.entries(catalog.endpoints).map(([operation, endpoint]) => {
  const id = caseFor[operation], evidence = manifest.cases[id]
  return { operation, method: endpoint.method, path: endpoint.path, roles: endpoint.roles, binding: binding(operation), status: evidence?.status ?? 'NOT_RUN', caseId: evidence ? id : '', limitation: evidence ? (operation === 'RecipeVersions.Repair' ? 'MANUAL mode only; AI repair not called' : operation === 'Reports.Compliance' ? 'CSV UI export; XLSX export not asserted' : evidence.assertion) : why(operation), observedHttp: observations[operation]?.statuses ?? [] }
})
const lines = ['# Final flow coverage and complete API inventory — 04/11/2026', '', `Continuation of ${manifest.runId}; no baseline recreation. Registry: **${cases.length} flow cases**. Counts: ${Object.entries(counts).map(([k,v])=>`${k}=${v}`).join(', ')}.`, '', 'Each row is one named flow case, not a click or API request. Playwright files bundle dependent cases; source-operation inventory is counted separately.', '', '| Case | Flow | Role | Happy/unhappy | UI/API | Status | Assertion/evidence | Blocker / next action |', '| --- | --- | --- | --- | --- | --- | --- | --- |', ...cases.map(([id,row])=>`| ${id} | ${row.flow} | ${row.role} | ${row.kind} | ${row.via} | ${row.status} | ${row.assertion}; ${row.evidence} | ${[row.blocker,row.next].filter(Boolean).join('; ')} |`), '', `## All ${inventory.length} registered API operations`, '', 'Every operation is inventoried, including auxiliary flows. NOT_RUN has an explicit reason; a successful list or hidden button does not prove every permission or business variant. UI action/resource bindings come from current source; full detail-only router bindings remain in app/router.tsx.', '', '| Operation | Method/path | Roles | UI binding | Status | Case / limitation | Observed HTTP (metadata only) |', '| --- | --- | --- | --- | --- | --- | --- |', ...inventory.map(row=>`| ${row.operation} | ${row.method} ${row.path} | ${row.roles.join(', ')} | ${row.binding} | ${row.status} | ${row.caseId ? row.caseId+': ' : ''}${row.limitation} | ${row.observedHttp.join(', ')} |`), '', 'An operation marked PASS means the linked case/variant only. It is not a claim that all roles, inputs, retries, races or branches of the operation passed. Counts of API rows are not added to flow-case totals. Source endpoints without UI are identified separately.', '']
fs.mkdirSync('docs', { recursive: true })
const tableLines = lines.map(line => line === '| Case | Flow | Role | Happy/unhappy | UI/API | Status | Assertion/evidence | Blocker / next action |' ? '| Case | Flow | Role | Happy/unhappy | Prerequisites | UI/API | Status | Assertion/evidence | Blocker / next action |' : line === '| --- | --- | --- | --- | --- | --- | --- | --- |' ? '| --- | --- | --- | --- | --- | --- | --- | --- | --- |' : line)
for (const [id] of cases) {
  const index = tableLines.findIndex(line => line.startsWith('| ' + id + ' |'))
  if (index >= 0) { const cells = tableLines[index].split(' | '); cells.splice(4, 0, prerequisite(id)); tableLines[index] = cells.join(' | ') }
}
const routeSource = fs.readFileSync('src/app/router.tsx', 'utf8')
const routeTemplates = new Map()
for (const resource of catalog.resources) {
  routeTemplates.set(resource.key, resource.list)
  if (resource.detail) routeTemplates.set(resource.key + '/:id', resource.detail)
}
for (const page of catalog.reportPages) routeTemplates.set(page.key, page.operation)
const special = { 'versions/:id':'RecipeVersions.Get','learning/:id/quiz':'Enrollments.Quiz','learning/:id/results':'Enrollments.QuizAttempts','enrollments/:id':'Enrollments.Get','assessment/:id':'Enrollments.EvaluatePractical','pilots/:id':'Pilots.Get','certificates/:id':'Certificates.Get','videos/:id':'Enrollments.PracticalVideoContent','sales/import/:jobId':'Sales.ImportResult','sales-analytics':'Sales.Aggregate','impact':'ImpactAnalysis.Analyze','impact/:runId':'ImpactAnalysis.Get','trace':'AuditLog.Trace','trace/:entityType/:id':'AuditLog.Trace','compliance':'Reports.Compliance','learning-path':'LearningPath.Mine','courses/pending':'Courses.Approve','notifications':'Notifications.Inbox','account':'Auth.Me','push':'Notifications.PushConfig' }
for (const match of routeSource.matchAll(/path\s*:\s*['"]([^'"]+)['"]/g)) if (!routeTemplates.has(match[1])) routeTemplates.set(match[1], special[match[1]] ?? '')
tableLines.push('## Router/menu/action inventory', '', 'Templates below come from current router, resources and report bindings. Protected templates expand under the controller-permitted role prefixes; index routes redirect to dashboard. The API table above lists every action, including those without a UI. A linked API case does not assert that the route was exercised in a browser. Resource list/detail, filter/sort/page and keyboard variants are not all live-tested.', '', '| Route template | Source operation | Continuation status | Evidence / limit |', '| --- | --- | --- | --- |')
for (const [path, operation] of routeTemplates) {
  const id = caseFor[operation], evidence = manifest.cases[id]
  // Conservative: only dedicated live-page evidence proves route coverage.
  const dedicated = { 'assessment/:id':'practical-evaluate','videos/:id':'media-source-switch','compliance':'scoped-export','notifications':'inbox-read-all','sales/import/:jobId':'pos-job-history','impact/:runId':'impact-empty-conflict' }[path]
  const pageCase = manifest.cases[dedicated]
  tableLines.push(`| ${path} | ${operation || 'router guard/layout'} | ${pageCase?.status ?? 'NOT_RUN'} | ${pageCase ? dedicated + ': ' + pageCase.assertion : evidence ? 'API/flow evidence ' + id + '; no separate live route assertion. See isolated regressions in final report.' : 'No dedicated continuation browser assertion; public/auth/layout regressions are reported separately.'} |`)
}
tableLines.push('', `Inventoried ${routeTemplates.size} route templates; these are not additional flow cases or concrete role-route counts.`, '')
fs.writeFileSync('docs/final-flow-coverage.md', tableLines.join('\n'))
fs.writeFileSync('e2e-private/final-flow-inventory.json', JSON.stringify({ counts, cases, inventory, routeTemplates: [...routeTemplates] }, null, 2))
console.log(`Coverage generated: ${cases.length} flow cases, ${inventory.length} source operations; ${JSON.stringify(counts)}.`)
