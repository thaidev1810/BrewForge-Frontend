# Kết quả triển khai frontend theo backend

## 22/10/2026 — đồng bộ merge 52be9a7 (ưu tiên hiện hành)

BE HEAD **52be9a7093069e4ac9e1aa8c03ff9d09212a06b3**, merge parents e4e95b4 / b9c4df5. Baseline hiện hành trước đó e4e95b435b9fa71aebdb3008221da1b9774fbf7a chính là first parent; diff 23 file. BE Git sạch, không sửa BE/.env/DB, không chạy startup/migration/seed hoặc authenticated mutation. Không thấy AGENTS.md áp dụng. Giữ mọi thay đổi FE chưa commit trước lượt này.

### FE đã đồng bộ

- Auth giữ sessionStorage token pair atomic, bootstrap/me và 401 single-flight, generation guard/logout chống response cũ, cache reset theo identity/role/branch. Network/timeout khi refresh đánh dấu brewforge.refresh-uncertain.v1 (chỉ flag theo tab, không thêm bản sao token/file); giữ pair nhưng chặn consume lại token cũ kể cả F5, yêu cầu nút xóa phiên/đăng nhập lại. /me network/5xx/403 vẫn có Retry; refresh503 vẫn cho retry, refresh401 clear session. Cờ xóa khi logout/login hoặc rotation thành công cùng generation. Không generic auto-replay mutation; POS có key mới được retry sau refresh.
- Form người dùng tải GET roles thật: loading/empty/error+Retry, chỉ role enum được biết; không thêm trang role CRUD hoặc chuyển dynamic ACL. Login độc lập metadata.
- Corrective action close hiện giải thích server gate khi retrainingRequired, error/details giữ note draft. Không client suy đoán học xong từ certificate cũ. Retraining options/outcomes theo người, reload scope conflict giữ deadline; tracking vẫn dùng stage wire. Stage CLOSED/LOCKED ưu tiên, PASSED→COMPLETED, NEEDS_RECERT không tự biến thành stage; lịch chỉ CreatedAt>=EnrolledAt, overdue tách biệt. Cache reset/retraining/assessment refresh Training/Quality/Coverage/Reports/options hiện có.
- POS dialog giữ cùng File object/key qua manual retry/refetch, input file change tạo submission/key mới, double-submit guard. Khi lỗi giải thích ghi dữ liệu có thể đã xảy ra, retry cùng tệp lấy replay; không khẳng định chưa import, không tự đổi key sau conflict. Không lưu pending/file xuống storage; đóng/reload mất key nên không thể cam kết safe-retry submission cũ qua reload. Kết quả dùng accepted/rejected/replaced/replayed/errors thật.
- Impact empty/header/legacy GET theo server, committed và409 already committed khóa lần gửi tiếp, reload trạng thái; không giả lập stale conflict hoặc auto analyze/commit. Các mutation invalidation giữ luồng hiện có.
- **RD_MANAGER chưa có quyền approve/return course**: chỉ đọc List/Get/Modules. Approve/Return vẫn TRAINING_MANAGER. TRAINING_MANAGER/BRANCH_MANAGER đọc enrollment Get/Modules/Eligibility/QuizAttempts theo scope; không cấp learner completion/quiz submit/video listing/evaluation. Sidebar và trang manager summary giữ giới hạn này.

### Gap và giới hạn phải giữ

G-11 PARTIAL: live active/role đã có; branch/password-reset/access-logout invalidation chưa có. G-09 direct assignment prerequisite đã có, retraining bypass prerequisite và certificate validity check cần BE xác nhận. G-19 PARTIAL: close gate đã có nhưng chấp nhận historical PASSED, chưa có action-cycle relation/API progress obligations. POS idempotency concurrency ledger đã có nếu016 áp dụng; **payload binding/conflict, expiry policy, legacy audit backfill chưa có**. Impact concurrent same-run đã bảo vệ bằng xmin; stale preview snapshot/version chưa có. Không dùng metadata permissions thay policy matrix; RD approval gap vẫn còn.

Môi trường: localhost:5113/openapi/v1.json không truy cập được trong lượt22/10. Chưa chứng minh build52be9a7 hoặc schema014/015/016. Không tự áp dụng migration; ngay cả OpenAPI200 cũng không chứng minh migration. Chưa có account/test environment được cấp cho authenticated mutation; không báo PASS_RUNTIME cho refresh race, POS persistence/race, action close/prerequisite, impact concurrency/legacy. Cần người vận hành triển khai build/schema trên test/demo rồi cấp tài khoản theo role để chạy nghiệp vụ thật.

### Kiểm chứng

Typecheck, lint, production build pass; build còn warning main chunk >500kB (~556kB minified). **92 Node regression checks** (36 integration +36 authoring +20 session) pass với TEST_ONLY adapters; gồm route matrix188, catalogue role read-only, POS cùng payload/key sau lost response, refresh mất response không consume lại, rotation/logout/identity cache. **89 browser checks pass** (72 authoring/UI +12 session +5 public smoke), gồm role picker và POS mất response giữ cùng File/key, replay/row errors; kiểm tra desktop/mobile, refetch draft, F5/deep link, quyền manager/approval. Đã sửa đồng bộ event React trong fixture và chỉ bỏ qua CDP interception hết hiệu lực khi có bằng chứng Network.loadingFailed.canceled; vẫn assert không có lỗi app/giao thức khác. Fixture browser/Node chỉ chứng minh FE, không chứng minh nghiệp vụ BE/DB. Trạng thái: READY_STATIC; PASS_RUNTIME chưa xác minh.


## 20/10/2026 — BE e4e95b4 first parent df8fb9a, delta14files

Đã tái sinh metadata187operations/251types-enums. Retraining dùng ResultDto/results per employee, typed outcomes, lookup IDs/history names, partial outcome không fake success; stale scope giữ modal/deadline và reload options, invalidate Quality/Training/Coverage/Reports/Notifications. PeoplePicker resolve IDs inactive, trainer paged/search300ms/page20. Manager review page `/enrollments/:id` chỉ Get/Modules/Eligibility/QuizAttempts, links từ assignment/TM path, giữ role guard/intended URL/parent active. RD course Get/Modules mở, approve/return vẫn TM. Assessment selected video cũ không còn bật evaluation sau reset/refetch.

Giữ toàn bộ UI/sidebar/tabs/accordion/dirty/auth trước phiên (đang uncommitted), không client/store song song, không đổi .env/dependencies/BE/database. Typecheck/lint/89Node/build pass;70UI/12session/5public Chrome fixtures pass. READY_STATIC, chưa authenticated live E2E; main>500KB warning. Anonymous OpenAPI200 có schema mới, không chứng minh build hash/schema applied.

Còn BE: RD approval nếu muốn đổi role; manager practical summary; persisted retraining action-enrollment-cycle, prerequisite/role gate và close gate. Chi tiết hiện hành ở root current-work.md, api-contract.md và integration-gaps.md; các nhận định cũ về read gaps/array/response bên dưới là lịch sử.

## UI/UX 19/10/2026

Đã nâng shared navigation/layout theo role, desktop collapse/mobile drawer, breadcrumbs và compact detail components. Course tabs/module accordion/quiz outline, learner một bài/danh mục, SOP step+validation links, class session/attendance tabs+local paging, audit fail-first/evidence, corrective retraining và learning path collapsible đã dùng API hiện có. Dirty modal/quiz, tab keyboard, focus lỗi, form dài và long text cải thiện; không đổi auth/API/business rules/dependencies.

Typecheck/lint/86Node/build pass; Chrome59UI-authoring +12session +5public smoke. Tests cô lập BE, chưa live authenticated E2E; warning main>500KB. Các scope/backend gaps tại root docs/current-work.md và integration-gaps.md là nguồn hiện hành. RD review chưa được BE cấp quyền, class chưa có roster endpoint riêng và SOP GET chưa có validation history.

## 19/10/2026 — auth persistence hoàn thành, RD review bị chặn BE

sessionStorage token pair/version, AuthBootstrap fresh /me + single-flight refresh/StrictMode, atomic rotation, recovery Retry, generation guards và clear mọi cache khi logout/account/scope đổi đã tích hợp. Route giữ path/query/hash, return URL nội bộ theo capability role. Login/logout/header/guard/API client và legacy reducers cập nhật, không persist user hoặc dữ liệu server.

RD_MANAGER vẫn chỉ course list theo controller; detail/modules/approve/return chưa được cấp. Giữ TM approval hiện hành và không thêm RD approval giả. Full contract regenerated vẫn187operations/248types-enums. BE chỉ đọc, không startup/migration/DB mutations.

Validation: typecheck/lint/test86checks/build; Chrome session12, authoring30 và public smoke5. Các auth/business browser responses đều fixtures chặn BE, chưa live authenticated E2E; warning main bundle>500KB. Chi tiết hiện hành tại ../docs/current-work.md và integration-gaps.md ở root workspace.

## 19/10/2026 — learning flow, working tree BE trên `6ef17b0`

Giữ thay đổi FE trước phiên; BE nhiều staged changes và unmerged index, **không sửa BE**. Đã đọc drawio XML và đối chiếu controller→DTO/service/domain/filters/tests/OpenAPI. Điểm khác sơ đồ: duyệt khóa vẫn TRAINING_MANAGER, không RD_MANAGER. Generator187operations/248types-enums; live OpenAPI187operations/148paths chỉ xác minh kỹ thuật.

Đã code: learner lesson CTA/read IDs/counts/media, bỏ complete-module CTA; fail/reset refetch progress/current-cycle; learner/manager learning path + scoped user picker + explicit assign + link enrollment thật; TM pending courses; trainer cancel class/reason; notification inbox/bell/count/read/read-all và cache; trainer branch/default/filter/lookup theo identity. Giữ practical ownership/BR-34/cert server, lỗi metadata/dialog/refetch/auth và no unsafe replay. Bell/inbox không phụ thuộc Push permission, không đoán deep link khi DTO thiếu context.

Cache Training mutations làm mới path/progress/coverage/quality/notifications; Users.Create refresh path/inbox qua cache, không gọi auto-assign ở FE. Hủy lớp không tự đóng enrollment client; response/refetch quyết định. Backend chưa enforce lesson-only vì module endpoint cũ còn; G-26 old schedule/certificate, retrain SOP enforcement/report, manager read scopes và G-06 vẫn cần BE.

Kết quả kiểm tra cuối tại [current-work](../../docs/current-work.md). Business live E2E chưa chạy, migrations/DB/merge/build hash chưa xác minh; không coi fixtures hoặc OpenAPI là PASS_RUNTIME nghiệp vụ.

## Phiên 16/10/2026 — BE `6ef17b0`, ưu tiên hiện hành

Đã sinh163operations/212types-enums và trực tiếp tích hợp stage/isOverdue/enrollmentState, filter stage+overdue, badge/sort/paging không dùng status cũ. Practical eligibility vẫn dùng enrollment+current attempts/schedules; không tính stage thay BE. G-26 còn câu hỏi lịch/cert cũ sau reset, không chứng nhận đã sửa đầy đủ.

PeoplePicker dùng GET users/lookup cho assignment/audit/class roster/userId, server search debounce300ms/page20/total/role/branch/active; giữ tên/chọn qua trang, clear theo scope. Session create/edit dùng course eligible-trainers, chọn trainer khác nếu server eligible, hiển thị lý do ineligible/BR-34; không own-only/default-self. API trainer chưa search/page; không giả capability.

Auditor retraining chuyển sang GET corrective-actions/{id}/retraining-options; giữ course/version/action employeeIds constraints ở UI và kết quả enrollmentIds/alreadyEnrolled thật. Không Trace fallback hoặc CertifiedStaff roster. Audit mới chọn nhân viên active đúng branch qua directory. POST vẫn cần BE enforce SOP relation và báo inactive-skipped nếu muốn report đầy đủ. Không mở RD_MANAGER course detail hay TM/BM enrollment detail khi controller chưa cấp quyền; G-06 vẫn role matrix.

Giữ ServerError metadata/unwrap/Vietnamese, dialog qua refetch, quiz answer picker/course preflight và no unsafe mutation replay. Cache cập nhật tracking/coverage/options sau các training/quality/user mutations. Regression suite56Node + browser TEST_ONLY; trạng thái kiểm tra cuối và business runtime chưa chạy tại [current-work](../../docs/current-work.md). Không sửa BE hoặc DB; OpenAPI163/125 chỉ kiểm chứng kỹ thuật.

## Phiên tích hợp BE `f7c43d5` — ưu tiên hiện hành

Đã trực tiếp sửa FE-01 serialized errors và FE-02 background-refetch dialog; thêm scoped cache invalidation và focus/reconnect/mount refresh. User deactivate/move branch invalidate Coverage theo server fix active/recount. Course có readiness/thiếu text từng lesson/duration và SOP-vs-instructor labels; **MIXED mọi lesson cần prose**, không chỉ một lesson đã sửa. Quiz default2 lựa chọn, correct answer select, đổi/xóa keys clear stale answer. Save giữ draft khi lỗi và chặn double submit; không đổi policy BE.

Impact empty dùng persisted header: detail/GET/commit được, UI committed/409 không gửi lặp; cần migration006, chưa xác minh đã applied. Auditor retraining mở giới hạn từ action có named staff + audit→trace published courses; không dùng certificate history làm active roster, không gọi ADMIN/users, full lookup vẫn thiếu. BR-34 notice hiển thị cho trainer session; không lọc certificate khi không có dữ liệu.

BE G-01/G-02/G-03/G-25/G-17/G-18/G-10/G-15/EF-01 đã đọc code, **chưa runtime nghiệp vụ**. G-26 vẫn chưa sửa. Swagger/OpenAPI200 chỉ chứng minh tài liệu kỹ thuật, không migration/schema/data/ACL runtime. Giữ160endpoint/208records-enums, API layer hiện có được tái sử dụng, không cleanup legacy code ngoài phạm vi.

Kiểm tra và giới hạn mới nhất tại [current-work](../../docs/current-work.md) và [demo-readiness](../../docs/demo-readiness.md); thông tin below phiên13/14 là lịch sử nếu khác. Tests gồm47 Node regressions và browser adapter fixtures; không có authenticated live E2E hoặc ghi DB hiện tại. Backend working tree không thay đổi.

## Phiên tiếp tục 2026-10-14 — trạng thái ưu tiên hiện hành

BE HEAD `1a78898`, working tree sạch, không sửa BE. Có SDK10.0.401 và API5113 đang chạy; blocker thiếu SDK của phiên13 **đã hết**, nhưng chưa có session/quyền DB test cho end-to-end có ghi. Không đọc/in `.env`, không ghi đè cấu hình người dùng.

- Đã rà G-01…G-25, EF-01 và Swagger; bổ sung G-26 assignment stage. Bảng trạng thái/bằng chứng và acceptance để tự gửi BE tại [integration-gaps](../../docs/integration-gaps.md).
- Đã mở **practical scheduling** từ `/trainer/assessment/:id`, dùng component chung cho learner results: load attempts/schedules thật, gate ELIGIBLE+quiz current cycle+không lịch mở; create/date/location/note, đổi/hủy/hoàn tất own trainer. Lịch từ agenda dẫn về assessment; learner chỉ xem lịch. Giữ server errors BR-39/404, không fake success và không tự cert khi complete.
- Đã bật sort assignment khi filter status theo fix BE. Không dùng AssignmentStatus sai của G-26 để suy quiz pass; gate lấy enrollment/quiz history/schedule APIs.
- Equipment lookup cho steps và impact có search/pagination, giữ giá trị đã chọn khi đổi trang, lỗi/retry/loading. Không còn giới hạn chỉ100 bản ghi picker ở phiên13.
- Axios sau401 chỉ replay reads hoặc endpoint có idempotency key; mutation khác refresh session rồi yêu cầu xác nhận lại. Đã sửa việc business error sau retried GET làm logout nhầm; lỗi409 không xóa session mới.
- Types/endpoint metadata đã regenerate:160 operations/208 records/enums; không thay wire fields/roles. Live OpenAPI route inventory khớp, nhưng schema enum/security/multipart có gaps nên source/service vẫn là chuẩn.

G-04/G-05/G-07/G-08/G-10/G-13/G-14/G-16/G-22 và các quyết định nghiệp vụ chưa được BE giải quyết vẫn giữ thông báo/gates. Auditor AssignRetraining vẫn chặn; trainer picker chỉ chọn chính mình. Đề xuất/route blueprint gốc vẫn được giữ làm reference, actual routes xem router hiện hành.

Kết quả: TypeScript/lint/build pass,34 behavior/contract checks pass,5 browser smoke checks pass,live anonymous OpenAPI inventory160 operations pass. Main chunk510,88KB có warning Vite>500KB. Chi tiết/giới hạn tại [current-work](../../docs/current-work.md). Nội dung kết quả13/10 bên dưới là lịch sử, không phải kết luận hiện hành về practical gate/SDK/sort/picker.

Ngày: 2026-10-13. Nguồn: code backend, bốn tài liệu root `docs`, và code frontend hiện tại. Không chỉnh backend/database. Không có AGENTS.md được tìm thấy khi khảo sát.

## Phạm vi đã triển khai

Đã giữ React/TS/Vite/Router/RTK/Axios/npm và theme hiện có; bỏ đường chạy demo trong các route mới. 8 role lấy nguyên enum BE, giữ các prefix cũ và bổ sung training manager. Có 25 cấu hình trang danh sách/nghiệp vụ, detail theo quyền, 4 trang báo cáo, login/dashboard/tài khoản/push và các trang SOP version, học/thi/kết quả, đánh giá thực hành, impact, sales analytics, compliance/export, trace, media, import result.

| Nhóm | Luồng đã nối API |
| --- | --- |
| Auth/layout | Username login → me → workspace, guard/menu role, token rotation single-flight, revoke/logout, hết session/reset server cache, mobile sidebar |
| Danh mục/admin | CRUD và activate/deactivate user/branch/ingredient/equipment/category/product theo endpoint có thật; settings và audit log |
| Công thức/SOP | Tạo/import công thức, lịch sử/copy version, sửa steps/ingredients/dependencies, AI draft/repair, validate/submit/review/release/rollback; chọn vật tư thật |
| Khóa học | Tạo khóa, học phần GENERATED/AUTHORED/MIXED, bài học, duration/regenerate, quiz/bank/copy, checklist, submit/approve/return/rebuild theo trạng thái |
| Điều phối đào tạo | Quy định/nhu cầu, assignment, reset/close, classes/sessions/attendance, trainer agenda |
| Học viên/đánh giá | Enrollment ownership do BE, học bài/complete module, eligibility/quiz/history, kết quả/chứng chỉ/skills; trainer upload video/chọn bản ghi/đánh giá checklist |
| Vận hành | Sales/create/correct/POS/import result/aggregate; pilots/readiness/evaluate/decision/go-live/withdraw; impact preview/commit/run |
| Chất lượng/báo cáo | Branch audit/checklist/upload evidence/download, corrective start/close; aggregate dashboards, CSV/XLSX compliance, trace; đăng ký/hủy push thật |

Danh sách endpoint/types được generator trích từ controller/records/enums BE: **160 endpoint, 208 records/enums**. Kiểm tra tĩnh tham chiếu UI/session: 159 operation có tham chiếu (bao gồm role gates và hai thao tác đang bị chặn), `CourseModules.ListLessons` không gọi riêng vì course detail đã mang lessons. Đây là inventory tĩnh, **không phải số endpoint đã chạy thành công trên backend**. `ResourcePage`/`ActionDialog` dùng metadata chung để không đổi field/route tùy tiện. TS request/response/enums nằm trong `src/services/backend/contracts.ts`.

## Chặn hoặc giới hạn được hiển thị thật

- G-01: không gửi request tạo lịch mới theo luồng sau quiz vì BE đòi PASSED sau cả thực hành. Lịch hiện có vẫn đọc/cancel/complete theo role và own trainer.
- G-04/G-05: chưa chọn giảng viên khác (chỉ chính trainer); auditor giao học lại bị chặn vì không có khóa học picker hợp lệ. RD_MANAGER không mở course detail; TRAINING_MANAGER không mở enrollment history. Không nâng quyền ADMIN hoặc giả roster.
- G-07/G-08/G-14/G-16/G-22: không có edit/delete quiz question, copy bank multiple-choice vào single-answer quiz, course archive/class cancel, inbox, upload tài liệu SOP/lesson, PDF hoặc timeline đầy đủ.
- G-10/G-12: impact không affected items không mở trang run giả; pilot GET/export có side effect theo BE, UI không khẳng định các GET này chỉ đọc.
- G-13/G-17/G-18/G-19/G-20: protected media dùng Bearer blob; assignment status filter bỏ sort; readiness/skills không thay thế gate bán; close corrective không bắt buộc retraining; release/pilot gates bám code hiện hành.
- G-24: không gửi path ID vượt safe integer; serialization ID rất lớn và deployment runtime vẫn cần BE xác minh.
- Một số filters/trace cần nhập ID tham chiếu khi role thiếu API discovery; không tạo endpoint danh sách mới. Thiết bị picker lấy tối đa 100 bản ghi; danh sách quản trị vẫn phân trang đầy đủ. Nên bổ sung tìm kiếm/phân trang picker nếu dữ liệu thiết bị lớn.

## Kết quả kiểm tra

- TypeScript: pass.
- ESLint: pass.
- Test: 26 behavior/contract checks pass; kiểm rotation đồng thời/401/logout/stale response, role matrix đủ 160 route, validation (bao gồm manual repair nested patch) và request multipart/idempotency, lỗi nghiệp vụ.
- Production build: pass; màn hình nghiệp vụ tải lazy để giảm tải ban đầu. Vite còn cảnh báo main chunk 510,70 KB vượt ngưỡng 500 KB; không phải lỗi build, cần tiếp tục tối ưu bundle khi mở rộng.
- Chrome headless: 5 smoke checks pass qua `node scripts/browser-smoke.mjs`: login render thật; route `/admin/users` chưa có session hiển thị login; empty login validation; desktop/mobile không horizontal overflow; không unhandled runtime exception. Không gửi login/mutation lên BE.
- Chưa chạy live authenticated end-to-end vì runtime BE .NET 10 không sẵn có (máy có SDK 8), startup có migration/background writes. Chưa xác minh DB/multipart streaming/Range/LLM/push channels/CORS HTTP/OpenAPI thực tế. Cần môi trường test được phép trước các kiểm tra này.

## Hướng dẫn tiếp tục

Theo README để cấu hình URL và chạy frontend. Ưu tiên BE giải G-01/G-04/G-05, rồi test tài khoản thật từng role, ownership branch/trainer, quiz fail/retake/pass/practical certification, release→impact→retrain→pilot→launch và download/upload/export. Giữ nguyên toàn bộ nội dung audit gốc trong `../../docs/integration-gaps.md`; phần bổ sung FE mô tả cách xử lý, không coi BE gap đã được sửa.
