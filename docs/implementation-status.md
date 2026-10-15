# Kết quả triển khai frontend theo backend

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
