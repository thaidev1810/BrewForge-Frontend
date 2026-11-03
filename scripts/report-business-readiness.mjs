import fs from 'node:fs'
const catalog = JSON.parse(fs.readFileSync('e2e/fixtures/business-readiness.json', 'utf8'))
const runtime = JSON.parse(fs.readFileSync('e2e-private/business-results.json', 'utf8'))
const labels = ['READY','FE BUG','BE BLOCKED','PERMISSION BLOCKED','DATA BLOCKED','SAFETY BLOCKED','NOT IMPLEMENTED']
const count = rows => Object.fromEntries(labels.map(label => [label, rows.filter(row => row.status === label).length]))
const escape = value => String(value ?? '—').replaceAll('|','/').replaceAll('\n',' ')
const table = rows => ['| Role | Page | Chức năng | Endpoint | Method | Permission | Trạng thái FE | Trạng thái API | Khả năng demo | Lý do / phạm vi |','| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',...rows.map(row => '| '+[row.role,row.page,row.feature,row.endpoint,row.method,row.permission,row.fe,row.api,row.status,row.reason].map(escape).join(' | ')+' |')].join('\n')
const staticRows = []
const dashboardOperations = { ADMIN: 'Users.List', RD_SPECIALIST: 'Recipes.List', RD_MANAGER: 'Pilots.List', TRAINER: 'Assignments.List', TRAINING_MANAGER: 'Courses.List', TRAINEE: 'Enrollments.Mine', BRANCH_MANAGER: 'Skills.Employees', QUALITY_AUDITOR: 'BranchAudits.Summary' }
const special = { account:'Auth.Me',notifications:'Notifications.Inbox',push:'Notifications.PushConfig',impact:'ImpactAnalysis.Analyze',trace:'AuditLog.Trace',compliance:'Reports.Compliance','sales-analytics':'Sales.Aggregate','learning-path':'LearningPath.Get','courses/pending':'Courses.List' }
for (const role of catalog.roles) for (const menu of role.menu) {
  const resource = catalog.resources.find(item => item.key === menu.key)
  const report = catalog.reportPages.find(item => item.key === menu.key)
  const operations = resource ? [['List',resource.list],['Detail',resource.detail],['Create',resource.create],['Update',resource.update],...(resource.actions ?? []).map(action=>[action.label,action.operation])] : [['Page',menu.key==='dashboard'?dashboardOperations[role.role]:menu.key==='learning-path'&&['TRAINER','TRAINEE'].includes(role.role)?'LearningPath.Mine':special[menu.key]??report?.operation]]
  for (const [feature, operation] of operations.filter(([,operation])=>operation)) {
    const endpoint = catalog.endpoints[operation]
    if (!endpoint) continue
    const observed = runtime.find(row => row.role === role.role && row.operation === operation && row.page === role.prefix + '/' + menu.key && row.status === 'READY' && row.fe.startsWith('Rendered'))
    const permitted = endpoint.roles.includes(role.role)
    staticRows.push({role:role.role,page:role.prefix+'/'+menu.key,feature:menu.title+' · '+feature,operation,endpoint:endpoint.path,method:endpoint.method,permission:permitted?'ALLOW':'DENY',fe:'Route/menu wired in current source',api:observed?.api??'Static contract only',status:!permitted?'PERMISSION BLOCKED':endpoint.method!=='GET'?'SAFETY BLOCKED':operation.startsWith('Pilots.')?'SAFETY BLOCKED':observed?'READY':'SAFETY BLOCKED',reason:!permitted?'Current controller policy excludes this role':endpoint.method!=='GET'?'Business mutation not authorized in this phase':operation.startsWith('Pilots.')?'EndDueAsync may mutate database on GET':observed?'Matching operation exercised live; see runtime table for exact route/sample':'This page/action not validated live; do not infer readiness from source alone'})
  }
}
const gaps = [
  { roles:['TRAINING_MANAGER'], page:'/training-manager/training-progress',feature:'Training manager aggregate progress report',endpoint:'/api/v1/dashboards/training-progress',method:'GET',status:'PERMISSION BLOCKED',reason:'Role excluded from this dashboard contract; assignments/enrollment detail are alternatives, not the same aggregate report.' },
  { roles:['ADMIN','RD_MANAGER','BRANCH_MANAGER'],page:'No stock route',feature:'Stock loss dashboard UI',endpoint:'/api/v1/stock/loss-report',method:'GET',status:'NOT IMPLEMENTED',reason:'Backend StockController exists; frontend has no stock route/menu consumer. API not called in this phase.' },
  { roles:['TRAINER'],page:'Course quiz editor',feature:'Edit/delete existing quiz questions',endpoint:'No verified update/delete question endpoint',method:'—',status:'BE BLOCKED',reason:'Current controller exposes list/add only for course quiz questions. No runtime mutation attempted; question bank editing is a separate feature.' },
  { roles:['TRAINEE','TRAINER'],page:'Certificates',feature:'Certificate PDF export/manual issue',endpoint:'No verified PDF/manual issue endpoint',method:'—',status:'NOT IMPLEMENTED',reason:'Certificate GET exists; PDF/manual issuance does not. Certificates are automatic outcomes, not a UI mutation to invent.' },
  { roles:['TRAINING_MANAGER','BRANCH_MANAGER'],page:'Enrollment review',feature:'Manager practical recording list/summary',endpoint:'/api/v1/enrollments/{id}/practical-videos',method:'GET',status:'PERMISSION BLOCKED',reason:'Current list policy is TRAINEE/TRAINER; manager enrollment progress does not grant practical list/content access.' },
]
const gapRows=gaps.flatMap(gap=>gap.roles.map(role=>({role,page:gap.page,feature:gap.feature,endpoint:gap.endpoint,method:gap.method,permission:gap.status==='PERMISSION BLOCKED'?'DENY':'Not available',fe:'Source reviewed; not a live mutation result',api:'Controller/source evidence only',status:gap.status,reason:gap.reason})))
const counts=count(runtime), inventoryCount=count(staticRows),gapCounts=count(gapRows)
const pages=new Set(runtime.filter(row=>row.fe.startsWith('Rendered')||row.fe.includes('assertion failed')||row.fe.includes('Form rendered')||row.fe.includes('Picker shell')).map(row=>row.role+' '+row.page))
const actualGets=runtime.filter(row=>row.api.startsWith('HTTP '))
const readyPages=new Set(runtime.filter(row=>row.status==='READY'&&row.fe.startsWith('Rendered')).map(row=>row.role+' '+row.page))
const liveBugs=runtime.filter(row=>row.status==='FE BUG'||row.status==='BE BLOCKED')
const lines=[
'# Business workflow readiness — BrewForge','',
'Ngày thực hiện: 2026-11-01 (Asia/Bangkok). Scope: real accounts, Chromium headed, 1 worker, GET allowlist, no mock API, no business mutation. Chỉ auth login/refresh/logout được POST. Bộ auth và báo cáo auth được giữ riêng, không ghi đè bởi test business.','',
'## Kết quả định lượng','',
`- Role đã chạy: ${new Set(runtime.map(row=>row.role)).size}/8. Browser test outcomes chứng minh runner hoàn tất kiểm tra an toàn; không có nghĩa mọi workflow demo đều READY.`,
`- Page/route đã mở để kiểm tra: ${pages.size} (đếm theo role + URL, không bao gồm route chỉ nằm trong source hoặc thiếu ID). ${readyPages.size} route render checks READY.`,
`- Chức năng/check theo role đã phân loại runtime: ${runtime.length}. Real GET probes có status: ${actualGets.length}. Một số check là permission/static safety decision nên không gửi request.`,
...labels.map(label=>`- ${label}: ${counts[label]} runtime checks.`),
`- Inventory toàn bộ menu/router: ${new Set(staticRows.map(row=>row.role+' '+row.page)).size} role-pages, ${staticRows.length} function bindings (source + runtime matching), phân loại ${JSON.stringify(inventoryCount)}. Không cộng inventory vào runtime vì có trùng.`,
`- Gap sản phẩm riêng từ source: ${gapRows.length} role-function rows, phân loại ${JSON.stringify(gapCounts)}. Đây không phải API lỗi quan sát live và không cộng vào số runtime.`,'',
'**READY chỉ áp dụng check đã thực hiện.** `fe=Not opened` là API-only readiness; không chứng minh page hoặc toàn bộ quy trình đã demo thành công. List rỗng có thể READY cho empty state nhưng detail sẽ DATA BLOCKED. PERMISSION BLOCKED gồm nhiều từ chối đúng policy, không đồng nghĩa hàng đó là bug cần mở quyền. SAFETY BLOCKED gồm mutation bị cấm trong lượt này và GET chưa được xét an toàn.','',
'- Lượt xác nhận 01/11: 8/8 browser role tests PASS (1.8 phút), cộng 1 test loading chuyển tiếp GET thật PASS (3.4 giây). Các số PASS này không bao gồm business mutations bị cấm.',
'Loading bổ sung chỉ giữ thời điểm chuyển tiếp request rồi dùng API response thật; không fulfill/mock response. Public role aliases/routes lấy từ source không phải dữ liệu tài khoản ghi từ env. Bộ quét kiểm password, username không công khai và JWT.',
'',
'## Kết quả theo role','',
'| Role | READY | FE BUG | BE BLOCKED | PERMISSION BLOCKED | DATA BLOCKED | SAFETY BLOCKED | NOT IMPLEMENTED |',
'| --- | --- | --- | --- | --- | --- | --- | --- |',
...catalog.roles.map(role=>{const c=count(runtime.filter(row=>row.role===role.role));return '| '+[role.role,...labels.map(label=>c[label])].join(' | ')+' |'}),'',
'## Giai đoạn A — bảng page, chức năng, endpoint và permission','',
'Inventory cho cả 8 role và mọi menu/action binding: [business-workflow-matrix.md](business-workflow-matrix.md). Từng dòng ghi role, page, chức năng, endpoint/method, permission, FE/API state, khả năng demo và lý do. Các menu ngoài allowlist được khảo sát tĩnh, không gọi API. Nguồn: router/navigation/resources/schema và controller/service. Bản business-api-contracts.md cũ tự ghi “Historical reference only”; không dùng mock DTO/status cũ làm contract hiện hành.','',
'Đã đọc/đối chiếu các cập nhật và giới hạn trong business-api-contracts.md, implementation-plan.md, implementation-status.md, demo-readiness.md, integration-gaps.md, page-function-guide.md; nhật ký nguồn/GET allowlist tại [business-readiness-source-review.md](business-readiness-source-review.md). Các số liệu fixture/READY_STATIC lịch sử không được tính thành runtime hôm nay.','',
'## Giai đoạn B — RD_MANAGER','',
'### Pilot listing/readiness','',
'- `GET /api/v1/pilots` → PilotService.ListAsync → EndDueAsync (line 70).',
'- `GET /api/v1/pilots/{id}`, `/{id}/readiness`, `/{id}/evaluation` → FindAsync → EndDueAsync (line 319). EndDueAsync (285–295) có thể End(), Audit(), SaveChangesAsync().',
'- Không tìm được API listing pilot riêng có read path thuần đọc trong controller hiện tại. Không gửi các GET pilot, kể cả khi có ID. Dashboard RD_MANAGER phụ thuộc Pilots.List nên vẫn SAFETY BLOCKED cho số liệu pilot.',
'- **Có phương án chỉ đọc cho coverage chi nhánh:** `GET /api/v1/branch-launch-status`, LaunchStatusService.ListAsync → AsNoTracking/ToDtosAsync, không SaveChanges/EndDue. Đã thử với RD_MANAGER và BRANCH_MANAGER khi được phép; xem bảng runtime. Nó không phải pilot listing và không chứng minh pilot evaluation/decision.',
'### Course approval','',
'| Mục | Expected trước đây | Actual hiện hành | Kết luận |',
'| --- | --- | --- | --- |',
'| Người duyệt course | Changelog 03/11/2026 và source controller hiện tại | `CoursesController.cs` áp dụng `Policies.RdManager` cho POST approve/return; HEAD `08dd10a` test `CourseApiTests` xác nhận TRAINING_MANAGER bị 403 và RD_MANAGER được phép | RD_MANAGER là role review hiện hành theo code; TRAINING_MANAGER không có policy này. Không có mutation runtime trong báo cáo read-only. |',
'| FE menu/route | Metadata source-derived | `Courses.Approve`/`Return` roles RD_MANAGER; router/menu dùng `canCall`, RD_MANAGER vào pending route, TRAINING_MANAGER được redirect về dashboard | Contract static đã đồng bộ; live UI/API approval chưa được kiểm thử bằng mutation. |',
'| Workflow | Trainer biên soạn DRAFT → Submit PENDING_APPROVAL → RD_MANAGER Approve PUBLISHED hoặc Return DRAFT | Đã xác minh controller/service/test source; không gửi approve/return trong scope read-only. RD duyệt/phát hành SOP là workflow khác. |','',
'File liên quan: ../backend/src/BrewForge.Api/Controllers/CoursesController.cs; ../backend/tests/BrewForge.Api.Tests/Slice4/CourseApiTests.cs; ../backend/src/BrewForge.Api/Auth/Policies.cs; src/services/backend/schema.ts Courses.Approve/Return; src/app/router.tsx courses/pending; src/constants/navigation.ts. Source evidence không phải live permission E2E.','',
'## Giai đoạn C — bằng chứng runtime chi tiết','',table(runtime),'',
'## Giai đoạn D — Frontend','',
`- Loading: ${runtime.filter(row=>row.observed?.loading).length} lần quan sát LoadingState rồi chờ biến mất. Nếu request quá nhanh không thấy loading thì không giả lập để đánh PASS.`,
`- Empty/filter: ${runtime.filter(row=>row.observed?.empty).length} check ghi nhận empty; search dùng GET thật với chuỗi không khớp, không tạo dữ liệu.`,
`- Pagination: ${runtime.filter(row=>row.observed?.pagination).length} check xác nhận response page=2/size=1/items. UI paging/page-size chỉ được tính nơi có ghi bằng chứng; không suy API paging là toàn bộ UX paging.`,
`- Responsive: ${runtime.filter(row=>row.observed?.responsive===true).length} route sample kiểm mobile390px, drawer mở/đóng/Escape, không horizontal overflow; desktop dùng Chromium. Không khẳng định mọi màn hình/tablet đã kiểm.`,
`- Form/filter validation: ${runtime.filter(row=>row.observed?.validation).length} check. Mở dialog, kiểm field và gọi đúng validator hiện có với input rỗng trong browser; không submit form thay đổi. Filter date range là form GET và bị chặn local khi from>to.`,
'- Detail pages dùng ID từ authorized response của cùng role. Nếu thiếu dữ liệu hoặc role không có list để tìm ID, giữ DATA BLOCKED; không dò ID hoặc mượn dữ liệu role khác để vượt ownership.',
'- API error state: ErrorState/Retry/ProblemDetails được đối chiếu source; không dựng mock lỗi/abort giả để chứng minh UI. Chỉ report lỗi thật nếu quan sát, và không khẳng định toàn bộ error recovery đã E2E.',
'- Response mapping: list/detail render checks dựa trên GET thật và việc không xuất hiện runtime/error/loading treo. Đây là smoke mapping; không đối chiếu mọi field/locale/mọi row của database.',
'- Role navigation: menu/guards đã có auth E2E; readiness áp dụng controller roles trước mọi GET. Không có quyền thì không gửi request.',
'- Không sửa source ứng dụng khi chưa chứng minh được nguyên nhân FE bug. Lượt này tập trung test harness và report; không sửa backend/database/seed.','',
'## Gap và các bước demo chưa thể chạy','',table(gapRows),'',
'- Audit list không có bản ghi ở các role được phép thì audit detail/evidence là DATA BLOCKED. Không upload ảnh hoặc tạo audit để lấp dữ liệu. Evidence không có standalone list API; URL lấy từ audit.items.evidenceUrl và chỉ mở endpoint nội bộ đã xác minh.',
'- Quiz learner chỉ được GET khi enrollment sở hữu có eligibility hợp lệ. Không hoàn thành lesson, nộp quiz, đổi enrollment state hoặc bypass quiz/practical gate để tạo điều kiện.',
'- BR-34 giữ nguyên: trainer phải có certificate VALID trên đúng SOP version cho khóa product; eligible-trainers/service checks là căn cứ, role TRAINER đơn lẻ không đủ. Chưa demo tạo lớp/lịch/thực hành nên không tuyên bố trainer đã đủ chứng chỉ.',
'- Chưa chạy chuỗi ghi thực tế: recipe author → validate/review/release SOP → trainer create/submit course → TM approve → assign/path assign → read completion/quiz → practical → certificate → pilot start/go-live/decision → audit/retraining/close. Các bước này bị loại do yêu cầu không ghi dữ liệu, không phải đã PASS.',
'- Corrective action học lại theo cycle: tài liệu hiện hành ghi thiếu relation/action–employee–enrollment cycle bền vững; PASSED cũ có thể thỏa close. Chỉ source finding; không gửi retrain/close để thử.',
'- Không chứng minh migrations/build hash của tiến trình BE đang chạy chỉ từ GET200. Runtime phản ánh API tại thời điểm kiểm thử, source là bằng chứng implementation độc lập.','',
'## Chạy lại và bảo vệ dữ liệu','',
'```powershell',
'node scripts/prepare-business-readiness.mjs',
'npm.cmd exec tsc -- --project e2e/tsconfig.json --noEmit',
'npm.cmd exec playwright -- test --config=playwright.business.config.ts --project=chromium --workers=1',
'node scripts/report-business-readiness.mjs',
'```','',
'- Credentials chỉ từ .env.e2e.local qua helper auth sẵn có. Không ghi username/password/token/response body vào báo cáo. Không export storage state, không dùng mock login/API.',
'- Artifact business ở business-test-results/; kết quả cấu trúc đã loại payload ở e2e-private/business-results.json. Hai thư mục ignore Git, không ghi đè artifact auth. Chỉ screenshot che toàn trang nếu có FE/BE failure; trace đầy đủ tắt để tránh token/body/DOM.',
'- READINESS suite pass nghĩa các assertion an toàn hoàn tất; blocked features vẫn được giữ trạng thái blocked trong báo cáo, không bị chuyển READY.',
'- git diff/status đã được kiểm tra cuối lượt; thay đổi cũ trong schema/contracts/app và repository khác không bị reset/ghi đè.',''
]
fs.writeFileSync('docs/business-workflow-readiness.md', lines.join('\n'))
fs.writeFileSync('docs/business-workflow-matrix.md', '# Business workflow source inventory — all eight roles\n\nSource inventory only unless an exact live check is cited. SAFE blocks on untested reads mean not verified in this scope, not a backend defect. Write operations are not executed. Detail bindings may require IDs; see runtime report for data blockers.\n\n'+table(staticRows)+'\n')
console.log(JSON.stringify({ runtimeChecks: runtime.length, pagesOpened: pages.size, runtime: counts, inventoryRolePages: new Set(staticRows.map(row=>row.role+' '+row.page)).size, inventoryFunctions: staticRows.length, staticGapFunctions:gapRows.length, liveBugs:liveBugs.length }))



