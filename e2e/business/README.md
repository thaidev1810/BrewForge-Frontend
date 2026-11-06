# Business workflow readiness E2E

This suite is independent of `roles/live.spec.ts` and writes to a separate `business-test-results/` directory. Real credentials come from the existing helpers and `.env.e2e.local`. It never exports storage state or logs response bodies.

Run from frontend:

```powershell
node scripts/prepare-business-readiness.mjs
npm.cmd exec tsc -- --project e2e/tsconfig.json --noEmit
npm.cmd exec playwright -- test --config=playwright.business.config.ts --project=chromium --workers=1
node scripts/report-business-readiness.mjs
node scripts/verify-business-readiness-privacy.mjs
```

`prepare` reads current FE metadata and writes a source inventory; it does not regenerate the backend contracts or modify the backend. The allowlist was reviewed against controller/service code. Re-review call paths before adding operations or using a newer backend version. GET alone is not proof of safety.

The browser request gate forwards actual requests only. There are no fulfilled/mock responses. Auth login/refresh/logout are allowed; every business write and any GET not on the reviewed allowlist is aborted. Pilot list/detail/readiness/evaluation are excluded because they invoke EndDueAsync and may persist state/audit changes. Branch launch status is safe branch-coverage data, not an alternate pilot list.

Each role runs sequentially in headed Chromium. It probes authorized list/detail reads and visits supported pages, sampling IDs from that role's real list response only. Missing IDs and failed prerequisites stay blocked. No database/seed/server startup or certificate-rule bypass occurs. Form checks open/close a dialog and invoke the real local validator; they never click the business submit button. Filters can issue GETs only. Responsive checks sample one route per role at mobile390px.

Structured results in ignored `e2e-private/business-results.json` contain only feature/status metadata. Results replace a role's previous run; rerun the full suite for a complete current report. The report generator does not claim source inventory, mutation controls or skipped permission checks as live execution. A passing browser test means the safe assertions completed; it does not turn DATA/SAFETY/PERMISSION blockers into READY.

Ordinary traces/video/DOM snapshots are disabled for real sessions; failure screenshots mask the complete page. Source/static API gaps are separated from observed runtime HTTP failures. No sample names, account usernames/passwords or token values appear in Markdown output.
