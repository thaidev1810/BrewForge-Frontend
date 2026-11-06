import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const root='ui-test-results/OPS_20261106'
const rows=[]
function walk(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,e.name);if(e.isDirectory())walk(file);else if(e.name==='evidence.json'){const row=JSON.parse(fs.readFileSync(file,'utf8'));for(const capture of Object.values(row.phases)){capture.file=path.join(folder,capture.screenshot).replaceAll('\\','/');const bytes=fs.readFileSync(capture.file);if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid image');capture.sha256=crypto.createHash('sha256').update(bytes).digest('hex')}rows.push(row)}}}
walk(root);rows.sort((a,b)=>(a.caseId+a.viewport.width).localeCompare(b.caseId+b.viewport.width))
const summary={runId:'OPS_20261106',cases:new Set(rows.map(r=>r.caseId)).size,viewportRecords:rows.length,pairs:rows.filter(r=>r.phases.before&&r.phases.after?.result==='PASS').length,pngs:rows.reduce((n,r)=>n+Object.keys(r.phases).length,0)}
fs.writeFileSync(root+'/evidence-index.json',JSON.stringify({summary,rows},null,2))
const known=JSON.parse(fs.readFileSync('e2e-private/product-review.json','utf8')).cases['RETRAINING-OBLIGATION']
fs.writeFileSync(root+'/known-be-g19.json',JSON.stringify({status:known.status,assertion:known.assertion,scope:'Current real Auth.Me/owned enrollment/certificate/action read verified; historical CLOSED regression retained. Original close observation was in the earlier review; no new close or audit this round.'},null,2))
const rawChanges=JSON.parse(fs.readFileSync(root+'/content-changes.json','utf8'))
const queries=[
 ['beverage operations training editorial','design-system','Hero/Features/CTA off-topic; rejected. Minimalism/Swiss whitespace considered only as general guidance. Pink palette not applied.'],
 ['enterprise operations workspace','design-system retry','Still marketing pattern; no verified workspace composition match. User direction and existing semantic tokens govern. Blue palette not applied; no MASTER persisted.'],
 ['error messages recovery','ux','Error Messages / Error Recovery / Confirmation Messages: verified; announce, explain next step, distinguish partial result.'],
 ['form helper progressive disclosure','ux','Submit Feedback / Form Labels verified. Unrelated heading result not used.'],
 ['visual hierarchy whitespace → content priority','ux + one retry','Top Hover States then Truncation do not establish the requested hierarchy. No verified match; use explicit user direction and SKILL Quick Reference visual hierarchy.'],
 ['navigation grouping → navigation menu','ux + one retry','Top Sticky Navigation does not establish grouping. No verified grouping match; preserve existing role groups, keyboard behavior and route policy.'],
 ['table handling','ux','Table Handling verified: internal horizontal scroll and bounded page width.'],
 ['controlled form state focus','react','Manage focus properly / Controlled components verified. Existing mounted state and focus lifecycle retained.'],
]
fs.writeFileSync(root+'/search-review.json',JSON.stringify({interpreter:'Python 3.12.10, supplied absolute executable',status:'EXECUTED_REVIEWED',queries},null,2))
const shot=(row,phase)=>row.phases[phase]?`[${phase}](../${row.phases[phase].file})`:'—'
const lines=[
 '# BrewForge — cải tổ nội dung và workspace, 06/11/2026','',
 `Run **${summary.runId}**: **${summary.pairs} cặp before/after**, **${summary.pngs} PNG**, ${summary.viewportRecords} role/viewport records, ${summary.cases} case IDs. Bốn viewport1440/768/390/360 px được tính là bằng chứng responsive, không phải bốn luồng nghiệp vụ.`,
 '', 'Đã triển khai hướng **“Sổ tay vận hành của chuỗi đồ uống chuyên nghiệp”**: dashboard theo nhiệm vụ8 role; phân cấp tiêu đề và sổ đối chiếu thay ba stat card lặp lại; table/form/detail dùng chữ rõ, đường kẻ và bề mặt ít bo; hướng dẫn bình thường trung tính. Landing, thương hiệu và luồng nghiệp vụ giữ nguyên. Đây là heuristic review theo tác vụ, **chưa usability-test với người dùng không chuyên**.',
 '', '## Kết quả kiểm thử','',
 '- Final selected runs: isolated11/11 pass; live configuration33 wrappers:31 pass,1 G-19 FAIL,1 actual-zoom skip. Tổng44 wrappers:42 pass/1 FAIL/1 skip; có fault injection riêng trong cấu hình live, không gọi các ca đó là BE pass.',
 '- Typecheck, lint, E2E TS, Node93 + content12, build pass. Browser authoring74, session11, public5 pass. Không phát hiện regression trong phạm vi đã chạy; không suy build pass thành không có bug mới.',
 '- API thật:8 role login, scoped pages, F5; ingredient409 và API400 giữ dữ liệu đã lưu; protected image/video decode; POS partial result đã lưu; lộ trình GET200 và dialog thật; lịch trên lần học PASSED vẫn không cho đặt mới. Không tạo assignment cho tài khoản dùng chung hoặc lịch mới trên lần học đã đạt.',
 '- Pilot assignment result/double-submit/pending và lịch đủ điều kiện dùng transport isolated, đánh dấu rõ. Chưa có owned eligible enrollment để chứng minh đặt lịch mới live trong lượt này. Không thay response mock để chứng minh BE pass.',
 '- [G-19](../'+root+'/known-be-g19.json) giữ FAIL từ nghĩa vụ cũ; đọc action đã CLOSED, không tạo audit/close lại. Không thay assertion/gate/BE. Physical browser200% zoom NOT_RUN vì accelerator không thay DPR/layout; responsive resize không được gọi là zoom pass.',
 '', '## Skill và lựa chọn thiết kế','',
 'Đã đọc [UI UX Pro Max](../.agents/skills/ui-ux-pro-max/SKILL.md), dùng executable Python312 người dùng cung cấp chạy search.py thật trước các sửa đổi. Không cài thêm gói/framework. Không có MASTER/page override áp dụng được tìm thấy; không ghi đè/generate MASTER bằng force. [Log review](../'+root+'/search-review.json).',
 '', '| Query | Mode | Đánh giá và áp dụng |','| --- | --- | --- |',...queries.map(q=>`| ${q[0]} | ${q[1]} | ${q[2]} |`),
 '', '## Pilot và mở rộng','',
 '| Nhóm | Thay đổi và nguồn nghiệp vụ | Kiểm hiểu/behavior |','| --- | --- | --- |',
 '| Giao lộ trình | Bỏ BE/AVAILABLE/path/enrollmentIds; có người nhận, điều kiện mở, nút Giao khóa học; receipt theo khóa và số lần học mới. LearningPathService/PathAssignmentDto. | Biết khóa nào được xét và vì sao khóa khác còn chờ; không ghép ID mới với người/khóa bằng suy đoán; pending chặn gửi đôi, kết quả giữ blocked stage. |',
 '| Lịch thực hành | Lý do theo PASSED/CLOSED/LOCKED/thiếu điều kiện/quiz/lịch đang mở; giờ địa phương và địa điểm, Lưu lịch thực hành; appointment record thay DataView chung. PracticalScheduleService + Domain/PracticalSchedule. | Không cần hiểu ELIGIBLE/ISO; không mở gate hoặc tự cấp chứng chỉ; trainer/learner vẫn giữ quyền cũ. |',
 '| Lỗi/biểu mẫu | Mapping operation/rule/field; field label và dòng1-based; focus summary/field; raw exception không echo; code/rule/trace vào disclosure. ErrorEnvelope/FieldErrors + validator hiện hành. | Required nêu phải nhập gì;400/409/network giữ draft; nested quantity đưa đúng input của bước2, nguyên liệu1; Escape/dirty/return focus và refetch giữ nguyên. |',
 '| Vai trò và navigation | Task board8 role, link từ route hiện có và kiểm lại với sidebar được phép; learner ưu tiên lần học mở/hạn gần, đã đạt đi kết quả. Không fake metric. | Mục đích/next step hiện ngay đầu trang; số liệu chỉ nói đúng trang/dữ liệu nhận được; có đường mở danh sách đầy đủ. |',
 '| Kết quả/tri thức | Assignment/retraining tách giao mới/đã có/chưa giao; POS receipt có số nhận/từ chối/thay thế, lý do theo dòng; tệp CSV mẫu đúng PosImportLine.Columns. | Không suy người mới từ enrollmentIds; giữ partial, replay và cùng file/key khi retry có chủ ý. Không nhập thêm POS để làm đẹp dữ liệu. |',
 '| Các consumer | PageHeader, DataView, ContractFields, resource sort labels, course readiness, trainer eligibility, inbox, login/bootstrap dùng presentation chung. | Raw code hợp đồng không đổi; subject/template xác minh mới dịch, authored/free text giữ nguyên; không tạo deep link từ chuỗi thông báo. |',
 '', '## Bảng audit nội dung cũ → mới','',
 'Các câu dưới đây là source UI tĩnh đã rà theo ngữ cảnh; không phải dữ liệu riêng của API. Contract được giữ nguyên. [Glossary và quy tắc](../../docs/content-guidelines.md).',
 '', '| Route/component | Câu đang hiển thị trước sửa | Ai đọc / vấn đề | Câu thay thế | Nguồn xác minh |','| --- | --- | --- | --- | --- |',
 '| LearningPathPage | BE chỉ giao các khóa AVAILABLE… path và enrollmentIds… | Trainer/TM; yêu cầu hiểu giao thức | Chỉ giao khóa đã mở, chưa có lần học/chứng chỉ; khóa còn thiếu tiên quyết chờ nhóm học trước. | LearningPathService.AssignOpenStagesAsync/PathAssignmentDto |',
 '| PracticalSchedulePanel | ELIGIBLE; gửi API dưới dạng ISO có offset | Trainer/learner; không biết điều kiện và giờ | Hoàn thành học phần/điểm danh, đạt bài kiểm tra lần học hiện tại; hiển thị tên múi giờ và địa điểm. | PracticalSchedule.Create + practicalRules |',
 '| ActionDialog / ContractFields | Trường này bắt buộc; tên field/path thô | Người nhập biểu mẫu; không rõ trường/dòng | Nhập/chọn tên trường; summary có số dòng và link đúng input. | validateRequest + FieldErrors |',
 '| ErrorState | e.message + raw rule/field/code/trace trực tiếp | Mọi role; có thể thấy exception, thiếu recovery | Mapping đã xác minh hoặc fallback trung thực; mã hỗ trợ mở thêm. | ErrorEnvelope, domain codes/rules |',
 '| RoleDashboard | Ba stat card cùng kiểu, một lời chào cho mọi role |8 role; khó biết bắt đầu ở đâu | Task board theo nhiệm vụ và sổ đối chiếu dữ liệu hiện có. | source operation từng role, navigationFor/canCall |',
 '| ResourcePage sort | createdAt, ingredientCode… | Người lọc bảng; raw field names | Ngày tạo, Mã nguyên liệu…; value/query vẫn giữ nguyên. | ResourceSpec.sort + DTO |',
 ...rawChanges.map(c=>`| ${c.file.replace('src/','')} | ${c.old.replaceAll('|','/').replaceAll('\n',' ')} | Consumer của component; thuật ngữ kỹ thuật hoặc hướng dẫn chưa rõ | ${c.next.replaceAll('|','/').replaceAll('\n',' ')} | ${c.source} |`),
 '', '## Bằng chứng ảnh','',
 'Before được chụp thật trước nhóm sửa tương ứng, helper từ chối ghi đè before.png. After chụp sau assertion pass và đồng thời là retest. Các ca baseline chỉ ghi nhận trạng thái thực tế, không được gọi là assertion failure giả. Live25 có retest-only, ghi rõ không có live-before; pilot có cặp isolated. Ảnh dùng fonts-ready, viewport cố định, giảm motion và che PII/token/credentials; không trace/HAR/storageState.',
 '', '| Case | Role | Viewport | Scope | Route | Before | After | Retest-only |','| --- | --- | --- | --- | --- | --- | --- | --- |',
 ...rows.map(r=>`| ${r.caseId} | ${r.role} | ${r.viewport.width}×${r.viewport.height} | ${r.scope} | ${r.routeTemplate} | ${shot(r,'before')} | ${shot(r,'after')} | ${shot(r,'retest')} |`),
 '', '## Inventory, regression và giới hạn','',
 '| Consumer | Đã kiểm | Chưa chứng minh trong lượt này |','| --- | --- | --- |',
 '| Login/session/role guards | actual8 roles/F5; session11; Node bootstrap/cache; isolated401/503; deep link/logout; sidebar/task-link scope | Multi-device/token revocation policy ngoài scope; lần duplicate-me không ổn định ở review trước không bị xóa khỏi lịch sử |',
 '| SOP validate/review | shared74: nested edit, validation link/focus, draft/refetch; actual released version read/images | Không tạo chuỗi release/cutover mới; chưa ánh xạ mọi prose của engine validation bằng dữ liệu live |',
 '| Course return/approve | RD_MANAGER review read/actions vs TM denied; authoring74/Node36; course form/readiness shared | Không approve/return khóa đã công bố chỉ để lấy ảnh; chưa replay toàn bộ lifecycle cũ |',
 '| Assignment/path | pilot before/after; real own path GET/dialog; server endpoint/blocked/dedup fixtures; typed result | Không mutate path tài khoản chung; response assignment cũ thiếu mapping người nhận cho enrollmentIds mới |',
 '| Quiz/practical/certificates | actual learner/trainer read; media decode/play/seek; selected current video/reset/refetch/gates; certificates list; blocked PASSED appointment | Positive booking/save isolated; không có chứng minh năng lực người thật hoặc cấp chứng chỉ mới |',
 '| Pilot/readiness | actual pilot page, readable fields/status labels and task routes | EndDate11/11 còn tương lai; không ép clock/scheduler hoặc quyết định cuối |',
 '| Sales/POS | actual persisted partial accepted1/rejected6; exact CSV template; isolated lost response/same file/key replay/conflict; live ingredient400/409 kiểm feedback | Không nhập POS mới/replay live để thay aggregate; không coi thiếu ngày là0 ly |',
 '| Audit/retraining | actual audit/evidence read; generic fields/partials/trainer reasons; source/Node/isolated conflict; G-19 retained FAIL | Nghĩa vụ mới/cycle cần BE; không chứng nhận CLOSED đồng nghĩa đã học lại đúng nghĩa vụ |',
 '| Inbox/export/admin | template/subject mapping, timestamps, mark/read-all fixture, no guessed links; role desk; shared presentation | Free text giữ nguyên, một số body template chưa có mapping đầy đủ; export/provider delivery và mọi cấu hình/account mutation NOT_RUN |',
 '', '## Các nội dung còn lại và tính trung thực','',
 '- SOP, g/ml/°C, mã đồ uống/chi nhánh cần thiết và tệp header cố định là thuật ngữ/ngữ liệu hợp lệ. Field/enum/type/endpoint trong source và docs kỹ thuật được giữ. Authored course titles/prose có thể chứa từ kỹ thuật; không dịch hoặc sửa dữ liệu chỉ để scanner xanh.',
 '- Unknown field dùng nhãn trung tính và ghi tên thiếu mapping; unknown error không echo server message. Runtime scanner8 role lưu keyword và tên mapping, không lưu body/PII; trong các route đã kiểm không ghi nhận keyword cấm hoặc label thiếu. Đây không phải chứng minh mọi route/data biến thể đều đã được duyệt.',
 '- NotificationDto thiếu resource context đáng tin để tạo deep link. Giữ nội dung tự do như người viết, chỉ dịch template khớp đầy đủ; không AI runtime hoặc suy route từ subject.',
 '- Đây là một visual direction thống nhất, chưa thay mọi màn thành renderer nghiệp vụ riêng. Resource details/history một số nơi vẫn dùng DataView với nhãn đã xử lý; gap được giữ ở backlog thay vì dựng fake dashboard.',
 '- Một số ảnh after của run UIUX cũ được refresh ở regression đầu vòng này; before cũ giữ nguyên. Các lượt sau dùng OPS_REGRESSION_20261106; ảnh OPS hiện tại là bằng chứng cho redesign, không gọi ảnh cũ là nguyên trạng lịch sử.',
 '', '## Môi trường và dữ liệu','',
 '- FE feat/train/4e9b8bb; BE source33e2ed2 sạch/read-only. Root staged/unstaged/untracked và thay đổi FE trước lượt này được giữ; không commit/push/pull/reset/checkout/stash/clean. Không sửa .env/credentials/generated contract, không migration/seed/reset/start BE. Runtime build/schema identity vẫn chưa được chứng minh.',
 '- Không tạo account/course/certificate/audit/POS mới trong vòng cải tổ. Fixture ingredient UIUX261106/19 từ vòng trước vẫn INACTIVE;409 không tạo thêm hàng, API400 giữ brewing window. Các test lỗi mới intercept riêng, không gửi mutation đến BE.',
 '- Isolated FE127.0.0.1:5175 có cache Vite riêng vì Node SSR làm lượt inject-store trước đó không còn điều khiển mounted app. Live UI vẫn localhost:5173/API5113; không thay bằng mock. Sửa driver chỉ đổi nhãn mong đợi sang tiếng Việt hoặc đợi cùng trạng thái thực, giữ assertion field/payload/route/rule/trace/count/dedup/gate.',
 '- Có một retest inbox đỏ do năm rút gọn26 thay vì2026; sửa formatter dùng năm đầy đủ rồi retest pass. Driver ban đầu còn mong raw TECHNIQUE/not certified/skip codes và message cũ; chuyển sang nhãn/lý do tiếng Việt tương ứng, giữ kiểm tra trạng thái disabled, số lượng partial và request thật.',
 '- G-19 ban đầu dừng ở prerequisite vì identity helper đọc store import qua HMR chưa khởi tạo. Thêm stage chẩn đoán an toàn và đổi helper sang Auth.Me thật, không bỏ assertion. Retest đã đi qua ownership/PASSED/certificate và đến đúng nhánh known historical CLOSED regression; đây mới là cơ sở giữ FAIL hiện hành. Không gọi lỗi helper đầu tiên là một tái hiện BE mới.',
 '', '## Tái chạy','',
 'Chạy Node trước browser; server isolated dùng cache riêng. Không chạy before mode lại sau sửa code. Không replay mù mutating lifecycle trên dữ liệu CLOSED/LIVE.',
 '', '```powershell','cd D:\\capstone\\BrewForge\\frontend', '$env:OPS_PHASE="after"','$env:UI_EVIDENCE_PHASE="after"','$env:UI_EVIDENCE_RUN_ID="OPS_REGRESSION_20261106"', '# Isolated: E2E_BASE_URL=http://127.0.0.1:5175; files18,21', '# Live: E2E_BASE_URL=http://localhost:5173; E2E_ALLOW_BUSINESS_WRITES=true; files17,19,20,22,23,24,25', 'node scripts/verify-content.mjs','node scripts/audit-content.mjs','node scripts/report-operations-ui.mjs','node scripts/verify-operations-evidence.mjs','```','',
 'Xem [content guidelines](../../docs/content-guidelines.md), [UI guidelines](../../docs/ui-ux-guidelines.md), [product/BE backlog](product-backlog.md) và [review accessibility trước vòng cải tổ](ui-ux-review-20261106-a11y.md).',''
]
const archive='docs/ui-ux-review-20261106-a11y.md';if(!fs.existsSync(archive))fs.copyFileSync('docs/ui-ux-test-report.md',archive)
fs.writeFileSync('docs/ui-ux-test-report.md',lines.join('\n'))
console.log(JSON.stringify(summary))
