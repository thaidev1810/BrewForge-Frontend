# Continue BrewForge checkpoint

The starting checkpoint is loaded from ignored `e2e-private/experience-quality.json`; later runs reuse `e2e-private/final-flows-manifest.json`. Relationships and run-owned recipe code are checked before continuing. Never replace the IDs with unrelated user data. Entities and named flow cases are checkpointed after each transition. No auth state, password, token, server message, cookie or HTTP header is stored.

Approved test destination: local FE `http://localhost:5173`, API `http://localhost:5113/api/v1`. Each role has its own Chromium context. Requests to other API origins are blocked. Real session contexts close before failure reporting; tracing, screenshots, video, HAR and storageState are disabled. `isolated-media.spec.ts` aborts real API traffic and uses TEST_ONLY transport data, separately from live tests.

The operator explicitly authorized an additional run-owned TRAINEE. Its password is generated only in memory. On resume, ADMIN verifies its owned identity then resets only that account through the existing Users.Update API; the supplied E2E accounts are not edited. The additional learner is restored ACTIVE after the negative account test. No generated credentials go into `.env`, logs, manifests or files.

```powershell
cd D:\capstone\BrewForge\frontend
node scripts/prepare-final-fixtures.mjs
$env:E2E_ALLOW_BUSINESS_WRITES='true'
$env:E2E_ALLOW_ADDITIONAL_TRAINEE='true'
# Run a needed continuation file, not the earlier recipe-creation suite:
npx.cmd playwright test --config=playwright.final-flows.config.ts 01-practical.spec.ts
npx.cmd playwright test --config=playwright.final-flows.config.ts 02-pilot.spec.ts
npx.cmd playwright test --config=playwright.final-flows.config.ts 03-coverage.spec.ts
npx.cmd playwright test --config=playwright.final-flows.config.ts 04-sales.spec.ts
npx.cmd playwright test --config=playwright.final-flows.config.ts 05-secondary.spec.ts
npx.cmd playwright test --config=playwright.final-flows.config.ts 06-utilities.spec.ts
npx.cmd playwright test --config=playwright.final-flows.config.ts 07-scope.spec.ts
npx.cmd playwright test --config=playwright.final-flows.config.ts 08-retest.spec.ts isolated-media.spec.ts
node scripts/report-final-flows.mjs
node scripts/verify-final-flow-privacy.mjs
```

Use the manifest to select cases. The secondary negative class intentionally consumes quiz attempts and resets/closes its own enrollment; it is not intended to recreate a completed happy path blindly. Retain its history and IDs. Pilot start/end/decision is calendar-dependent: never change system time or database state. Keep the NEW recipe, coverage threshold 2 and legal training/certification path.

Current checkpoint is complete through LIVE sales, certification and CLOSED retraining. Read-only retest: `npx.cmd playwright test --config=playwright.final-flows.config.ts 08-retest.spec.ts isolated-media.spec.ts`. Files09 (oversize/retry/close),10 (owned catalog/report/schedule),11 (owned legacy rebuild) were also run to PASS. Do not replay05/09 on the already closed lifecycle, or02 on the already LIVE launch: select transitions from the manifest instead. File04 repeats imports on the same owned sales day and replaces its test row; it creates new import jobs and is a business write, not a read-only retest. Job IDs are retained as complete GUIDs.

Pilot1 runs 2026-11-04 through EndDate2026-11-11. Resume final end/decision only after the actual end period; the current RUNNING interim evaluation is not final decision proof. The additional account permission is TRAINEE only; bound-SOP teaching positive still needs a second authorized trainer. See [final report](../../docs/final-flow-report.md).

Fixtures are genuine WebM VP8 640×360, around three seconds, plus a synthetic PNG. Chromium MediaRecorder generates them, and HTMLMediaElement decoding/play/seek probes their metadata before upload. No personal media or external download is used. They prove upload/playback/evaluation mechanics only, not a real employee's skill. CSV/XLSX fixtures are built for the owned branch/recipe/day after real LIVE state; replay/mismatch use the same UI-generated idempotency key.

Notification side effects were source-reviewed; file email configuration is unconfigured and runtime push is disabled. No push subscription, SMTP send API or LLM provider call is made. Only owned-account inbox state is marked read. Source inventory lists every registered API capability with an explicit status/limitation; observed HTTP alone is not a full behavioral pass.
