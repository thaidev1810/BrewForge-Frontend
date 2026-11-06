# Business workflow readiness — BrewForge

Ngày thực hiện: 2026-11-01 (Asia/Bangkok). Scope: real accounts, Chromium headed, 1 worker, GET allowlist, no mock API, no business mutation. Chỉ auth login/refresh/logout được POST. Bộ auth và báo cáo auth được giữ riêng, không ghi đè bởi test business.

## Kết quả định lượng

- Role đã chạy: 8/8. Browser test outcomes chứng minh runner hoàn tất kiểm tra an toàn; không có nghĩa mọi workflow demo đều READY.
- Page/route đã mở để kiểm tra: 71 (đếm theo role + URL, không bao gồm route chỉ nằm trong source hoặc thiếu ID). 70 route render checks READY.
- Chức năng/check theo role đã phân loại runtime: 284. Real GET probes có status: 100. Một số check là permission/static safety decision nên không gửi request.
- READY: 105 runtime checks.
- FE BUG: 0 runtime checks.
- BE BLOCKED: 0 runtime checks.
- PERMISSION BLOCKED: 161 runtime checks.
- DATA BLOCKED: 12 runtime checks.
- SAFETY BLOCKED: 6 runtime checks.
- NOT IMPLEMENTED: 0 runtime checks.
- Inventory toàn bộ menu/router: 139 role-pages, 382 function bindings (source + runtime matching), phân loại {"READY":40,"FE BUG":0,"BE BLOCKED":0,"PERMISSION BLOCKED":127,"DATA BLOCKED":0,"SAFETY BLOCKED":215,"NOT IMPLEMENTED":0}. Không cộng inventory vào runtime vì có trùng.
- Gap sản phẩm riêng từ source: 10 role-function rows, phân loại {"READY":0,"FE BUG":0,"BE BLOCKED":1,"PERMISSION BLOCKED":4,"DATA BLOCKED":0,"SAFETY BLOCKED":0,"NOT IMPLEMENTED":5}. Đây không phải API lỗi quan sát live và không cộng vào số runtime.

**READY chỉ áp dụng check đã thực hiện.** `fe=Not opened` là API-only readiness; không chứng minh page hoặc toàn bộ quy trình đã demo thành công. List rỗng có thể READY cho empty state nhưng detail sẽ DATA BLOCKED. PERMISSION BLOCKED gồm nhiều từ chối đúng policy, không đồng nghĩa hàng đó là bug cần mở quyền. SAFETY BLOCKED gồm mutation bị cấm trong lượt này và GET chưa được xét an toàn.

- Lượt xác nhận 01/11: 8/8 browser role tests PASS (1.8 phút), cộng 1 test loading chuyển tiếp GET thật PASS (3.4 giây). Các số PASS này không bao gồm business mutations bị cấm.
Loading bổ sung chỉ giữ thời điểm chuyển tiếp request rồi dùng API response thật; không fulfill/mock response. Public role aliases/routes lấy từ source không phải dữ liệu tài khoản ghi từ env. Bộ quét kiểm password, username không công khai và JWT.

## Kết quả theo role

| Role | READY | FE BUG | BE BLOCKED | PERMISSION BLOCKED | DATA BLOCKED | SAFETY BLOCKED | NOT IMPLEMENTED |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ADMIN | 9 | 0 | 0 | 25 | 2 | 0 | 0 |
| RD_SPECIALIST | 9 | 0 | 0 | 28 | 0 | 0 | 0 |
| RD_MANAGER | 14 | 0 | 0 | 15 | 2 | 4 | 0 |
| TRAINER | 25 | 0 | 0 | 10 | 2 | 0 | 0 |
| TRAINEE | 10 | 0 | 0 | 23 | 1 | 0 | 0 |
| BRANCH_MANAGER | 11 | 0 | 0 | 20 | 2 | 1 | 0 |
| QUALITY_AUDITOR | 10 | 0 | 0 | 22 | 3 | 0 | 0 |
| TRAINING_MANAGER | 17 | 0 | 0 | 18 | 0 | 1 | 0 |

## Giai đoạn A — bảng page, chức năng, endpoint và permission

Inventory cho cả 8 role và mọi menu/action binding: [business-workflow-matrix.md](business-workflow-matrix.md). Từng dòng ghi role, page, chức năng, endpoint/method, permission, FE/API state, khả năng demo và lý do. Các menu ngoài allowlist được khảo sát tĩnh, không gọi API. Nguồn: router/navigation/resources/schema và controller/service. Bản business-api-contracts.md cũ tự ghi “Historical reference only”; không dùng mock DTO/status cũ làm contract hiện hành.

Đã đọc/đối chiếu các cập nhật và giới hạn trong business-api-contracts.md, implementation-plan.md, implementation-status.md, demo-readiness.md, integration-gaps.md, page-function-guide.md; nhật ký nguồn/GET allowlist tại [business-readiness-source-review.md](business-readiness-source-review.md). Các số liệu fixture/READY_STATIC lịch sử không được tính thành runtime hôm nay.

## Giai đoạn B — RD_MANAGER

### Pilot listing/readiness

- `GET /api/v1/pilots` → PilotService.ListAsync → EndDueAsync (line 70).
- `GET /api/v1/pilots/{id}`, `/{id}/readiness`, `/{id}/evaluation` → FindAsync → EndDueAsync (line 319). EndDueAsync (285–295) có thể End(), Audit(), SaveChangesAsync().
- Không tìm được API listing pilot riêng có read path thuần đọc trong controller hiện tại. Không gửi các GET pilot, kể cả khi có ID. Dashboard RD_MANAGER phụ thuộc Pilots.List nên vẫn SAFETY BLOCKED cho số liệu pilot.
- **Có phương án chỉ đọc cho coverage chi nhánh:** `GET /api/v1/branch-launch-status`, LaunchStatusService.ListAsync → AsNoTracking/ToDtosAsync, không SaveChanges/EndDue. Đã thử với RD_MANAGER và BRANCH_MANAGER khi được phép; xem bảng runtime. Nó không phải pilot listing và không chứng minh pilot evaluation/decision.
### Course approval

| Mục | Expected trước đây | Actual hiện hành | Kết luận |
| --- | --- | --- | --- |
| Người duyệt course | Brief trước đây mong RD_MANAGER duyệt | CoursesController.cs:85 `[Authorize(Policy = Policies.TrainingManager)]` cho POST /api/v1/courses/{id}/approve; return tương tự ở line 90 | Requirement mismatch cần owner chốt; nếu brief cũ là chuẩn thì BE authorization phải thay đổi trước. Chưa có SRS chính thức để tuyên bố policy nào là quyết định sản phẩm cuối cùng. |
| FE menu/route | Có approve workspace cho RD nếu yêu cầu cũ còn hiệu lực | navigation + canCall(Courses.Approve) chỉ cấp TM; RD /courses/pending redirect dashboard | FE đang tuân controller; không có bằng chứng FE tự làm mất quyền đã được BE cấp. |
| Workflow | Duyệt nội dung course | Trainer biên soạn DRAFT → Submit PENDING_APPROVAL → TM Approve PUBLISHED hoặc Return DRAFT | Chỉ đọc code và form; không gửi approve/return. RD duyệt/phát hành SOP là workflow khác. |

File liên quan: ../backend/src/BrewForge.Api/Controllers/CoursesController.cs:85; ../backend/src/BrewForge.Api/Auth/Policies.cs; ../backend/src/BrewForge.Application/Courses/CourseService.cs:377–406; src/services/backend/schema.ts Courses.Approve/Return; src/app/router.tsx courses/pending; src/constants/navigation.ts; src/features/workspace/resources.ts. page-function-guide.md §9.1/9.3 và demo-readiness.md cũng nêu RD approval chưa được BE cấp. Không đổi permission để pass.

## Giai đoạn C — bằng chứng runtime chi tiết

| Role | Page | Chức năng | Endpoint | Method | Permission | Trạng thái FE | Trạng thái API | Khả năng demo | Lý do / phạm vi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADMIN | /admin/recipes | Recipe list | /api/v1/recipes | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| ADMIN | /admin/recipes/12 | Recipe detail | /api/v1/recipes/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| ADMIN | /admin/recipes/:id | SOP version list | /api/v1/recipes/{id:long}/versions | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| ADMIN | /admin/versions/12 | SOP version detail | /api/v1/recipe-versions/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| ADMIN | /admin/courses | Course list | /api/v1/courses | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/courses/:id | Course detail | /api/v1/courses/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/courses/:id | Course modules | /api/v1/courses/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/courses/:id?section=quiz | Quiz configuration detail | /api/v1/courses/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/courses/:id?section=quiz | Quiz question list | /api/v1/courses/{id:long}/quiz/questions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/question-bank | Question bank list | /api/v1/question-bank | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/question-bank/:id | Question bank detail | /api/v1/question-bank/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/assignments | Training assignment list | /api/v1/assignments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/learning | My learning list | /api/v1/me/enrollments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/learning/:id | Enrollment detail | /api/v1/enrollments/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/learning/:id | Enrollment lesson modules | /api/v1/enrollments/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/learning/:id | Enrollment eligibility | /api/v1/enrollments/{id:long}/eligibility | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/learning/:id/results | Quiz attempt history | /api/v1/enrollments/{id:long}/quiz-attempts | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/learning/:id/quiz | Learner quiz detail (eligible only) | /api/v1/enrollments/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | No owned eligible enrollment from list; quiz gate not bypassed |
| ADMIN | /admin/learning-path | Learning path | /api/v1/learning-paths/{userId:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/training-progress | Training progress report | /api/v1/dashboards/training-progress | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/certificates | Certificate list | /api/v1/me/certificates | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/certificates/:id | Certificate detail | /api/v1/certificates/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/branches | Branch list | /api/v1/branches | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| ADMIN | /admin/branches/1 | Branch detail | /api/v1/branches/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| ADMIN | /admin/branch-performance | Branch performance dashboard | /api/v1/dashboards/branch-performance | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/branch-audits | Audit list | /api/v1/branch-audits | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| ADMIN | /admin/branch-audits/:id | Audit detail | /api/v1/branch-audits/{id:long} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| ADMIN | /admin/branch-audits/:id | Audit evidence content (no separate list API) | /api/v1/branch-audits/evidence/{**key} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| ADMIN | /admin/launch | Branch readiness / launch coverage | /api/v1/branch-launch-status | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| ADMIN | /admin/pilots | Pilot List | /api/v1/pilots | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| ADMIN | /admin/pilots | Pilot Get | /api/v1/pilots/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| ADMIN | /admin/pilots | Pilot Readiness | /api/v1/pilots/{id:long}/readiness | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| ADMIN | /admin/pilots | Pilot Evaluation | /api/v1/pilots/{id:long}/evaluation | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| ADMIN | /admin/courses/pending | Course approval | /api/v1/courses/{id:long}/approve | POST | DENY | Not opened | Not called | PERMISSION BLOCKED | Mutation explicitly excluded. Current contract allows TRAINING_MANAGER only; old RD_MANAGER requirement unresolved. |
| ADMIN | /admin/branches | Create form validation (no submit) | /api/v1/branches | POST | ALLOW | Form rendered; empty input rejected by actual validator; no submission | NOT SENT (validation only) | READY | Readiness of local form only; persistence/workflow is not tested |
| ADMIN | /admin/recipes | Recipe pagination second page | /api/v1/recipes | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| RD_SPECIALIST | /rd-specialist/recipes | Recipe list | /api/v1/recipes | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_SPECIALIST | /rd-specialist/recipes/12 | Recipe detail | /api/v1/recipes/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_SPECIALIST | /rd-specialist/recipes/:id | SOP version list | /api/v1/recipes/{id:long}/versions | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| RD_SPECIALIST | /rd-specialist/versions/12 | SOP version detail | /api/v1/recipe-versions/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_SPECIALIST | /rd-specialist/courses | Course list | /api/v1/courses | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/courses/:id | Course detail | /api/v1/courses/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/courses/:id | Course modules | /api/v1/courses/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/courses/:id?section=quiz | Quiz configuration detail | /api/v1/courses/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/courses/:id?section=quiz | Quiz question list | /api/v1/courses/{id:long}/quiz/questions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/question-bank | Question bank list | /api/v1/question-bank | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/question-bank/:id | Question bank detail | /api/v1/question-bank/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/assignments | Training assignment list | /api/v1/assignments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/learning | My learning list | /api/v1/me/enrollments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/learning/:id | Enrollment detail | /api/v1/enrollments/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/learning/:id | Enrollment lesson modules | /api/v1/enrollments/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/learning/:id | Enrollment eligibility | /api/v1/enrollments/{id:long}/eligibility | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/learning/:id/results | Quiz attempt history | /api/v1/enrollments/{id:long}/quiz-attempts | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/learning/:id/quiz | Learner quiz detail (eligible only) | /api/v1/enrollments/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | No owned eligible enrollment from list; quiz gate not bypassed |
| RD_SPECIALIST | /rd-specialist/learning-path | Learning path | /api/v1/learning-paths/{userId:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/training-progress | Training progress report | /api/v1/dashboards/training-progress | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/certificates | Certificate list | /api/v1/me/certificates | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/certificates/:id | Certificate detail | /api/v1/certificates/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/branches | Branch list | /api/v1/branches | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_SPECIALIST | /rd-specialist/branches/1 | Branch detail | /api/v1/branches/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_SPECIALIST | /rd-specialist/branch-performance | Branch performance dashboard | /api/v1/dashboards/branch-performance | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/branch-audits | Audit list | /api/v1/branch-audits | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/branch-audits/:id | Audit detail | /api/v1/branch-audits/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/branch-audits/:id | Audit evidence content (no separate list API) | /api/v1/branch-audits/evidence/{**key} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/launch | Branch readiness / launch coverage | /api/v1/branch-launch-status | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_SPECIALIST | /rd-specialist/pilots | Pilot List | /api/v1/pilots | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| RD_SPECIALIST | /rd-specialist/pilots | Pilot Get | /api/v1/pilots/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| RD_SPECIALIST | /rd-specialist/pilots | Pilot Readiness | /api/v1/pilots/{id:long}/readiness | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| RD_SPECIALIST | /rd-specialist/pilots | Pilot Evaluation | /api/v1/pilots/{id:long}/evaluation | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| RD_SPECIALIST | /rd-specialist/courses/pending | Course approval | /api/v1/courses/{id:long}/approve | POST | DENY | Not opened | Not called | PERMISSION BLOCKED | Mutation explicitly excluded. Current contract allows TRAINING_MANAGER only; old RD_MANAGER requirement unresolved. |
| RD_SPECIALIST | /rd-specialist/recipes | Create form validation (no submit) | /api/v1/recipes | POST | ALLOW | Form rendered; empty input rejected by actual validator; no submission | NOT SENT (validation only) | READY | Readiness of local form only; persistence/workflow is not tested |
| RD_SPECIALIST | /rd-specialist/recipes | Recipe pagination second page | /api/v1/recipes | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| RD_MANAGER | /rd-manager/recipes | Recipe list | /api/v1/recipes | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/recipes/12 | Recipe detail | /api/v1/recipes/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/recipes/:id | SOP version list | /api/v1/recipes/{id:long}/versions | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| RD_MANAGER | /rd-manager/versions/12 | SOP version detail | /api/v1/recipe-versions/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/courses | Course list | /api/v1/courses | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/courses/4 | Course detail | /api/v1/courses/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/courses/:id | Course modules | /api/v1/courses/{id:long}/modules | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| RD_MANAGER | /rd-manager/courses/:id?section=quiz | Quiz configuration detail | /api/v1/courses/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/courses/:id?section=quiz | Quiz question list | /api/v1/courses/{id:long}/quiz/questions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/question-bank | Question bank list | /api/v1/question-bank | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/question-bank/:id | Question bank detail | /api/v1/question-bank/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/assignments | Training assignment list | /api/v1/assignments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/learning | My learning list | /api/v1/me/enrollments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/learning/:id | Enrollment detail | /api/v1/enrollments/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/learning/:id | Enrollment lesson modules | /api/v1/enrollments/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/learning/:id | Enrollment eligibility | /api/v1/enrollments/{id:long}/eligibility | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/learning/:id/results | Quiz attempt history | /api/v1/enrollments/{id:long}/quiz-attempts | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/learning/:id/quiz | Learner quiz detail (eligible only) | /api/v1/enrollments/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | No owned eligible enrollment from list; quiz gate not bypassed |
| RD_MANAGER | /rd-manager/learning-path | Learning path | /api/v1/learning-paths/{userId:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/training-progress | Training progress report | /api/v1/dashboards/training-progress | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/certificates | Certificate list | /api/v1/me/certificates | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/certificates/:id | Certificate detail | /api/v1/certificates/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| RD_MANAGER | /rd-manager/branches | Branch list | /api/v1/branches | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/branches/1 | Branch detail | /api/v1/branches/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/branch-performance | Branch performance dashboard | /api/v1/dashboards/branch-performance | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/branch-audits | Audit list | /api/v1/branch-audits | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/branch-audits/:id | Audit detail | /api/v1/branch-audits/{id:long} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| RD_MANAGER | /rd-manager/branch-audits/:id | Audit evidence content (no separate list API) | /api/v1/branch-audits/evidence/{**key} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| RD_MANAGER | /rd-manager/launch | Branch readiness / launch coverage | /api/v1/branch-launch-status | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| RD_MANAGER | /rd-manager/pilots | Pilot List | /api/v1/pilots | GET | ALLOW | Not opened | Not called | SAFETY BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| RD_MANAGER | /rd-manager/pilots | Pilot Get | /api/v1/pilots/{id:long} | GET | ALLOW | Not opened | Not called | SAFETY BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| RD_MANAGER | /rd-manager/pilots | Pilot Readiness | /api/v1/pilots/{id:long}/readiness | GET | ALLOW | Not opened | Not called | SAFETY BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| RD_MANAGER | /rd-manager/pilots | Pilot Evaluation | /api/v1/pilots/{id:long}/evaluation | GET | ALLOW | Not opened | Not called | SAFETY BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| RD_MANAGER | /rd-manager/courses/pending | Course approval | /api/v1/courses/{id:long}/approve | POST | DENY | Not opened | Not called | PERMISSION BLOCKED | Mutation explicitly excluded. Current contract allows TRAINING_MANAGER only; old RD_MANAGER requirement unresolved. |
| RD_MANAGER | /rd-manager/recipes | Recipe pagination second page | /api/v1/recipes | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINER | /trainer/recipes | Recipe list | /api/v1/recipes | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/recipes/12 | Recipe detail | /api/v1/recipes/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/recipes/:id | SOP version list | /api/v1/recipes/{id:long}/versions | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINER | /trainer/versions/12 | SOP version detail | /api/v1/recipe-versions/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/courses | Course list | /api/v1/courses | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/courses/4 | Course detail | /api/v1/courses/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/courses/:id | Course modules | /api/v1/courses/{id:long}/modules | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINER | /trainer/courses/:id?section=quiz | Quiz configuration detail | /api/v1/courses/{id:long}/quiz | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINER | /trainer/courses/:id?section=quiz | Quiz question list | /api/v1/courses/{id:long}/quiz/questions | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINER | /trainer/courses/4?section=quiz | Quiz editor read-only tab | /api/v1/courses/{id:long}/quiz | GET | ALLOW | Rendered without runtime/API error | Covered above | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/question-bank | Question bank list | /api/v1/question-bank | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/question-bank/:id | Question bank detail | /api/v1/question-bank/{id:long} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| TRAINER | /trainer/assignments | Training assignment list | /api/v1/assignments | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/learning | My learning list | /api/v1/me/enrollments | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/assessment/9 | Enrollment detail | /api/v1/enrollments/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/learning/:id | Enrollment lesson modules | /api/v1/enrollments/{id:long}/modules | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINER | /trainer/learning/:id | Enrollment eligibility | /api/v1/enrollments/{id:long}/eligibility | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINER | /trainer/learning/:id/results | Quiz attempt history | /api/v1/enrollments/{id:long}/quiz-attempts | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINER | /trainer/learning/:id/quiz | Learner quiz detail (eligible only) | /api/v1/enrollments/{id:long}/quiz | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No owned eligible enrollment from list; quiz gate not bypassed |
| TRAINER | /trainer/learning-path | Learning path | /api/v1/me/learning-path | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/training-progress | Training progress report | /api/v1/dashboards/training-progress | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/certificates | Certificate list | /api/v1/me/certificates | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/certificates/5 | Certificate detail | /api/v1/certificates/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/branches | Branch list | /api/v1/branches | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/branches/1 | Branch detail | /api/v1/branches/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINER | /trainer/branch-performance | Branch performance dashboard | /api/v1/dashboards/branch-performance | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINER | /trainer/branch-audits | Audit list | /api/v1/branch-audits | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINER | /trainer/branch-audits/:id | Audit detail | /api/v1/branch-audits/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINER | /trainer/branch-audits/:id | Audit evidence content (no separate list API) | /api/v1/branch-audits/evidence/{**key} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINER | /trainer/launch | Branch readiness / launch coverage | /api/v1/branch-launch-status | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINER | /trainer/pilots | Pilot List | /api/v1/pilots | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINER | /trainer/pilots | Pilot Get | /api/v1/pilots/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINER | /trainer/pilots | Pilot Readiness | /api/v1/pilots/{id:long}/readiness | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINER | /trainer/pilots | Pilot Evaluation | /api/v1/pilots/{id:long}/evaluation | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINER | /trainer/courses/pending | Course approval | /api/v1/courses/{id:long}/approve | POST | DENY | Not opened | Not called | PERMISSION BLOCKED | Mutation explicitly excluded. Current contract allows TRAINING_MANAGER only; old RD_MANAGER requirement unresolved. |
| TRAINER | /trainer/courses | Create form validation (no submit) | /api/v1/courses | POST | ALLOW | Form rendered; empty input rejected by actual validator; no submission | NOT SENT (validation only) | READY | Readiness of local form only; persistence/workflow is not tested |
| TRAINER | /trainer/recipes | Recipe pagination second page | /api/v1/recipes | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINING_MANAGER | /training-manager/recipes | Recipe list | /api/v1/recipes | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/recipes/12 | Recipe detail | /api/v1/recipes/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/recipes/:id | SOP version list | /api/v1/recipes/{id:long}/versions | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINING_MANAGER | /training-manager/versions/12 | SOP version detail | /api/v1/recipe-versions/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/courses | Course list | /api/v1/courses | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/courses/4 | Course detail | /api/v1/courses/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/courses/:id | Course modules | /api/v1/courses/{id:long}/modules | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINING_MANAGER | /training-manager/courses/:id?section=quiz | Quiz configuration detail | /api/v1/courses/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/courses/:id?section=quiz | Quiz question list | /api/v1/courses/{id:long}/quiz/questions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/question-bank | Question bank list | /api/v1/question-bank | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/question-bank/:id | Question bank detail | /api/v1/question-bank/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/assignments | Training assignment list | /api/v1/assignments | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/learning | My learning list | /api/v1/me/enrollments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/enrollments/9 | Enrollment detail | /api/v1/enrollments/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/learning/:id | Enrollment lesson modules | /api/v1/enrollments/{id:long}/modules | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINING_MANAGER | /training-manager/learning/:id | Enrollment eligibility | /api/v1/enrollments/{id:long}/eligibility | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINING_MANAGER | /training-manager/learning/:id/results | Quiz attempt history | /api/v1/enrollments/{id:long}/quiz-attempts | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINING_MANAGER | /training-manager/learning/:id/quiz | Learner quiz detail (eligible only) | /api/v1/enrollments/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | No owned eligible enrollment from list; quiz gate not bypassed |
| TRAINING_MANAGER | /training-manager/learning-path | Learning path person lookup | /api/v1/users/lookup | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINING_MANAGER | /training-manager/learning-path | Learning path | /api/v1/learning-paths/{userId:long} | GET | ALLOW | Picker shell rendered; selected-person data verified by real GET | HTTP 200 | READY | API path verified for discovered user ID; picker selection workflow not exercised |
| TRAINING_MANAGER | /training-manager/training-progress | Training progress report | /api/v1/dashboards/training-progress | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/certificates | Certificate list | /api/v1/me/certificates | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/certificates/:id | Certificate detail | /api/v1/certificates/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/branches | Branch list | /api/v1/branches | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/branches/1 | Branch detail | /api/v1/branches/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINING_MANAGER | /training-manager/branch-performance | Branch performance dashboard | /api/v1/dashboards/branch-performance | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/branch-audits | Audit list | /api/v1/branch-audits | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/branch-audits/:id | Audit detail | /api/v1/branch-audits/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/branch-audits/:id | Audit evidence content (no separate list API) | /api/v1/branch-audits/evidence/{**key} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/launch | Branch readiness / launch coverage | /api/v1/branch-launch-status | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINING_MANAGER | /training-manager/pilots | Pilot List | /api/v1/pilots | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINING_MANAGER | /training-manager/pilots | Pilot Get | /api/v1/pilots/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINING_MANAGER | /training-manager/pilots | Pilot Readiness | /api/v1/pilots/{id:long}/readiness | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINING_MANAGER | /training-manager/pilots | Pilot Evaluation | /api/v1/pilots/{id:long}/evaluation | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINING_MANAGER | /training-manager/courses/pending | Course approval | /api/v1/courses/{id:long}/approve | POST | ALLOW | Not opened | Not called | SAFETY BLOCKED | Mutation explicitly excluded. Current contract allows TRAINING_MANAGER only; old RD_MANAGER requirement unresolved. |
| TRAINING_MANAGER | /training-manager/recipes | Recipe pagination second page | /api/v1/recipes | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINEE | /barista/recipes | Recipe list | /api/v1/recipes | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/recipes/:id | Recipe detail | /api/v1/recipes/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/recipes/:id | SOP version list | /api/v1/recipes/{id:long}/versions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/versions/:id | SOP version detail | /api/v1/recipe-versions/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/courses | Course list | /api/v1/courses | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/courses/:id | Course detail | /api/v1/courses/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/courses/:id | Course modules | /api/v1/courses/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/courses/:id?section=quiz | Quiz configuration detail | /api/v1/courses/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/courses/:id?section=quiz | Quiz question list | /api/v1/courses/{id:long}/quiz/questions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/question-bank | Question bank list | /api/v1/question-bank | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/question-bank/:id | Question bank detail | /api/v1/question-bank/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/assignments | Training assignment list | /api/v1/assignments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/learning | My learning list | /api/v1/me/enrollments | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINEE | /barista/learning/1 | Enrollment detail | /api/v1/enrollments/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINEE | /barista/learning/:id | Enrollment lesson modules | /api/v1/enrollments/{id:long}/modules | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINEE | /barista/learning/:id | Enrollment eligibility | /api/v1/enrollments/{id:long}/eligibility | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINEE | /barista/learning/:id/results | Quiz attempt history | /api/v1/enrollments/{id:long}/quiz-attempts | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| TRAINEE | /barista/learning/:id/quiz | Learner quiz detail (eligible only) | /api/v1/enrollments/{id:long}/quiz | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No owned eligible enrollment from list; quiz gate not bypassed |
| TRAINEE | /barista/learning-path | Learning path | /api/v1/me/learning-path | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINEE | /barista/training-progress | Training progress report | /api/v1/dashboards/training-progress | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/certificates | Certificate list | /api/v1/me/certificates | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINEE | /barista/certificates/4 | Certificate detail | /api/v1/certificates/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINEE | /barista/branches | Branch list | /api/v1/branches | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINEE | /barista/branches/1 | Branch detail | /api/v1/branches/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| TRAINEE | /barista/branch-performance | Branch performance dashboard | /api/v1/dashboards/branch-performance | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/branch-audits | Audit list | /api/v1/branch-audits | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/branch-audits/:id | Audit detail | /api/v1/branch-audits/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/branch-audits/:id | Audit evidence content (no separate list API) | /api/v1/branch-audits/evidence/{**key} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/launch | Branch readiness / launch coverage | /api/v1/branch-launch-status | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| TRAINEE | /barista/pilots | Pilot List | /api/v1/pilots | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINEE | /barista/pilots | Pilot Get | /api/v1/pilots/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINEE | /barista/pilots | Pilot Readiness | /api/v1/pilots/{id:long}/readiness | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINEE | /barista/pilots | Pilot Evaluation | /api/v1/pilots/{id:long}/evaluation | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| TRAINEE | /barista/courses/pending | Course approval | /api/v1/courses/{id:long}/approve | POST | DENY | Not opened | Not called | PERMISSION BLOCKED | Mutation explicitly excluded. Current contract allows TRAINING_MANAGER only; old RD_MANAGER requirement unresolved. |
| BRANCH_MANAGER | /store-manager/recipes | Recipe list | /api/v1/recipes | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/recipes/:id | Recipe detail | /api/v1/recipes/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/recipes/:id | SOP version list | /api/v1/recipes/{id:long}/versions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/versions/:id | SOP version detail | /api/v1/recipe-versions/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/courses | Course list | /api/v1/courses | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/courses/:id | Course detail | /api/v1/courses/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/courses/:id | Course modules | /api/v1/courses/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/courses/:id?section=quiz | Quiz configuration detail | /api/v1/courses/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/courses/:id?section=quiz | Quiz question list | /api/v1/courses/{id:long}/quiz/questions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/question-bank | Question bank list | /api/v1/question-bank | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/question-bank/:id | Question bank detail | /api/v1/question-bank/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/assignments | Training assignment list | /api/v1/assignments | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| BRANCH_MANAGER | /store-manager/learning | My learning list | /api/v1/me/enrollments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/enrollments/9 | Enrollment detail | /api/v1/enrollments/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| BRANCH_MANAGER | /store-manager/learning/:id | Enrollment lesson modules | /api/v1/enrollments/{id:long}/modules | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| BRANCH_MANAGER | /store-manager/learning/:id | Enrollment eligibility | /api/v1/enrollments/{id:long}/eligibility | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| BRANCH_MANAGER | /store-manager/learning/:id/results | Quiz attempt history | /api/v1/enrollments/{id:long}/quiz-attempts | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| BRANCH_MANAGER | /store-manager/learning/:id/quiz | Learner quiz detail (eligible only) | /api/v1/enrollments/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | No owned eligible enrollment from list; quiz gate not bypassed |
| BRANCH_MANAGER | /store-manager/learning-path | Learning path | /api/v1/learning-paths/{userId:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/training-progress | Training progress report | /api/v1/dashboards/training-progress | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| BRANCH_MANAGER | /store-manager/certificates | Certificate list | /api/v1/me/certificates | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/certificates/:id | Certificate detail | /api/v1/certificates/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| BRANCH_MANAGER | /store-manager/branches | Branch list | /api/v1/branches | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| BRANCH_MANAGER | /store-manager/branches/1 | Branch detail | /api/v1/branches/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| BRANCH_MANAGER | /store-manager/branch-performance | Branch performance dashboard | /api/v1/dashboards/branch-performance | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| BRANCH_MANAGER | /store-manager/branch-audits | Audit list | /api/v1/branch-audits | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| BRANCH_MANAGER | /store-manager/branch-audits/:id | Audit detail | /api/v1/branch-audits/{id:long} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| BRANCH_MANAGER | /store-manager/branch-audits/:id | Audit evidence content (no separate list API) | /api/v1/branch-audits/evidence/{**key} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| BRANCH_MANAGER | /store-manager/launch | Branch readiness / launch coverage | /api/v1/branch-launch-status | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| BRANCH_MANAGER | /store-manager/pilots | Pilot List | /api/v1/pilots | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| BRANCH_MANAGER | /store-manager/pilots | Pilot Get | /api/v1/pilots/{id:long} | GET | ALLOW | Not opened | Not called | SAFETY BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| BRANCH_MANAGER | /store-manager/pilots | Pilot Readiness | /api/v1/pilots/{id:long}/readiness | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| BRANCH_MANAGER | /store-manager/pilots | Pilot Evaluation | /api/v1/pilots/{id:long}/evaluation | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| BRANCH_MANAGER | /store-manager/courses/pending | Course approval | /api/v1/courses/{id:long}/approve | POST | DENY | Not opened | Not called | PERMISSION BLOCKED | Mutation explicitly excluded. Current contract allows TRAINING_MANAGER only; old RD_MANAGER requirement unresolved. |
| QUALITY_AUDITOR | /quality-auditor/recipes | Recipe list | /api/v1/recipes | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| QUALITY_AUDITOR | /quality-auditor/recipes/12 | Recipe detail | /api/v1/recipes/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| QUALITY_AUDITOR | /quality-auditor/recipes/:id | SOP version list | /api/v1/recipes/{id:long}/versions | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| QUALITY_AUDITOR | /quality-auditor/versions/12 | SOP version detail | /api/v1/recipe-versions/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| QUALITY_AUDITOR | /quality-auditor/courses | Course list | /api/v1/courses | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/courses/:id | Course detail | /api/v1/courses/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/courses/:id | Course modules | /api/v1/courses/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/courses/:id?section=quiz | Quiz configuration detail | /api/v1/courses/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/courses/:id?section=quiz | Quiz question list | /api/v1/courses/{id:long}/quiz/questions | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/question-bank | Question bank list | /api/v1/question-bank | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/question-bank/:id | Question bank detail | /api/v1/question-bank/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/assignments | Training assignment list | /api/v1/assignments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/learning | My learning list | /api/v1/me/enrollments | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/learning/:id | Enrollment detail | /api/v1/enrollments/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/learning/:id | Enrollment lesson modules | /api/v1/enrollments/{id:long}/modules | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/learning/:id | Enrollment eligibility | /api/v1/enrollments/{id:long}/eligibility | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/learning/:id/results | Quiz attempt history | /api/v1/enrollments/{id:long}/quiz-attempts | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/learning/:id/quiz | Learner quiz detail (eligible only) | /api/v1/enrollments/{id:long}/quiz | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | No owned eligible enrollment from list; quiz gate not bypassed |
| QUALITY_AUDITOR | /quality-auditor/learning-path | Learning path | /api/v1/learning-paths/{userId:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/training-progress | Training progress report | /api/v1/dashboards/training-progress | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| QUALITY_AUDITOR | /quality-auditor/certificates | Certificate list | /api/v1/me/certificates | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/certificates/:id | Certificate detail | /api/v1/certificates/{id:long} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| QUALITY_AUDITOR | /quality-auditor/branches | Branch list | /api/v1/branches | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| QUALITY_AUDITOR | /quality-auditor/branches/1 | Branch detail | /api/v1/branches/{id:long} | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| QUALITY_AUDITOR | /quality-auditor/branch-performance | Branch performance dashboard | /api/v1/dashboards/branch-performance | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| QUALITY_AUDITOR | /quality-auditor/branch-audits | Audit list | /api/v1/branch-audits | GET | ALLOW | Rendered without runtime/API error | HTTP 200 | READY | Real API and page rendered; read-only demo available |
| QUALITY_AUDITOR | /quality-auditor/branch-audits/:id | Audit detail | /api/v1/branch-audits/{id:long} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| QUALITY_AUDITOR | /quality-auditor/branch-audits/:id | Audit evidence content (no separate list API) | /api/v1/branch-audits/evidence/{**key} | GET | ALLOW | Not opened | Not called | DATA BLOCKED | No valid ID obtained from an authorized list response |
| QUALITY_AUDITOR | /quality-auditor/launch | Branch readiness / launch coverage | /api/v1/branch-launch-status | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | Controller role contract excludes this role; no request sent |
| QUALITY_AUDITOR | /quality-auditor/pilots | Pilot List | /api/v1/pilots | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| QUALITY_AUDITOR | /quality-auditor/pilots | Pilot Get | /api/v1/pilots/{id:long} | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| QUALITY_AUDITOR | /quality-auditor/pilots | Pilot Readiness | /api/v1/pilots/{id:long}/readiness | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| QUALITY_AUDITOR | /quality-auditor/pilots | Pilot Evaluation | /api/v1/pilots/{id:long}/evaluation | GET | DENY | Not opened | Not called | PERMISSION BLOCKED | PilotService read path calls EndDueAsync -> audit/SaveChanges; no request sent |
| QUALITY_AUDITOR | /quality-auditor/courses/pending | Course approval | /api/v1/courses/{id:long}/approve | POST | DENY | Not opened | Not called | PERMISSION BLOCKED | Mutation explicitly excluded. Current contract allows TRAINING_MANAGER only; old RD_MANAGER requirement unresolved. |
| QUALITY_AUDITOR | /quality-auditor/recipes | Recipe pagination second page | /api/v1/recipes | GET | ALLOW | Not opened | HTTP 200 | READY | Real GET succeeded; UI not yet verified |
| RD_SPECIALIST | /rd-specialist/recipes | Loading state (real GET delayed, no mocked response) | /api/v1/recipes | GET | ALLOW | Rendered loading then live response | Real GET forwarded after loading observation | READY | Real GET was held before forwarding; no response fulfillment/mock/error injection |

## Giai đoạn D — Frontend

- Loading: 1 lần quan sát LoadingState rồi chờ biến mất. Nếu request quá nhanh không thấy loading thì không giả lập để đánh PASS.
- Empty/filter: 12 check ghi nhận empty; search dùng GET thật với chuỗi không khớp, không tạo dữ liệu.
- Pagination: 6 check xác nhận response page=2/size=1/items. UI paging/page-size chỉ được tính nơi có ghi bằng chứng; không suy API paging là toàn bộ UX paging.
- Responsive: 8 route sample kiểm mobile390px, drawer mở/đóng/Escape, không horizontal overflow; desktop dùng Chromium. Không khẳng định mọi màn hình/tablet đã kiểm.
- Form/filter validation: 7 check. Mở dialog, kiểm field và gọi đúng validator hiện có với input rỗng trong browser; không submit form thay đổi. Filter date range là form GET và bị chặn local khi from>to.
- Detail pages dùng ID từ authorized response của cùng role. Nếu thiếu dữ liệu hoặc role không có list để tìm ID, giữ DATA BLOCKED; không dò ID hoặc mượn dữ liệu role khác để vượt ownership.
- API error state: ErrorState/Retry/ProblemDetails được đối chiếu source; không dựng mock lỗi/abort giả để chứng minh UI. Chỉ report lỗi thật nếu quan sát, và không khẳng định toàn bộ error recovery đã E2E.
- Response mapping: list/detail render checks dựa trên GET thật và việc không xuất hiện runtime/error/loading treo. Đây là smoke mapping; không đối chiếu mọi field/locale/mọi row của database.
- Role navigation: menu/guards đã có auth E2E; readiness áp dụng controller roles trước mọi GET. Không có quyền thì không gửi request.
- Không sửa source ứng dụng khi chưa chứng minh được nguyên nhân FE bug. Lượt này tập trung test harness và report; không sửa backend/database/seed.

## Gap và các bước demo chưa thể chạy

| Role | Page | Chức năng | Endpoint | Method | Permission | Trạng thái FE | Trạng thái API | Khả năng demo | Lý do / phạm vi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RD_MANAGER | /rd-manager/courses/pending | RD_MANAGER course approval under earlier product expectation | /api/v1/courses/{id}/approve | POST | DENY | Source reviewed; not a live mutation result | Controller/source evidence only | PERMISSION BLOCKED | Expected earlier brief: RD_MANAGER approves. Current controller + FE: TRAINING_MANAGER only. Product-owner decision needed; do not widen FE permissions. |
| TRAINING_MANAGER | /training-manager/training-progress | Training manager aggregate progress report | /api/v1/dashboards/training-progress | GET | DENY | Source reviewed; not a live mutation result | Controller/source evidence only | PERMISSION BLOCKED | Role excluded from this dashboard contract; assignments/enrollment detail are alternatives, not the same aggregate report. |
| ADMIN | No stock route | Stock loss dashboard UI | /api/v1/stock/loss-report | GET | Not available | Source reviewed; not a live mutation result | Controller/source evidence only | NOT IMPLEMENTED | Backend StockController exists; frontend has no stock route/menu consumer. API not called in this phase. |
| RD_MANAGER | No stock route | Stock loss dashboard UI | /api/v1/stock/loss-report | GET | Not available | Source reviewed; not a live mutation result | Controller/source evidence only | NOT IMPLEMENTED | Backend StockController exists; frontend has no stock route/menu consumer. API not called in this phase. |
| BRANCH_MANAGER | No stock route | Stock loss dashboard UI | /api/v1/stock/loss-report | GET | Not available | Source reviewed; not a live mutation result | Controller/source evidence only | NOT IMPLEMENTED | Backend StockController exists; frontend has no stock route/menu consumer. API not called in this phase. |
| TRAINER | Course quiz editor | Edit/delete existing quiz questions | No verified update/delete question endpoint | — | Not available | Source reviewed; not a live mutation result | Controller/source evidence only | BE BLOCKED | Current controller exposes list/add only for course quiz questions. No runtime mutation attempted; question bank editing is a separate feature. |
| TRAINEE | Certificates | Certificate PDF export/manual issue | No verified PDF/manual issue endpoint | — | Not available | Source reviewed; not a live mutation result | Controller/source evidence only | NOT IMPLEMENTED | Certificate GET exists; PDF/manual issuance does not. Certificates are automatic outcomes, not a UI mutation to invent. |
| TRAINER | Certificates | Certificate PDF export/manual issue | No verified PDF/manual issue endpoint | — | Not available | Source reviewed; not a live mutation result | Controller/source evidence only | NOT IMPLEMENTED | Certificate GET exists; PDF/manual issuance does not. Certificates are automatic outcomes, not a UI mutation to invent. |
| TRAINING_MANAGER | Enrollment review | Manager practical recording list/summary | /api/v1/enrollments/{id}/practical-videos | GET | DENY | Source reviewed; not a live mutation result | Controller/source evidence only | PERMISSION BLOCKED | Current list policy is TRAINEE/TRAINER; manager enrollment progress does not grant practical list/content access. |
| BRANCH_MANAGER | Enrollment review | Manager practical recording list/summary | /api/v1/enrollments/{id}/practical-videos | GET | DENY | Source reviewed; not a live mutation result | Controller/source evidence only | PERMISSION BLOCKED | Current list policy is TRAINEE/TRAINER; manager enrollment progress does not grant practical list/content access. |

- Audit list không có bản ghi ở các role được phép thì audit detail/evidence là DATA BLOCKED. Không upload ảnh hoặc tạo audit để lấp dữ liệu. Evidence không có standalone list API; URL lấy từ audit.items.evidenceUrl và chỉ mở endpoint nội bộ đã xác minh.
- Quiz learner chỉ được GET khi enrollment sở hữu có eligibility hợp lệ. Không hoàn thành lesson, nộp quiz, đổi enrollment state hoặc bypass quiz/practical gate để tạo điều kiện.
- BR-34 giữ nguyên: trainer phải có certificate VALID trên đúng SOP version cho khóa product; eligible-trainers/service checks là căn cứ, role TRAINER đơn lẻ không đủ. Chưa demo tạo lớp/lịch/thực hành nên không tuyên bố trainer đã đủ chứng chỉ.
- Chưa chạy chuỗi ghi thực tế: recipe author → validate/review/release SOP → trainer create/submit course → TM approve → assign/path assign → read completion/quiz → practical → certificate → pilot start/go-live/decision → audit/retraining/close. Các bước này bị loại do yêu cầu không ghi dữ liệu, không phải đã PASS.
- Corrective action học lại theo cycle: tài liệu hiện hành ghi thiếu relation/action–employee–enrollment cycle bền vững; PASSED cũ có thể thỏa close. Chỉ source finding; không gửi retrain/close để thử.
- Không chứng minh migrations/build hash của tiến trình BE đang chạy chỉ từ GET200. Runtime phản ánh API tại thời điểm kiểm thử, source là bằng chứng implementation độc lập.

## Chạy lại và bảo vệ dữ liệu

```powershell
node scripts/prepare-business-readiness.mjs
npm.cmd exec tsc -- --project e2e/tsconfig.json --noEmit
npm.cmd exec playwright -- test --config=playwright.business.config.ts --project=chromium --workers=1
node scripts/report-business-readiness.mjs
```

- Credentials chỉ từ .env.e2e.local qua helper auth sẵn có. Không ghi username/password/token/response body vào báo cáo. Không export storage state, không dùng mock login/API.
- Artifact business ở business-test-results/; kết quả cấu trúc đã loại payload ở e2e-private/business-results.json. Hai thư mục ignore Git, không ghi đè artifact auth. Chỉ screenshot che toàn trang nếu có FE/BE failure; trace đầy đủ tắt để tránh token/body/DOM.
- READINESS suite pass nghĩa các assertion an toàn hoàn tất; blocked features vẫn được giữ trạng thái blocked trong báo cáo, không bị chuyển READY.
- git diff/status đã được kiểm tra cuối lượt; thay đổi cũ trong schema/contracts/app và repository khác không bị reset/ghi đè.
