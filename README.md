# BrewForge frontend

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

Access token, refresh token và identity chỉ ở Redux memory; tải lại trang cần đăng nhập lại. Axios tự gắn Bearer, refresh token tuần tự khi có nhiều 401; tự thử lại GET một lần, mutation chỉ replay sau refresh khi endpoint hỗ trợ idempotency và có key. Mutation khác yêu cầu người dùng xác nhận lại, không tự gửi lần hai. Refresh hết hạn xóa session/cache. Đăng xuất gọi revoke backend rồi xóa session cục bộ. Nếu role/chi nhánh đổi khi refresh, yêu cầu đăng nhập lại. Route guard hỗ trợ điều hướng; quyền và ownership vẫn do BE kiểm tra.

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
