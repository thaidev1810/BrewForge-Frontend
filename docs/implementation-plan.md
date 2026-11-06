# Kế hoạch tích hợp backend thực tế

Trạng thái 2026-10-13: đã thực hiện các bước 1–7 trong phạm vi endpoint/quyền BE có thật. Các kiểm tra frontend và giới hạn chưa kiểm tra live được ghi tại [implementation-status.md](implementation-status.md). G-01/G-04/G-05 vẫn bị chặn phía backend; không coi các luồng đó đã hoàn tất end-to-end.

Giữ React + TypeScript + Vite, npm, Redux Toolkit, Axios, Router, alias `@`, feature folders và component/theme hiện có. Không có AGENTS.md được tìm thấy. Các service mock cũ giữ làm lịch sử/reference, không được route mới gọi và mặc định tắt.

1. Authentication: username, 8 role BE, access/refresh rotation một lần đồng thời, logout revoke; session trong memory, reset cache khi đổi/thoát session. Layout/sidebar/router role guard.
2. Contract foundation: types/enums/endpoints trích từ controller/DTO C#, kiểm ma trận role, Axios error envelope, RTK Query cache; shared bảng/filter/paging/sort, form/nested array/lookup, action state/loading/error/success/binary/upload.
3. Catalog/admin: users, branches, ingredients, equipment, categories, products/settings.
4. SOP/recipe: authoring/import/version/copy/AI/repair/validation/review/release/rollback; course/module/lesson/quiz/checklist/bank và approve/return/rebuild.
5. Training: needs/assignments/classes/sessions/attendance, learner modules/eligibility/quiz/history/certificates/skills; trainer practical recording/evaluation/agenda và manager reset/close.
6. Operations: sales/POS/aggregate, pilot/readiness/evaluation/decision/launch, impact, quality/evidence/corrective/retraining, dashboards/audit/trace/export, push preference.
7. Kiểm tra: TypeScript, lint, behavior/contract tests dùng transport giả trong test (không demo data ứng dụng), build; browser/runtime thật chỉ nếu môi trường sẵn sàng, không chạy BE/migration để thử.

Blocked capabilities phải hiển thị lý do, không fake success: practical scheduling gate G-01; user/trainer/course lookup G-04/G-05; quiz update/delete, notification inbox, unsupported upload/PDF. UI chính dùng form fields có nhãn và typed requests, không yêu cầu người dùng dán JSON API.
