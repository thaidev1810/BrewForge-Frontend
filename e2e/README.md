# Live authentication tests

Run `npm run test:e2e:headed -- e2e/roles/live.spec.ts --project=chromium --workers=1`.

Node 22 loads the ignored `.env.e2e.local` via `process.loadEnvFile`; dotenv is unnecessary. Only `E2E_<ROLE>_USERNAME` and `E2E_<ROLE>_PASSWORD` are accepted. No EMAIL fallback. Missing-variable errors contain names only. Optional `E2E_API_BASE_URL` supplies Vite's API base when the test starts the dev server; a reused server must already use the intended API. No existing application env file is changed.

The default frontend origin is http://localhost:5173, matching the observed API CORS allowlist. 127.0.0.1:5173 did not pass CORS preflight. Tests are Chromium headed, one worker, no retries and use real login. Helpers are `getTestCredentials`, `loginAsRole`, and `logout` in e2e/helpers.

Login selectors come from the form source: input#username, input#password, and the button named Đăng nhập. Labels are Tên đăng nhập and Mật khẩu. Username is not assumed to be an email. Input values are set without Playwright fill/type call logs. Tracing is disabled through login; no auth state is exported.

A request guard aborts every business write and potentially state-changing pilot-list reads. Only auth login/refresh/logout writes are allowed. The RD_MANAGER dashboard depends on pilot listing, so it can only receive PARTIAL coverage in this phase. Selected safe pages, sidebar links, cross-role guards and a contract-denied GET are checked; no approve/release mutation is sent.

The checked-in permission matrix documents that TRAINING_MANAGER, rather than RD_MANAGER, owns course approval. The tests check the pending approval page for TRAINING_MANAGER and denial/redirect for RD_MANAGER.

Failures retain a fully masked screenshot and a minimal timing/action-only trace. Network payloads, headers, resources, DOM snapshots, screenshots, console messages, action arguments/results and sources are omitted from the retained trace. Temporary raw traces are deleted. These restricted traces intentionally cannot replay page appearance or show networking. PLAYWRIGHT_NO_COPY_PROMPT disables automatic page DOM snapshots in error context. Reports, test-results, auth state and private artifacts are ignored by Git. Never enable ordinary full traces or HTML reports for real credentials without redaction review.

The generated `docs/e2e-auth-report.md` records actual results, categories and artifact paths. NOT RUN is never treated as PASS. Tests do not cover business mutations or detail/evidence pages requiring approved existing IDs. The public smoke test remains separate.
