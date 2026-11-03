# Happy/unhappy experience suite

Use the existing `e2e/helpers/environment.ts` and `auth.ts`. Do not print `.env.e2e.local` or enable trace, video, HAR, storageState or snapshots on real sessions. Tests with real sessions create separate contexts and close them before reporting any sanitized failure. Isolated tests abort all real API requests and use TEST_ONLY Axios adapters; only their fixture dialogs are captured as PNG files.

From frontend, on the configured local FE/API and confirmed isolated test database:

```powershell
# Read-only eight-role suite, no business mutations:
npx.cmd playwright test --config=playwright.experience.config.ts live.spec.ts --grep "auth, safe pages"
# Independent fault-injection / shared UI regression:
npx.cmd playwright test --config=playwright.experience.config.ts isolated.spec.ts
# Only after operator confirms a private test/demo DB and authorizes business writes:
$env:E2E_ALLOW_BUSINESS_WRITES='true'
npx.cmd playwright test --config=playwright.experience.config.ts
node scripts/verify-experience-privacy.mjs
```

The complete suite runs sequentially. `business.spec.ts` creates a unique run-prefixed recipe/SOP/course; `continuation.spec.ts` uses its recorded owned IDs, authors/publishes that course and assigns/completes learning; `quality.spec.ts` creates a test-labelled audit and exercises retraining/closure gates; `validation-live.spec.ts` tests a deliberate duplicate of the same run recipe. The duplicate must return a real conflict. Never rerun continuation against unrelated IDs or edit existing data to make prerequisites pass. Missing data gates become BLOCKED/skip with downstream NOT_RUN.

Evidence is in ignored `e2e-private/experience-*.json`. No SQL or deletion cleanup is used: recipe/version/audit history is retained by the application. Keep the run ledger for review; use a separate test DB, never production. Practical video, certification, pilot/go-live/sales/POS and evidence uploads are not declared covered by the exercised learning or audit cases.

If a Vite instance has been used by Node SSR tests or has accumulated HMR changes, run fixture browser scripts against a fresh dedicated dev server (for example port 5175 with `--force`). Use the live origin allowed by CORS for real accounts; do not change `.env` or backend CORS to hide a test setup issue. This suite uses one worker, zero retries and state/response waits.
