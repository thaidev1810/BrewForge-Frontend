import fs from 'node:fs'

const file = 'e2e-private/product-review.json'
const state = JSON.parse(fs.readFileSync(file, 'utf8'))
const catalog = JSON.parse(fs.readFileSync('e2e/fixtures/business-readiness.json', 'utf8'))
const observations = JSON.parse(fs.readFileSync('e2e-private/product-review-operations.json', 'utf8'))
const planned = {
  'AUTH-SESSION-FAULTS': ['Auth/session', 'TEST_ONLY actors', 'Bootstrap/refresh/revocation/late account response', 'PASS_ISOLATED', 'Current Node20 session checks + browser11 session checks pass; single-flight,503 retry,revoked token,logout race,cache scope; no live refresh concurrency claim'],
  'SHARED-FAULTS': ['Shared UI', 'TEST_ONLY actors', 'Form/refetch/partial/timeout/keyboard/mobile states', 'PASS_ISOLATED', 'Current browser74 checks pass; server-error draft retention, partial assignment/retraining, picker race/page, tabs/sidebar, POS lost-response same-key retry; not backend persistence'],
  'CATALOG-OTHER-WRITES': ['Catalog/admin', 'controller-specific roles', 'User/branch/category/equipment/product mutations', 'NOT_RUN', 'Current round verifies role lists and owned ingredient CRUD; other mutation lifecycles remain historical, not rerun or inferred from lists'],
  'SETTINGS-WRITE': ['Catalog/admin', 'ADMIN', 'Company settings update', 'NOT_RUN', 'Company-wide values are existing shared data, no owned setting-create capability; list read only, no global threshold changed for a negative case'],
  'RECIPE-FULL-LIFECYCLE': ['Recipe/SOP', 'RD_SPECIALIST/RD_MANAGER', 'New release/review/cutover/rollback/import', 'NOT_RUN', 'Owned copy16 validate/edit tested now; full release/cutover/rollback remains previous-round evidence. Main released SOP15 and LIVE chain retained'],
  'COURSE-REBUILD': ['Course', 'TRAINER', 'Rebuild from OUT_OF_DATE', 'NOT_RUN', 'Owned course6 rebuild was historical; current fresh course12 covers author/return/resubmit/approve, not another source release/rebuild'],
  'CLASS-UNBOUND-LIFECYCLE': ['Class', 'TRAINER/TRAINEE', 'Open/session/attendance/close/cancel', 'NOT_RUN', 'Earlier INDUCTION class3 is CLOSED; current isolated UI covers sessions/cancel/attendance rendering, no new live class lifecycle claimed'],
  'PRACTICAL-NEGATIVE-LIFECYCLE': ['Learning/practical', 'TRAINER/TRAINING_MANAGER', 'Quiz lock/reset,fail/retake,oversize,schedule cancel/close', 'NOT_RUN', 'Earlier separate enrollment lifecycle remains historical; fresh current enrollment37 retained PASSED. Existing isolated regressions cover old-cycle selection; not a new live negative cycle'],
  'IMPACT-LIFECYCLE': ['Quality/impact', 'RD_MANAGER', 'Analyze/preview/commit/empty/stale', 'NOT_RUN', 'Earlier empty committed run retained; no new analyze/commit live operation. Current isolated conflict UI regression does not prove snapshot concurrency'],
  'NOTIFICATION-MUTATIONS': ['Notifications', 'own recipient', 'Read/read-all/deep link', 'NOT_RUN', 'Read/count queried now; shared inbox not marked read. DTO has no trusted resource context for deep links; old owned inbox mutations remain historical'],
  'STOCK-API': ['Stock', 'BRANCH_MANAGER', 'Receipt/count/loss API', 'NOT_RUN', 'Three API-only operations, no stock workspace UI. Source units/cutoff reviewed for backlog; no stock records or business outcomes fabricated'],
  'PUSH-LIVE': ['Notifications', 'own browser/recipient', 'Web Push delivery/subscription', 'BLOCKED_ENV', 'Current real PushConfig.enabled=false; no subscription/provider send authorized or attempted'],
  'AI-PROVIDER': ['Recipe/AI', 'RD_SPECIALIST', 'Generate/extract/AI repair provider', 'NOT_RUN', 'External provider scope/config not verified for live calls; no model output mocked as live success'],
  'ZOOM-PHYSICAL': ['Accessibility', 'all', 'Physical browser200% zoom', 'NOT_RUN', '720x450 reflow equivalent tested; physical browser zoom and assistive technology audit were not executed'],
}
for (const [id, [module, role, flow, status, evidence]] of Object.entries(planned)) state.cases[id] = { module, role, flow, kind: 'happy/unhappy as applicable', prerequisites: 'See evidence and source binding', via: status === 'PASS_ISOLATED' ? 'ISOLATED' : 'SOURCE_REVIEW', assertion: evidence, status, evidence, blocker: status.startsWith('BLOCKED') ? evidence : undefined }
state.entities = [
  ['ingredient', state.ids.ingredient, 'INACTIVE', 'Unused owned fixture; retained history'],
  ['course', state.ids.course, 'PUBLISHED', 'Fresh technical course; retain'],
  ['enrollment', state.ids.enrollment, 'PASSED', 'Do not reset the happy entity for negatives'],
  ['video', state.ids.video, 'UPLOADED/EVALUATED', 'Synthetic technical fixture; retain'],
  ['certificate', state.ids.certificate, 'VALID', 'Technical test data, not human competency evidence'],
  ['reused owned version', state.ids.previewVersion, 'DRAFT', 'Old copy16 edited; current released15 unchanged; rollback17 observed VALIDATED and untouched'],
  ['audit', state.ids.obligationAudit, 'FAILED', 'Synthetic obligation reproduction; retain'],
  ['corrective action', state.ids.obligationAction, 'CLOSED (incorrect historical-pass acceptance)', 'BE G-19 ticket; no SQL reopen or employee removal'],
].map(([type, id, status, next]) => ({ type, id, status, next }))
fs.writeFileSync(file, JSON.stringify(state, null, 2))

const active = Object.entries(state.cases).filter(([, row]) => row.kind !== 'diagnostic')
const statuses = ['PASS_LIVE_UI','PASS_LIVE_API','PASS_ISOLATED','FAIL','BLOCKED_DATA','BLOCKED_ENV','BLOCKED_TIME','BLOCKED_BE','NOT_RUN']
const counts = rows => Object.fromEntries(statuses.map(status => [status, rows.filter(row => row.status === status).length]))
const bindings = {}
const link = (ids, caseId, via = 'LIVE_API') => ids.split(' ').forEach(id => { bindings[id] = { caseId, via } })
link('Auth.Login Auth.Me', 'AUTH-TRAINEE', 'LIVE_UI')
link('Auth.Refresh', 'AUTH-SESSION-FAULTS', 'ISOLATED')
link('Recipes.Get RecipeVersions.Get Courses.Get Enrollments.Get Certificates.Get CorrectiveActions.Get', 'CORE-CHECKPOINT')
link('Enrollments.PracticalVideoContent', 'MEDIA-SOURCE', 'LIVE_UI')
link('Certificates.Mine', 'CERTIFICATE-PERSISTED')
link('BranchLaunchStatus.List Sales.List Sales.Aggregate', 'LAUNCH-SALES-STATE')
link('Pilots.Get Pilots.Evaluation', 'LAUNCH-SALES-STATE')
link('Pilots.Decide', 'PILOT-FINAL')
link('Courses.EligibleTrainers', 'CLASS-BOUND-POSITIVE')
link('BranchAudits.Get', 'SCOPE-DENIAL')
link('Skills.Mine Notifications.Inbox Notifications.UnreadCount Notifications.PushConfig Dashboards.TrainingProgress Dashboards.BranchPerformance Dashboards.CourseEffectiveness', 'REPORTS-UTILITIES')
link('Settings.List Ingredients.Get Ingredients.Update Ingredients.Deactivate', 'CATALOG-INVALID')
link('Ingredients.Create', 'CATALOG-CRUD', 'API_SETUP')
link('Ingredients.List', 'CATALOG-CRUD', 'LIVE_UI')
link('Recipes.List', 'RECIPE-LOOKUP', 'LIVE_UI')
link('Courses.Create CourseModules.Update CourseModules.AddLesson Courses.AddQuestion Courses.ListQuestions Courses.Submit Courses.Return', 'COURSE-REVIEW', 'API_SETUP')
link('Courses.Approve', 'COURSE-REVIEW', 'LIVE_UI')
link('Assignments.Assign Enrollments.Modules Enrollments.CompleteLesson Enrollments.QuizAttempts', 'LEARN-QUIZ', 'API_SETUP')
link('Enrollments.Quiz Enrollments.AttemptQuiz', 'LEARN-QUIZ', 'LIVE_UI')
link('Enrollments.UploadPracticalVideo Enrollments.PracticalVideos Enrollments.EvaluatePractical', 'PRACTICAL-CERTIFICATE', 'LIVE_UI')
link('RecipeVersions.Validate RecipeVersions.Update', 'SOP-VALIDATION-LIVE', 'LIVE_UI')
link('Reports.Compliance', 'REPORT-EXPORT', 'LIVE_UI')
link('BranchAudits.Evidence', 'QUALITY-EVIDENCE', 'LIVE_UI')
link('Sales.Import Sales.ImportResult', 'POS-IMPORT', 'LIVE_UI')
link('BranchAudits.Create CorrectiveActions.RetrainingOptions CorrectiveActions.AssignRetraining', 'RETRAINING-OBLIGATION')
link('CorrectiveActions.Close', 'RETRAINING-OBLIGATION')

function why(operation) {
  if (/^Stock\./.test(operation)) return 'STOCK-API: API-only, outside current UI execution; no stock data written'
  if (/GenerateDraft|ExtractDocument/.test(operation)) return 'AI-PROVIDER: external scope/config unverified; no live provider call'
  if (/Repair/.test(operation)) return 'Manual repair was historical; AI provider not called in current round'
  if (/Notifications\.(Subscribe|Unsubscribe|Mine)/.test(operation)) return 'PUSH-LIVE: runtime disabled; no provider/browser subscription mutation'
  if (/Notifications\.Mark/.test(operation)) return 'NOTIFICATION-MUTATIONS: current inbox read only; historical own inbox mutation evidence separate'
  if (/Pilots\.(Update|Cancel|Start|Create)|BranchLaunchStatus\.(Withdraw|GoLive)|Pilots.GoLive/.test(operation)) return 'Main NEW launch retained LIVE; current round revalidates state, does not recreate or withdraw the chain'
  if (/RecipeVersions\.(Release|Review|Submit|Rollback)|Recipes\.(Create|CreateVersion|Import)/.test(operation)) return 'RECIPE-FULL-LIFECYCLE: not rerun now; owned copy edit only, release/cutover history separate'
  if (/TrainingClasses|TrainingSessions/.test(operation)) return 'CLASS-UNBOUND-LIFECYCLE: prior class closed; bound-SOP positive blocked by trainer data; isolated UI evidence separate'
  if (/PracticalSchedules|Enrollments\.(Reset|Close)/.test(operation)) return 'PRACTICAL-NEGATIVE-LIFECYCLE: preserve current happy enrollment; prior live negatives and current isolated states separate'
  if (/ImpactAnalysis/.test(operation)) return 'IMPACT-LIFECYCLE: no new preview/commit; no concurrency or stale-snapshot live claim'
  if (/Settings.Update/.test(operation)) return 'SETTINGS-WRITE: no owned company-wide setting fixture; shared config unchanged'
  return 'No dedicated current-round assertion for this operation/variant. Source inventory classified; prior results and observed HTTP alone are not a current behavioral PASS.'
}
function uiBinding(operation) {
  const found = []
  for (const r of catalog.resources) {
    for (const key of ['list','detail','create','update']) if (r[key] === operation) found.push(r.key + ':' + key)
    for (const a of r.actions ?? []) if (a.operation === operation) found.push(r.key + ':modal/action')
  }
  for (const r of catalog.reportPages) if (r.operation === operation) found.push(r.key + ':report')
  return found.join(', ') || (/^Stock\./.test(operation) ? 'API-only; no stock route/menu' : 'special component/background/API; see router and registry')
}
const inventory = Object.entries(catalog.endpoints).map(([operation, endpoint]) => {
  const binding = bindings[operation], row = state.cases[binding?.caseId]
  let status = row?.status ?? 'NOT_RUN'
  // The G-19 close outcome fails; audit creation and assignment themselves succeeded.
  if (binding?.caseId === 'RETRAINING-OBLIGATION' && operation !== 'CorrectiveActions.Close') status = operation === 'CorrectiveActions.RetrainingOptions' ? 'NOT_RUN' : 'PASS_LIVE_API'
  if (status === 'PASS_LIVE_UI' && binding?.via !== 'LIVE_UI') status = 'PASS_LIVE_API'
  if (operation === 'Auth.Refresh') status = 'PASS_ISOLATED'
  return { operation, method: endpoint.method, path: endpoint.path, roles: endpoint.roles, binding: uiBinding(operation), status, via: binding?.via ?? '', caseId: binding?.caseId ?? '', evidence: status === 'NOT_RUN' ? why(operation) : row?.assertion, observedHttp: observations[operation]?.statuses ?? [] }
})
const templates = new Map()
for (const r of catalog.resources) { templates.set(r.key, r.list); if (r.detail) templates.set(r.key + '/:id', r.detail) }
for (const r of catalog.reportPages) templates.set(r.key, r.operation)
for (const match of fs.readFileSync('src/app/router.tsx','utf8').matchAll(/path\s*:\s*['"]([^'"]+)['"]/g)) if (!templates.has(match[1])) templates.set(match[1], '')
const routeCase = { '/':'LAND-ANCHOR','/login':'AUTH-INVALID','dashboard':'AUTH-TRAINEE','users':'AUTH-ADMIN','recipes':'RECIPE-LOOKUP','courses':'AUTH-TRAINER','courses/pending':'AUTH-RD_MANAGER','assignments':'AUTH-TRAINING_MANAGER','learning':'AUTH-TRAINEE','branches':'AUTH-BRANCH_MANAGER','branch-audits':'AUTH-QUALITY_AUDITOR','account':'AUTH-TRAINEE','ingredients':'CATALOG-CRUD','courses/:id':'COURSE-REVIEW','learning/:id':'LEARN-QUIZ','learning/:id/quiz':'LEARN-QUIZ','assessment/:id':'PRACTICAL-CERTIFICATE','certificates':'CERTIFICATE-PERSISTED','enrollments/:id':'LEARN-SUMMARY','videos/:id':'MEDIA-SOURCE','versions/:id':'SOP-VALIDATION-LIVE','compliance':'REPORT-EXPORT','branch-audits/:id':'QUALITY-EVIDENCE','sales':'POS-IMPORT','sales/import/:jobId':'POS-IMPORT' }
const routes = [...templates].map(([path, operation]) => { const caseId = routeCase[path], row = state.cases[caseId]; return { path, operation, caseId, status: row ? 'PASS_LIVE_UI' : 'NOT_RUN', evidence: row ? 'Selected role/variant from ' + caseId + '; not all role-prefix combinations' : 'No dedicated current browser assertion; API/isolated capability evidence does not prove route execution' } })
const clean = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const table = (headers, rows) => ['| ' + headers.join(' | ') + ' |','| ' + headers.map(()=>'---').join(' | ') + ' |',...rows.map(row=>'| ' + row.map(clean).join(' | ') + ' |')]
const summary = { runId: state.runId, flowCounts: counts(active.map(([,r])=>r)), operationCounts: counts(inventory), routeCounts: counts(routes), flowTotal: active.length, operationTotal: inventory.length, routeTotal: routes.length }
const lines = ['# Current BrewForge flow coverage — post-landing review 04/11/2026','',`Run ${state.runId}; FE dc5c06a / branch feat/train; BE source33e2ed2. Current evidence only; earlier61 cases are historical in final-flow-report.md.`, '',`**${active.length} named case groups:** ${JSON.stringify(summary.flowCounts)}. **${inventory.length} API operations** and **${routes.length} route templates** are separate denominators and are not added to case counts.`, '', 'Cases bundle prerequisites and meaningful outcomes; viewport/click/HTTP counts are not extra workflows. Technical regression groups do not prove live business persistence. FAIL G-19 is retained, not changed to expected success.', '', '## Current case registry','',...table(['Case ID','Module','Role/scope','Flow/action','Happy/unhappy','Prerequisites','UI/API','Assertion','Status','Evidence','Blocker'],active.map(([id,r])=>[id,r.module,r.role,r.flow,r.kind,r.prerequisites,r.via,r.assertion,r.status,r.evidence,r.blocker])), '', '## Every registered API capability / modal-action binding','',`Counts: ${JSON.stringify(summary.operationCounts)}. PASS applies only to the linked variant and explicit UI/API_SETUP channel. A blocked prerequisite is not execution of its downstream action. Observed HTTP is metadata, not proof.`, '',...table(['Operation','Method/path','Allowed roles','UI/menu/action binding','Channel','Current status','Case/evidence','Observed HTTP'],inventory.map(r=>[r.operation,r.method+' '+r.path,r.roles.join(', '),r.binding,r.via,r.status,(r.caseId?r.caseId+': ':'')+r.evidence,r.observedHttp.join(', ')])), '', '## Menu/detail/deep-link router templates','', 'Protected templates expand under controller-permitted role prefixes. This inventory includes public routes, dynamic resource lists/details, reports and special pages. Index routes redirect to dashboard; wildcard/error routes remain explicit. No claim covers every concrete role/route permutation.', '',...table(['Template','Resource operation if generated','Current status','Case/limit'],routes.map(r=>[r.path,r.operation,r.status,(r.caseId??'')+' '+r.evidence])), '', '## Diagnostics kept separate','',...Object.entries(state.cases).filter(([,r])=>r.kind==='diagnostic').map(([id,r])=>`- ${id}: historical ${r.status}. ${r.evidence}`), '', 'Source: src/app/router.tsx, workspace/resources.ts, generated schema/contracts, checked-in business-readiness.json and current controller policies. Background/session and upload/download/media cases are in the named registry. Stock has3 API-only operations and no UI. No fictitious PDF, notification context or offline subsystem was added.', '']
fs.writeFileSync('docs/final-flow-coverage.md',lines.join('\n'))
fs.writeFileSync('e2e-private/product-review-inventory.json',JSON.stringify({summary,inventory,routes},null,2))
console.log(JSON.stringify(summary))
