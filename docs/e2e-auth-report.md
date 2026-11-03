# BrewForge live authentication E2E

Executed roles: 8/8. PASS: 7. FAIL: 1.

| Role | Login | Dashboard | Sidebar | Permission | Logout |
| ---- | ----- | --------- | ------- | ---------- | ------ |
| ADMIN | PASS | PASS | PASS | PASS | PASS |
| RD_SPECIALIST | PASS | PASS | PASS | PASS | PASS |
| RD_MANAGER | PASS | PARTIAL (pilot read blocked) | PASS | PASS | PASS |
| TRAINER | PASS | PASS | PASS | PASS | PASS |
| TRAINING_MANAGER | PASS | PASS | PASS | PASS | PASS |
| TRAINEE | PASS | PASS | PASS | PASS | PASS |
| BRANCH_MANAGER | PASS | PASS | PASS | PASS | PASS |
| QUALITY_AUDITOR | PASS | PASS | PASS | PASS | PASS |

## Findings
- RD_MANAGER: coverage limitation, not an authentication failure. Dashboard pilot listing was blocked because workspace documentation identifies potentially state-changing reads. The suite deliberately returns nonzero for this incomplete coverage.
- Resolved environment issue: CORS allowed localhost:5173 but not 127.0.0.1:5173. Only the test frontend origin was corrected; no backend or authentication changes.
- Resolved test helper race: wait for response-body inspection before checking JWT structure and /auth/me role.
- All eight real accounts completed login, identity role verification, sidebar checks, selected permissions and logout/reload.
- Execution date: 2026-11-01 (Asia/Bangkok). Final Chromium headed run: 56.3 seconds, 7 passed, 1 incomplete/failed suite assertion.

## Categories
- FE bug: 0 observed classifications.
- BE authentication issue: 0 observed classifications.
- API Integration mismatch: 0 observed classifications.
- Invalid test credentials: 0 observed classifications.
- Environment issue: 0 observed classifications.

## Artifacts
- RD_MANAGER: D:/capstone/BrewForge/frontend/test-results/roles-live-RD-MANAGER-real-748be-n-and-read-only-permissions-chromium/failure-masked.png
- RD_MANAGER: D:/capstone/BrewForge/frontend/test-results/roles-live-RD-MANAGER-real-748be-n-and-read-only-permissions-chromium/trace-sanitized.zip

## Scope and limitations
- Chromium headed, one worker, no retry, real authentication only. No business create/update/delete/approve/release requests are permitted.
- Permission checks cover sidebar contract, selected permitted pages, cross-role guards, RD_MANAGER approval-route denial and one safe API GET denial per role. No mutation permission requests are sent.
- Detail pages needing real IDs, audit evidence downloads, readiness flows that trigger state-changing reads, and business mutations are not covered.
- If login fails, dashboard/sidebar/permissions/logout are NOT RUN rather than PASS.
- HTTP 401 is classified as credential rejection, not proof that the supplied password is incorrect. Backend logs/account status may be required.
- Failure screenshots mask the full page; traces omit DOM, screenshots, sources, network, console and resource payloads. Raw traces are deleted. Artifacts are ignored by Git.
- Login form: input#username (label Tên đăng nhập), input#password (label Mật khẩu), button Đăng nhập. Zod requires trimmed nonempty username and nonempty password; role=alert displays errors. POST username/password -> /auth/login, then /auth/me supplies active role; redirect uses role workspace dashboard.
- .env.e2e.local is explicitly ignored; credentials are loaded using Node process.loadEnvFile without modifying application env files. No EMAIL fallback, no stored auth-state export.

