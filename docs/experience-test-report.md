# Happy/unhappy web test — 04/11/2026

> Post-landing review mới trên FE dc5c06a: xem [current report](final-flow-report.md), [51-case registry/source inventory](final-flow-coverage.md) và [product findings/backlog](product-backlog.md). Lượt mới đã xác nhận BE G-19 bằng audit/action riêng; không coi các ca baseline hoặc61 ca tiếp tục ở link lịch sử là kết quả vừa chạy lại.

> Checkpoint tiếp tục đã hoàn thành practical/certificate, NEW go-live, sales/POS và retraining close: xem [final-flow report](final-flow-report.md), [61-case registry và source inventory](final-flow-coverage.md). Báo cáo này giữ baseline17 ca và các trạng thái của thời điểm trước; các blocker practical/coverage cũ đã được giải quyết qua workflow hợp lệ.

## Môi trường và giới hạn

- FE `feat/trainflow`, HEAD `e9e74aff309bb06f7707407a71fb142a2e92f7c6`, có thay đổi staged/unstaged/untracked từ trước, giữ nguyên. Root vẫn `main`.
- BE `main`, HEAD `33e2ed273b7fbb91ada2c0bbaf43a3cc4a3ed9d6`, chỉ đọc, worktree sạch đầu/cuối kiểm tra. Runtime OpenAPI không công bố build hash nên không khẳng định tiến trình BE chạy đúng commit chỉ dựa HTTP 200.
- Live FE **http://localhost:5173**, API **http://localhost:5113/api/v1** lấy từ cấu hình hiện có. OpenAPI HTTP 200, OPTIONS xác nhận CORS cho localhost:5173 và đăng nhập thật chứng minh browser kết nối được. Không sửa `.env` hay file credentials.
- Người vận hành đã xác nhận trong cuộc trò chuyện: DB test/demo riêng, cho phép business writes mang prefix E2E. Business test cần opt-in `E2E_ALLOW_BUSINESS_WRITES=true` theo process; không ghi cờ vào `.env.e2e.local`.
- Chromium headed, một worker, không retry. Real sessions không trace/video/HAR/storageState/screenshot; context riêng theo actor, đóng trước khi báo lỗi để không lưu DOM/identity vào failure artifact. Chỉ ảnh TEST_ONLY/public được lưu.
- Live suites không fulfill/mock API. Fault injection nằm riêng ở isolated suite, abort toàn bộ request API thật và dùng Axios test adapter trong context riêng.
- Backend, DB/migration/seed/Docker không bị chỉnh sửa hoặc khởi động. Không commit/push/pull/reset/clean/stash. Không cài thêm dependency vào repository trong lượt này.

## Kết quả và cách đếm

**17 ca riêng biệt đã được xác nhận sau sửa: 13 PASS_LIVE, 4 PASS_ISOLATED; 0 lỗi chưa khắc phục, 0 skipped trong các lượt xác nhận.** Lượt gộp 16 ca gần nhất có 15 passed và 1 failed do locator label match cả group lẫn input; đổi locator sang spinbutton có accessible name đúng rồi chạy lại bốn isolated ca + một live read-controls mới: **5/5 passed**. Không mô tả lượt gộp đó như 16/16 pass, không cộng lần retest thành ca độc lập. Lỗi timeout logout của harness trong lượt gộp trước đã sửa và ca fresh course sau đó pass 12.3 giây.

Theo nhóm kiểm tra ghi trong ledger: **86 happy groups +24 unhappy groups live PASS** (110 nhóm trong 13 test bundles). Đây là nhóm kiểm tra con, không phải 110 Playwright test cases. Bốn isolated bundles tập trung unhappy/recovery; không tách mỗi assertion thành ca mới. Quy trình thiếu minh chứng/prerequisite nằm ở mục Blocker, không nằm trong 17 ca đã thực thi.

| Nhóm kiểm tra | Kết quả đã xác nhận |
| --- | --- |
| TypeScript | PASS, gồm app, config Node/Playwright và E2E |
| ESLint | PASS |
| Production build | PASS, còn warning main chunk 558.40 kB >500 kB |
| Node regression | PASS 93 checks: 37 integration +36 authoring +20 session; TEST_ONLY transports |
| Browser authoring/shared UI | PASS 74 checks, TEST_ONLY |
| Browser session | PASS 11 checks, TEST_ONLY |
| Browser public smoke | PASS 5 checks, không credentials |
| New Playwright — live | 13 ca riêng biệt PASS_LIVE, gồm 8 role +4 workflow/validation +1 read-controls |
| New Playwright — isolated | 4 ca riêng biệt PASS_ISOLATED sau retest |
| Runner history | Lượt gộp 16: 15 pass/1 harness fail; targeted retest +case mới: 5 pass/0 fail |
| Privacy | PASS; artifact scanner không thấy password, username không công khai, JWT hoặc live capture |

Các ca EXPECTED_DENIAL như HTTP 403 trái quyền, HTTP 409 immutable/duplicate/closure gate được coi PASS cho **đúng hành vi từ chối**, không phải chức năng approve/close thành công. Downstream thiếu video/chứng chỉ giữ NOT_RUN/BLOCKED.

## Ma trận live theo role

Mọi hàng đã kiểm: login → `/auth/me` đúng role; sidebar khớp source matrix; F5 giữ path/query/hash; workspace trái role redirect; một safe GET bị policy từ chối HTTP 403 và giữ phiên; logout + reload + guard. Đây là kiểm tra chọn lọc, không nói toàn bộ role permissions hay mọi chức năng đã pass.

| Role | Trang live chọn lọc | Happy | Unhappy | Viewports/bằng chứng |
| --- | --- | --- | --- | --- |
| ADMIN | users, recipes | Render/list không lỗi, đúng menu | Wrong workspace, safe denied GET 403 | 1440/768/390/360, mobile menu Escape/focus |
| RD_SPECIALIST | recipes, ingredients | Như trên; tạo recipe riêng, giữ draft khi conflict | Recipe code trùng 409, immutable SOP 409 | Như trên; live field-error/focus retest |
| RD_MANAGER | courses/pending, recipes, launch | Review/release SOP và approve course riêng thật | Không cấp quyền trainer quiz chỉ vì được review | Như trên; pilot dashboard ban đầu vẫn PARTIAL trong safe-read suite |
| TRAINER | courses, assignments | Author 7 module, prose/duration, quiz/checklist course riêng | Incomplete submit 409 BR-31 | Như trên; course detail run riêng |
| TRAINING_MANAGER | learning-path, assignments | Giao course riêng cho test trainee đúng branch | Safe GET ngoài quyền 403 | Như trên; **không** course approve theo controller hiện tại |
| TRAINEE | learning-path, learning | Mở course riêng, hoàn tất lesson và pass quiz thật | Wrong workspace / safe denied API 403 | Như trên; practical/certificate NOT_RUN |
| BRANCH_MANAGER | assignments, branch-audits, launch | Read-only tiến độ/quality/coverage chọn lọc | Safe denied GET 403 | Như trên; sales/POS/go-live NOT_RUN trên run mới |
| QUALITY_AUDITOR | branch-audits, quality-summary | Tạo failed audit test, action, đọc detail/options | ALREADY_ENROLLED; closure 409 RETRAINING_INCOMPLETE | Như trên; evidence upload NOT_RUN |

Có **18 role-page pairs** trong sweep, mỗi trang được kiểm tại bốn viewport; không tính deep link, guard và workflow detail thành toàn bộ chức năng. Chi tiết method/path/roles: [permission matrix](../../docs/e2e-permission-matrix.md), controller/policy nguồn và `e2e-private/experience-live.json`.

## Luồng thật và loại bằng chứng

1. RD_SPECIALIST tạo recipe prefix `E2E_` bằng form UI, API trả 201; success dialog giữ kết quả. Tạo trùng đúng code của run bị 409.
2. Tạo version, ghi một bước manual mix với ingredient active lấy từ danh sách được phép, unit đúng catalog. Validate pass thật và submit SOP.
3. Actor RD_MANAGER riêng ACCEPT step và RELEASE SOP; specialist sửa SOP đã release bị 409. Không nới immutability hoặc separation of duty.
4. TRAINER tạo PRODUCT course bound đúng version run. Submit khi chưa hoàn thiện bị 409 BR-31. Sau đó biên soạn đủ bảy module, duration/prose cho phần tác giả, quiz và checklist theo recipeStepId thật; submit thành công.
5. RD_MANAGER approve bằng UI: POST thật 200, success dialog. **Không mặc định TRAINING_MANAGER vẫn có quyền duyệt từ báo cáo cũ**.
6. TRAINING_MANAGER giao cho test trainee đúng branch; learner hoàn tất từng lesson thật qua API client của FE và làm quiz đúng nội dung vừa biên soạn; server trả passed=true. API checks này không phải bằng chứng đã click từng CTA lesson/quiz trên UI; UI learning/detail đã mở riêng.
7. QUALITY_AUDITOR tạo failed audit ghi rõ observation giả lập của E2E trên DB test, không phải kết luận chất lượng chi nhánh ngoài đời. Server tính result FAILED và sinh corrective action. Retraining cùng course/enrollment trả ALREADY_ENROLLED, không nhân bản enrollment. Close trả 409 RETRAINING_INCOMPLETE vì chưa thực hành/certificate; giữ gate.

Recipe/SOP creation có UI + API proof; phần content/lesson/quiz/audit chủ yếu API client thật + page reads, không tuyên bố toàn chuỗi click-through UI. Full demo còn thiếu practical/video/certificate rồi pilot/go-live/sales/POS và evidence upload. Không tạo certificate giả, chấm practical không có minh chứng, hoặc import POS để né trạng thái LIVE.

## Finding và sửa FE

**FE_BUG / UX_IMPROVEMENT — lỗi server không gắn với input.**

- Tái hiện: ADMIN tạo ingredient hợp lệ ở isolated context, trả server field error 422 cho `name`; global error hiện nhưng group/input không invalid, focus vẫn ở submit. Live retest dùng RD_SPECIALIST tạo trùng recipe E2E, HTTP 409 với detail `recipeCode`.
- Expected: giữ draft, hiện lỗi sát field, đánh dấu input, liên kết lỗi cho screen reader, mở section chứa lỗi và focus field đầu tiên.
- Root cause: ActionDialog.catch chỉ setError; issues chỉ được set từ local validateRequest. ContractFields chưa gắn `aria-invalid`/`aria-describedby` cho native inputs.
- Sửa `src/components/common/ActionDialog.tsx`: chuyển validationErrors server thành FieldIssue, dùng chung focusIssue cho local/server, giữ draft và full error metadata; mở details chứa input trước focus. Không auto replay mutation hoặc đổi auth flow.
- Sửa `src/components/common/ContractForm.tsx`: native input/select/textarea có aria-invalid, aria-required, aria-describedby trỏ đến error IDs ổn định. Giữ ngôn ngữ, visual system, API/client/store.
- Retest: isolated 422 PASS; **live 409 PASS**, draft giữ, focus đúng input, Escape/cancel trả focus về nút tạo. Shared consumer browser regression 74 +11 +5 PASS.

**UX_IMPROVEMENT — nhãn nhiệt độ thiếu ngôn ngữ/đơn vị:** ảnh dialog ở 360px cho thấy `brew Temp Min C`/`brew Temp Max C`. Bổ sung nhãn “Nhiệt độ pha tối thiểu (°C)”/“Nhiệt độ pha tối đa (°C)” trong `presentation.ts`, giữ field/API cũ. Isolated browser xác nhận accessible name và modal/footer vẫn sử dụng được ở cả bốn viewport; đã xem ảnh 360px, không có dữ liệu thật.

Ba isolated bundles còn lại xác nhận: whitespace required không gửi request; dirty cancel/reopen và Tab/Shift+Tab focus trap; double click/Enter chỉ một request pending; 503→Retry→empty khác error và dialog/footer trong viewport 1440/768/390/360.

## Test harness findings

- Ban đầu test isolated đặt nhầm role không có quyền ghi catalog và thiếu shelfLifeHours; sửa harness theo controller ADMIN và required fields, không mở quyền để pass. Những lỗi này không tính FE/BE bug.
- Một số dynamic router imports trên Vite đang HMR/SSR giữ instance cũ. Isolated setup dùng link sidebar thật; fixture browser regression dùng Vite riêng mới ở `127.0.0.1:5175 --force`. Không sửa assertion theo behavior sai.
- Harness ban đầu dùng operation name chưa đúng (`Assignments.Create`); sửa sang operation hiện có `Assignments.Assign`, và type Operation kiểm tra các call. Không tạo endpoint mới.
- Hai nút Đóng ở header/footer cùng tên cần locator footer cụ thể. Test phải đóng success dialog trước logout, nếu không overlay chặn header. Đây là synchronization của test, không phải lỗi logout ứng dụng.
- Chỉ báo cáo pass của lượt đã chạy xong. Lịch sử lỗi setup/retry được phân biệt với failed behavior và giữ trong ledger; không bật retries để che lỗi.

## Blocker / chưa thể kết luận

- TEST_DATA: chưa có MP4/practical evidence phù hợp và đánh giá thực hành hợp lệ; certificate, đủ certified staff và go-live/POS của run mới chưa chạy. Không hạ prerequisite/BR-34.
- NOT_RUN: wrong branch/owner bằng tài khoản khác branch; thao tác đổi role/password/account để thu hồi token; destructive security/load tests; real refresh timeout/race, network offline/5xx; POS khác payload cùng key; impact concurrency. Phần tương ứng trong Node/browser fixtures chỉ PASS_ISOLATED.
- EXPECTED_DENIAL: 403 policy, 409 duplicate/immutable/BR-31/RETRAINING_INCOMPLETE không phải BE bug.
- Không có BE_BUG runtime mới đã chứng minh trong phạm vi thực thi; không suy từ list/menu/fixtures rằng BE concurrency hoặc toàn bộ branch scope đã đúng.
- Không có Browser Use riêng; đã dùng Chromium/Playwright/CDP thật. Không truy cập UI Problems của IDE; TypeScript/lint/build được xác minh qua CLI.

## Artifacts, dữ liệu và chạy lại

- Ignored: `experience-test-results/`, `e2e-private/experience-*.json`, `.env.e2e.local`. Token/session chỉ trong context, không export storageState.
- Ảnh `e2e-private/experience-artifacts/isolated-dialog-{1440,768,390,360}.png` chỉ có TEST_ONLY. Không có live screenshot/trace/video/HAR. Public login screenshots của smoke ở `%TEMP%/brewforge-login-{desktop,mobile}.png`.
- Ledger ghi prefix và ID tạo ra; dữ liệu giữ lại để review. Recipe/version/audit không có safe delete API; không SQL cleanup, không xóa dữ liệu cũ.
- Lượt cuối: `E2E_MW18Y5RK`, recipe **16**, SOP version **15**, course **8**, enrollment **12**, audit **3**, corrective action **3**. Các lượt dựng/khắc phục harness trước giữ lại recipe13 (run `E2E_MW18EISW`), recipe14/version13/course6/enrollment10/audit1/action1 (run `E2E_MW18HBAO`) và run `E2E_MW18QHUX` recipe15/version14/course7/enrollment11. Không xóa hoặc reset những record này. Đây là ID của dữ liệu E2E được tạo thật, không phải account IDs hoặc secret.
- Phạm vi file mới: `e2e/experience/` (live/business/continuation/quality/validation-live/read-controls/isolated + README), `playwright.experience.config.ts`, `scripts/verify-experience-privacy.mjs`, báo cáo này. `.gitignore` và tsconfig Node bổ sung config/artifacts; source inventories được tái sinh theo quyền hiện tại. Source sửa trong lượt này là ActionDialog, ContractForm và hai nhãn presentation; các thay đổi user có sẵn giữ nguyên.

```powershell
cd D:\capstone\BrewForge\frontend
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
# Chỉ khi DB test riêng đã được xác nhận và cho phép business writes:
$env:E2E_ALLOW_BUSINESS_WRITES='true'
npx.cmd playwright test --config=playwright.experience.config.ts
node scripts/verify-experience-privacy.mjs
```

Runbook/read-only/isolated riêng: [experience README](../e2e/experience/README.md). Báo cáo 01/11 giữ nguyên số liệu lịch sử, không dùng để mô tả quyền controller hoặc độ bao phủ ngày 04/11.
