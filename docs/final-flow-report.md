# BrewForge — tiếp tục kiểm thử live, 04/11/2026

Đã tiếp tục checkpoint `E2E_MW18Y5RK`, hoàn thành practical/video/certificate, đủ coverage **2/2**, go-live món **NEW**, sales/POS thật và đóng corrective action retraining. Hai nhánh còn BLOCKED: scheduler/end/decision phải chờ ngày kết thúc pilot; lớp gắn SOP cần thêm giảng viên được phép để chứng nhận giảng viên hiện có. Không tuyên bố đã kiểm thử toàn bộ ứng dụng.

Registry của lượt tiếp tục có **61 ca luồng**: **21 PASS_LIVE_UI, 37 PASS_LIVE_API, 1 PASS_ISOLATED, 2 BLOCKED, 0 FAIL**. Đây là ca có tên và assertion; số lần chạy file Playwright, HTTP và clicks không cộng vào tổng này. 17 ca baseline trước đó được giữ riêng, không cộng lại hoặc coi như vừa chạy lại.

Bảng đầy đủ: [flow registry, prerequisites, source operations và router inventory](final-flow-coverage.md). Checkpoint riêng: `frontend/e2e-private/final-flows-manifest.json`; ID, quan hệ, trạng thái và bước tiếp theo được lưu sau mỗi luồng. Không lưu credentials hoặc auth state.

## Môi trường và phạm vi

- Root `main`; FE `feat/trainflow`, HEAD `e9e74aff309bb06f7707407a71fb142a2e92f7c6`; BE HEAD `33e2ed273b7fbb91ada2c0bbaf43a3cc4a3ed9d6`. Giữ thay đổi staged/unstaged/untracked hiện có. BE chỉ đọc và worktree vẫn sạch. Runtime không công bố build hash, nên không dùng HTTP thành công để khẳng định build đang chạy trùng HEAD.
- Live FE `http://localhost:5173`, API `http://localhost:5113/api/v1`; destination được kiểm tra trước login/writes. Dùng tám role đã cấp, context riêng, một worker, không retry tự động. Người vận hành xác nhận DB test riêng, business writes và cho phép thêm một TRAINEE run-owned. Không sửa BE, `.env`, credentials, DB/clock; không migration/seed/start BE hay commit/push.
- Kiểm tra channel: email trong cấu hình hiện có chưa được cấu hình; không có Local/launch/inherited override được phát hiện trong phạm vi kiểm tra; runtime push disabled. Đây là bằng chứng cấu hình, không phải chứng minh delivery bên ngoài. Không subscribe/send push, không gọi LLM/email provider. Inbox nội bộ có thể được tạo bởi workflow; chỉ đánh dấu đọc inbox tài khoản phụ do lượt này tạo.
- Real sessions tắt trace, screenshot, video, HAR, storageState. Helper chỉ lưu tên operation/role/status/counter; không lưu headers, body hay URL chứa danh tính. Context được đóng trước lỗi đã chuẩn hóa. File CSV báo cáo được đọc stream để xác minh rồi bỏ, không lưu tên nhân viên.

## Dependency graph và các nhánh hợp lệ

```mermaid
flowchart TD
  A[Course PUBLISHED và learning-path prerequisites] --> B[Direct assignment hoặc class attendance]
  T[Trainer certificate VALID đúng SOP] --> C[Bound-SOP class/session BR-34]
  C --> B
  B --> D[Modules complete: ELIGIBLE]
  D --> V[Trainer khác learner upload recording]
  D --> Q[Quiz pass current cycle]
  Q --> S[Practical scheduling]
  Q --> E[Evaluate recording theo checklist]
  V --> E
  E --> F[Enrollment PASSED + certificate VALID]
  F --> G[Exact-SOP active staff coverage 2]
  G --> H[NEW pilot readiness và go-live]
  H --> I[Sales + POS CSV/XLSX]
  I --> J[Interim evaluation]
  J --> K[Actual EndDate elapsed: scheduler/end/decision]
  F --> R[Retraining action close gate]
```

Direct assignment không bị buộc vào lớp. BR-34 kiểm certificate giảng viên khi thêm session của lớp gắn SOP; lớp INDUCTION không gắn SOP có nhánh hợp lệ riêng. Recording được BE cho phép khi ELIGIBLE trước quiz; scheduling/evaluation còn kiểm quiz. Không đổi gate để ép mọi nhánh giống nhau.

## Kết quả chính trên server thật

| Luồng | Bằng chứng và giới hạn |
| --- | --- |
| Practical | Reuse enrollment12/course8/SOP15, xác minh current cycle/quiz. Không video →409; UI tạo schedule2; file TXT bị FE chặn; WebM thật upload201. |
| Playback | Protected media load/play/seek qua UI; 1440/768/390/360px không tràn trang. GET Range bytes0–99 thật trả206, đúng100 bytes và CORS expose Content-Range. UI hiện tải blob đầy đủ trước phát; không khẳng định UI stream từng đoạn. |
| Evaluation/certificate | UI chọn video1, checklist và submit bằng TRAINER. Server tạo evaluation1, enrollment12 PASSED, certificate8 VALID; đúng learner/enrollment/SOP/assessor, issuer có giá trị. Double-click ở UI và refetch không tạo thêm certificate cho enrollment này. Trainee xem/F5 giữ kết quả. Schedule2 đã COMPLETED qua UI sau đánh giá. |
| Retraining | Reuse action3/audit3. Baseline close409 RETRAINING_INCOMPLETE; sau lần pass hiện tại, close thật trả CLOSED. Không bỏ employee hoặc tắt retrainingRequired. Ca này không chứng minh BE đã sửa nguy cơ dùng PASSED lịch sử để đóng action mà không học lại, finding trước vẫn cần xác nhận yêu cầu nghiệp vụ. |
| NEW pilot | recipe16 origin NEW, SOP15 RELEASED; pilot1 tạo API_SETUP, start qua public API, RUNNING, minCertifiedStaff giữ2. Server lúc đầu đếm1/2 và từ chối go-live409; start lặp409, ROLLOUT sớm409 BR-27. |
| Coverage/go-live | ADMIN tạo TRAINEE19 theo phép bổ sung; API_SETUP học INDUCTION course9/enrollment14 trước PRODUCT course8/enrollment17. Hoàn thành lessons/quiz/video/evaluation qua public workflow; server cấp certificate9/10. Readiness đếm2/2 distinct active staff đúng SOP; UI go-live200, launch10 LIVE. Không gọi cả chuỗi học setup này là UI pass. |
| Sales/POS | UI tạo sale1 5 cups; CSV hợp lệ accepted1/rejected0; partial accepted1/rejected6, đối chiếu row3–8: duplicate, mã món lạ, ngày31/02, số âm, trước LIVE, tương lai. Real XLSX accepted1, cuối cùng chỉ một row branch/drink/day lưu11 cups, SOP15; aggregate11 và F5. |
| Idempotency | API helper gửi lại đúng file và key lấy từ submission UI → cùng job/replayed=true; đổi payload cùng key →409 IDEMPOTENCY_KEY_MISMATCH. Không thay key để né conflict. Lost-response UI được kiểm riêng bằng TEST_ONLY regression, không coi như bằng chứng live race. |
| Import history | Giữ nguyên GUID job ID; ImportResult GET thật và UI deep link/F5 hiển thị job/accepted1. Lần retest POS vẫn thay thế cùng row test về11 cups, không tạo duplicate row. |
| Pilot evaluation | Interim RUNNING evaluation đọc đúng branch cupsTotal11. StartDate2026-11-04, EndDate2026-11-11 theo GET thật. Final scheduler/end/decision chưa chạy; đợi sau EndDate theo thời gian server, dự kiến từ12/11, kiểm lại state trước quyết định. |

Fixture tạo bằng Chromium canvas/MediaRecorder: WebM VP8 thật, 640×360, khoảng2.893s/33KB; kiểm container, decode/play/seek bằng HTMLMediaElement trước upload. PNG synthetic cùng kích thước. Hiển thị “BrewForge automated technical test”, không có người thật hoặc PII. Mọi evaluation/certificate ở đây là **test data kỹ thuật**, không chứng minh năng lực nhân viên. Không dùng mock response trong các luồng live.

## Luồng phụ và negative cases

- Course return/comment/resubmit/RD approve; lớp INDUCTION course10/class3/session1/PRESENT attendance, sau đó class CLOSED. Learning-path prerequisite được đọc từ server và hoàn thành hợp lệ.
- Quiz sai/retake đến LOCKED, TM reset, học/quiz lại. Recording4 cycle cũ bị evaluation409 và không xuất hiện trong options UI. Practical fail chưa có certificate; reuse recording đã chấm bị409; recording mới pass có certificate11. Reschedule/cancel/recreate/complete lịch trên enrollment phụ.
- Wrong owner video404, TRAINEE upload403; bound-SOP session của trainer chưa được chứng nhận trả409 BR-34, class4 riêng đã CANCELLED. Wrong-branch audit404/sales403. Deactivate chỉ user19 làm session cũ401; ADMIN khôi phục ACTIVE, login mới và coverage2 được xác minh.
- WebM200MiB+1 có EBML padding bị FE chặn trước POST; chọn lại33KB upload201 đúng một lần. Enrollment19 riêng sau đó CLOSED, F5 không còn upload CTA. File oversize riêng đã xóa.
- Question bank create/copy/update/delete, question đã copy giữ nguyên; recipe copy draft16 manual repair/submit/reject, rollback draft17 chưa release. Current SOP15 của món LIVE giữ nguyên.
- Legacy recipe14 đã xác minh ownership và không có pilot active: release source18 hợp lệ làm course6 OUT_OF_DATE, rebuild→DRAFT trên source mới. Nhánh này độc lập với món NEW đang LIVE.
- Unused ingredient17: update range hợp lệ, range đảo400, deactivate; impact empty run commit thật và repeat409/UI bỏ action lặp. Category241/equipment8/product1 CRUD/lookup rồi INACTIVE; product trỏ đúng current SOP15. Empty branch4 update/close→CLOSED, roles8 và explicit user-ID lookup thật.
- Audit4 PASSED với PNG upload201, protected image decode640 ở360px; owned inbox read/read-all/unread0; compliance CSV UI có filters course8/SOP15/branch1, filename.csv và stream không rỗng. Skills.Mine, training/branch/course dashboards query thật có scope. Không coi đó là kiểm hết mọi filter/sort/page hoặc XLSX report export.

Inventory chứa **191 source API operations**, trong đó **108** có case/variant liên kết (29 UI,79 API), **83 NOT_RUN** có lý do; cùng **66 route templates** từ router/resource/report bindings. Đây là số source capabilities, không cộng vào61 ca luồng. Route có API evidence nhưng chưa có assertion browser riêng vẫn NOT_RUN ở bảng route. Stock API-only, external push/LLM, withdraw/cancel pilot đang LIVE, full trace/profile/history và các biến thể chưa kiểm đều được giữ rõ giới hạn. Auth F5/deep link/refresh/logout/race và layout có hồi quy isolated riêng; không đổi nhãn thành live chỉ vì test pass.

## FE fixes và phân loại findings

1. **FE: stale protected media khi đổi route.** TRAINER load video1 rồi SPA sang recording khác; trước sửa, blob của video cũ vẫn hiển thị, không yêu cầu tải nguồn mới. Repro thất bại trong isolated test sau khi sửa các lỗi helper. `ProtectedMedia` nay remount theo operation/params/kind, abort request cũ và revoke object URL; bỏ kết quả đến sau abort. Isolated repro và live SPA switch đều pass, recording mới decode640, mobile360 vừa trang.
2. **FE/UX: notice practical direct assignment.** Notice cũ luôn nói phải phụ trách lớp/session; nay phân biệt direct enrollment và class enrollment, vẫn nói rõ uploader đánh giá và BE kiểm gate. Live enrollment12 retest pass.

Không có lỗi BE mới được xác nhận từ các denial nói trên. BR-34, BR-27, current-cycle/video ownership, idempotency mismatch là expected denials. Không gọi việc direct assignment không đòi trainer certificate giống class là bypass do FE.

Các lần chạy harness thất bại được giữ ở `kind=diagnostic`, không tính vào active61 ca: Fold chưa mở, helper chạy trước auth bootstrap sau full navigation, sai role cho Product/dashboard, sai expectation INACTIVE cho Branch. Helper đã dùng cùng single-flight bootstrap của app; sửa actor/status theo source controller, giữ các assertions và chạy lại đến pass. Hai diagnostic rows lịch sử vẫn còn FAIL trong checkpoint để audit, không phải hai product failures bị bỏ qua. Job locator từng bị parse GUID thành số; harness đã giữ nguyên GUID và retest import history, locator số cũ được đánh dấu **không phải server ID**.

## Kiểm tra cuối

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS93: integration37, authoring36, session20, TEST_ONLY transports |
| `npm run build` | PASS; main chunk558.40KB, cảnh báo >500KB còn tồn tại |
| `node scripts/browser-authoring.mjs` | PASS74, isolated transport |
| `node scripts/browser-session.mjs` | PASS11, isolated HTTP interception |
| `node scripts/browser-smoke.mjs` | PASS5, public/login |
| Final-flow Playwright | 11 file live đã chạy đến pass riêng; isolated-media pass. File08 và04 được retest sau các thay đổi/checkpoint cuối. Không tuyên bố một lần replay cả suite từ đầu pass. |
| Privacy/checkpoint | Quét passwords/usernames cấu hình, JWT và generated-password patterns; không có auth captures; dữ liệu private ignored |
| Git | Diff whitespace check pass; root/FE branches giữ nguyên, BE worktree sạch |

Browser hồi quy chạy trên Vite riêng `127.0.0.1:5175 --force` sau Node SSR checks; không dùng stale HMR instance và không gửi business HTTP thật. FE5173 và API5113 do người dùng vận hành được giữ nguyên.

## Dữ liệu giữ lại và tiếp tục

| Entity | Checkpoint |
| --- | --- |
| Happy chain | recipe16/SOP15/course8/enrollment12/PASSED/evaluation1/certificate8 VALID |
| Pilot/launch/sales | pilot1 RUNNING, branch1, threshold2, launch10 LIVE, sale1 final11 cups |
| Retraining | audit3/action3 CLOSED |
| Additional learner | user19 ACTIVE; course9/enrollment14, course8/enrollment17 PASSED; certificate9/10 VALID |
| Secondary lifecycle | course10/class3 CLOSED/enrollment18 PASSED/certificate11; class4 CANCELLED |
| Upload guard | course11 PUBLISHED/enrollment19 CLOSED; small video retained, oversize local fixture removed |
| Auxiliary | ingredient17/category241/equipment8/product1 INACTIVE; empty branch4 CLOSED; audits4/5 retained |
| Version/impact | draft16 REJECTED, rollback17 DRAFT; legacy source18 RELEASED/course6 DRAFT rebuilt; empty impact COMMITTED |

Question-bank owned item đã DELETE qua API; bản copy trong course giữ lại. Không xóa lịch sử học/certificate/sales/audit. Extra learner giữ ACTIVE để coverage không tụt. Password tài khoản này chỉ sinh trong RAM; resume có thể ADMIN reset **chính owned account19** qua API sau xác minh identity, không sửa credentials chung hay file env. Không cleanup bằng SQL.

Lệnh và điều kiện chạy: [final-flows README](../e2e/final-flows/README.md). Chọn file theo manifest; không chạy mù toàn bộ mutating suite trên các trạng thái CLOSED/LIVE. Bước tiếp theo: sau EndDate, GET pilot1/readiness/evaluation, xác minh scheduler đã ENDED rồi quyết định bằng đúng role; giữ coverage2 và sales11. Bound-SOP class positive cần một TRAINER bổ sung được phép hoặc certificate trainer đúng SOP đã cấp qua workflow bình thường. Không tự mở rộng phép tạo TRAINEE thành phép tạo TRAINER.
