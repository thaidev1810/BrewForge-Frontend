# BrewForge frontend

### Đồng bộ BE 52be9a7 (22/10/2026)

Contract hiện có 188 endpoint. Không đổi npm commands hoặc biến môi trường; giữ .env hiện tại. Form người dùng lấy role catalogue từ GET /api/v1/roles. Token vẫn theo sessionStorage từng tab. Nếu mất response refresh, giữ pair nhưng đánh dấu không chắc đã rotate, yêu cầu xóa phiên/đăng nhập lại thay vì gửi lại token single-use. POS retry trong cùng dialog giữ file/key; đóng hoặc reload không khôi phục pending upload. Cần người vận hành áp dụng migrations014–016 trên môi trường test phù hợp; FE không tự migrate. Xem ../docs/current-work.md và ../docs/integration-gaps.md để phân biệt READY_STATIC với runtime chưa xác minh.


## Đồng bộ BE 20/10/2026

Theo merge `e4e95b4` (first parent `df8fb9a`): registry187operations/251types-enums, retraining per-employee results + stale-options retry, user IDs/history labels và trainer search/pagination. RD_MANAGER đọc course detail/modules nhưng **chưa duyệt/trả**; TM/BM có trang đọc enrollment từ tiến độ, không cấp quiz answers/evaluate. UI và auth19/10 giữ nguyên, không đổi env hoặc dependency.

`npm.cmd test` hiện89checks (34+36+19); `browser-authoring.mjs`70checks, `browser-session.mjs`12, public smoke5. Browser scripts dùng TEST_ONLY transports, không phải live business E2E. Sau SSR tests, khởi động lại FE dev riêng với `--force` như hướng dẫn dưới trước browser suite. Backend không được tự startup/migrate/seed trong workflow này; API đang chạy có OpenAPI mới nhưng chưa có build hash xác minh commit. Xem ../docs/current-work.md và integration-gaps.md cho trạng thái hiện hành.

## Cập nhật UI/UX 19/10/2026

Sidebar theo role có nhóm thu gọn, icon mode trên desktop và drawer trên mobile. Các trang dài dùng tab/accordion; learner đọc một bài, giữ vị trí qua refetch. Form chưa lưu có xác nhận rời trang/đóng, lỗi dẫn tới field; không đổi API/auth. Chi tiết tại ../docs/current-work.md.

Browser authoring suite hiện **59checks**, session12 và public smoke5 (76tổng), thay số30trong ghi chú lịch sử. Chạy các script như phần auth bên dưới; test fixtures chặn BE, không cần tài khoản thật. Typecheck/lint/npm test86checks/build vẫn là các lệnh chuẩn. Giữ base URL/.env.example hiện có, không thêm cấu hình hoặc dependency. RD_MANAGER vẫn chưa được BE cấp quyền duyệt khóa.

## Cập nhật auth 19/10/2026

`npm.cmd test` hiện chạy86checks (34integration +33authoring +19session). Sau Node SSR tests, khởi động lại Vite riêng để chạy browser fixtures:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort --force
# Trong terminal khác, mặc định dùng Chrome trên Windows:
node scripts/browser-session.mjs
node scripts/browser-authoring.mjs
$env:FE_SMOKE_URL='http://127.0.0.1:5174'
node scripts/browser-smoke.mjs
```

Session suite12checks, authoring30checks, public smoke5checks. Auth/business fixtures chỉ nằm trong test scripts, chặn API BE; không phải live nghiệp vụ. `.env.example` và cách cấu hình base URL bên dưới không đổi, không cần secret mới. Các mô tả số lượng test và staged/unmerged trong lịch sử bên dưới được thay thế bởi mục này và `docs/current-work.md`: index BE hiện không còn UU, source review vẫn chỉ cấp TM.


Phiên19/10/2026 theo **working tree BE trên6ef17b0** (đang staged/unmerged):187operations/248types-enums. Đã tích hợp lesson-by-lesson, own/manager learning path, TM pending review, trainer branch scope/cancel và inbox/bell/read/read-all. BE duyệt khóa vẫn TRAINING_MANAGER dù drawio ghi RD_MANAGER. Hướng dẫn/mâu thuẫn/migrations cần xác nhận tại [current-work](../docs/current-work.md). `npm test` gồm67Node checks; browser authoring suite30fixture checks trên FE dev riêng5174, không gọi business BE hoặc fake success trong app. Không tự khởi động BE/migrate/seed; inbox/progress cần BE đã áp dụng schema tương ứng.

Tích hợp hiện hành 16/10/2026: BE `6ef17b0`,163operations/212types-enums. Assignments dùng stage/isOverdue/enrollmentState; directory `/users/lookup` có server search/page20; session dùng course eligible-trainers và auditor dùng corrective-action retraining-options. Không mở manager read scopes chưa có trong controller. Regression mới tại `npm test` và `node scripts/browser-authoring.mjs` (FE dev riêng ở5174); chỉ test-only adapters, không mutation BE thật. Sau SSR tests hoặc thay đổi source khi đang kiểm browser, khởi động lại Vite riêng với `--force` trước khi chạy lại browser suite để tránh optimize/HMR cache cũ. Contract/giới hạn tại [current-work](../docs/current-work.md).

React 19 + TypeScript + Vite, React Router, Redux Toolkit/RTK Query, Axios và Tailwind 4. Giữ feature folders, alias `@`, component và giao diện espresso/caramel của dự án. Các route hiện tại gọi backend thật, không dùng tài khoản demo hoặc dữ liệu mock.

## Chạy cục bộ

Từ `D:\capstone\BrewForge\frontend`:

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Trên hệ điều hành khác dùng `npm`. `npm.cmd` tránh lỗi execution policy của PowerShell. Sửa `VITE_API_BASE_URL` trong `.env.local` theo địa chỉ API, **giữ `/api/v1`**; giá trị mẫu `http://localhost:5113/api/v1`. Vite mặc định chạy `http://localhost:5173`. Backend phải cho phép origin FE trong CORS; xem hướng dẫn và cấu hình môi trường backend. Không chép JWT key, connection string, mật khẩu, API key hoặc VAPID private key vào biến `VITE_*`.

Backend yêu cầu .NET 10 và PostgreSQL. Khởi động backend có thể chạy migration/tác vụ ghi, nên chỉ khởi động trong môi trường đã cấu hình và được phép. Lần triển khai này không khởi động backend, không thay database. Đăng nhập bằng **username**, password của tài khoản backend do quản trị viên cung cấp.

Access token và refresh token được lưu thành một cặp trong sessionStorage (`brewforge.session.v1`) để giữ phiên qua F5 trong cùng tab. Không lưu user/role hay dữ liệu nghiệp vụ. Khi tải lại, AuthBootstrap gọi `/auth/me` để xác thực identity mới trước khi mở trang; access hết hạn dùng refresh single-flight, lưu pair mới rồi đọc identity. Lỗi mạng/timeout/5xx/403 giữ token và hiển thị Retry; refresh invalid/revoked xóa phiên/cache. Giữ nguyên pathname/query/hash; sau login chỉ quay lại route nội bộ thuộc quyền role. Storage bị chặn không crash nhưng không thể khôi phục qua reload.

Logout xóa persisted session và Redux/RTK Query cache ngay trước khi đợi BE revoke; response cũ không khôi phục phiên. Identity/scope đổi cũng reset cache. Axios giữ quy tắc không replay mutation thiếu idempotency. Quyền thực tế và ownership vẫn do BE kiểm tra. RD_MANAGER hiện chưa có course detail/modules/approve/return; TRAINING_MANAGER vẫn duyệt/trả theo source BE.

## Workspace và chức năng

| Role BE | Prefix giữ theo dự án | Màn hình chính theo quyền API |
| --- | --- | --- |
| ADMIN | `/admin` | Người dùng, chi nhánh, danh mục, cấu hình, nhật ký; không có quyền vượt mọi role |
| RD_SPECIALIST | `/rd-specialist` | Nguyên liệu/thiết bị, công thức, phiên bản SOP, AI draft/repair, kiểm tra và submit, impact |
| RD_MANAGER | `/rd-manager` | Review/release/rollback SOP, thử nghiệm, readiness/decision/mở bán, impact, doanh số/báo cáo |
| TRAINER | `/trainer` | Khóa học/học phần/bài học/quiz/checklist/bank, nhu cầu/giao học/lớp/buổi/điểm danh, lịch, đánh giá thực hành |
| TRAINEE | `/barista` | Khóa của tôi, bài học/hoàn thành, thi/lịch sử/kết quả, chứng chỉ, hộ chiếu kỹ năng |
| BRANCH_MANAGER | `/store-manager` | Đội ngũ, giao học/reset/close, lớp, doanh số/POS, readiness, kiểm định/khắc phục chi nhánh |
| QUALITY_AUDITOR | `/quality-auditor` | Kiểm định/minh chứng, khắc phục, tổng quan chất lượng, truy vết và báo cáo tuân thủ |
| TRAINING_MANAGER | `/training-manager` | Duyệt/trả/rebuild khóa học, quy định, nhu cầu và báo cáo đào tạo |

Mỗi workspace có dashboard dữ liệu thật, tài khoản và đăng ký/hủy web push. Menu chỉ có API role được gọi. Một số detail chỉ truy cập bằng liên kết ID do BE không cho role đọc danh sách. Chi tiết route/luồng và giới hạn: [implementation status](docs/implementation-status.md), [frontend blueprint](../docs/frontend-blueprint.md), [integration gaps](../docs/integration-gaps.md).

Màn hình hỗ trợ loading/empty/error, lỗi field/rule/traceId, xác nhận thao tác, phân trang/tìm kiếm/lọc/sort theo từng API; form metadata có nhãn và lookup dữ liệu thật. POS dùng CSV/XLSX; kiểm định dùng ảnh minh chứng; thực hành dùng video multipart. Media có bảo vệ được lấy bằng Bearer và blob URL; export CSV/XLSX dùng tải file. Không có PDF, notification inbox hoặc upload SOP/lesson do BE chưa hỗ trợ.

## Cấu trúc và contract

- `src/app`: store, session/cache lifecycle, router theo 8 role.
- `src/features/auth`: login thực, guards, identity và refresh/logout.
- `src/features/workspace`: cấu hình 25 danh sách, màn hình nghiệp vụ, báo cáo và detail đặc thù.
- `src/features/training/LearningPage.tsx`, `src/features/assessments/AssessmentPage.tsx`: học/thi và đánh giá thực hành.
- `src/services/backend`: types/enums, route metadata, RTK Query, request projection và validation; `src/services/apiClient.ts`/`apiError.ts`: transport và lỗi chung.
- `src/components/common`: bảng, trạng thái, form/nested array/lookup, upload và dialog; `src/components/layout`: shell responsive.
- `public/push-worker.js`: nhận web push; cần secure context, browser hỗ trợ và VAPID public config từ API.

Các slice/service mock cũ còn được giữ làm reference lịch sử, không được màn hình mới gọi; `useMockServices` và demo auth đã tắt trong code. Các flag `VITE_ENABLE_MOCK_*` cũ không bật lại chế độ demo. Tài liệu provisional cũ được giữ kèm thông báo thay thế.

Đọc contract tại [api-contract](../docs/api-contract.md). Sau thay đổi C# controller/DTO, chạy `npm.cmd run contracts:generate`, xem diff và kiểm tra business validation thủ công; generator không thay thế việc đọc service. Có 160 endpoint đăng ký, không đồng nghĩa đã kiểm tra 160 HTTP request trên server. `node scripts/report-integration-coverage.mjs` báo các tham chiếu UI/session tĩnh.

## Kiểm tra và build

Phiên tích hợp BE `f7c43d5` sửa serialized RTK errors, dialog giữ state khi refetch, course readiness/quiz keys, impact empty header/409 và trace-bound auditor retraining. Backend cần migration006 cho impact mới; frontend không tự chạy migration. Dedicated active staff/trainer/course lookup vẫn thiếu, CertifiedStaff history không phải roster. Xem [current work](../docs/current-work.md) và [integration gaps](../docs/integration-gaps.md) để phân biệt code/test fixtures với business runtime.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

`verify:auth` và `verify:business` chạy riêng các suite trong `scripts/verify-integration.mjs`. Tests dùng transport adapter chỉ trong test để kiểm tra concurrency, cache, request thật, role/route matrix và business validation; không ghi backend/database. Các script verify đời trước không phải suite tích hợp hiện hành.

`npm test` còn chạy `verify-authoring.mjs` cho error unwrap, course content, quiz answer keys, cache policy, status/sort và impact empty/conflict. Browser regression tùy chọn: chạy Vite ở localhost5174 rồi `node scripts/browser-authoring.mjs` (hoặc FE_SMOKE_URL chỉ định localhost). Script dùng **TEST_ONLY transport fixtures**, chặn backend URLs, kiểm UI của ứng dụng thật, không là bằng chứng E2E với BE. Khi chạy SSR Node tests và Vite song song có thể làm cache dependency dev cũ; khởi động lại Vite riêng với `--force` trước browser regression nếu cần. Không dùng fixture này trong production/browser application code.

Smoke browser tùy chọn trên Windows có Chrome: khi Vite đang chạy, chạy `node scripts/browser-smoke.mjs`. Script dùng profile tạm riêng, kiểm guard/validation/responsive và xuất ảnh vào thư mục temp, không gọi BE. Có thể đặt `CHROME_PATH` hoặc `FE_SMOKE_URL` (chỉ localhost).

Deploy static cần rewrite application routes về `index.html`. Các biến Vite được bake lúc build. FE không tự deploy trong lần này. Live end-to-end, OpenAPI chạy thật, media/CORS/push/LLM cần kiểm tra khi backend môi trường test được phép đã sẵn sàng.
