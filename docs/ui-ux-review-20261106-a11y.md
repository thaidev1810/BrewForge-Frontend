# UI/UX Pro Max evidence — BrewForge 06/11/2026

<!-- UIUX-SUMMARY -->
Run **UIUX_20261106**. **3 UI findings fixed**, 7 matching before/after pairs (live and isolated contexts), 42 PNGs / 35 role-viewport records / 21 evidence case IDs. These are separate denominators, not extra workflows per click or width.

Final selected Playwright invocation: **18 passed,1 known BE G-19 failed,1 skipped** (20 wrapper tests). Typecheck/lint/E2E compilation, Node93, build and browser authoring74 pass. Session11 and public5 pass after the test-driver correction described below. Assertions and screenshots have separate roles: images show UI state; API outcomes are asserted by tests.

## Skill and actual search status

- Applied project skill: [SKILL.md](../.agents/skills/ui-ux-pro-max/SKILL.md), official CLI package **ui-ux-pro-max-cli2.15.0**, command `uipro init --ai codex`; actual help has no `--dry-run`. Staged preview was read before selective project setup; no force/global package/system install performed.
- Skill SHA256: `E5BAF9400D4347E5ED3EB1F6B99CD0B9BA545B8B0E507AABB2B87397BBF73EA1`; actual search.py SHA256 `8373E2DD2D560D9853EC116140DE0E0D5BEE45A6ABE5E041173C84E1C36A7F87`. Source README checked at upstream commit `b7d5353e0130feb8c5574ef1251f8a1db1873ccb`; installed bundled skill is2.15.0, not a claim that every upstream-main asset is identical.
- Search status: **EXECUTED_REVIEWED**. [Exact query/execution log](../ui-test-results/UIUX_20261106/skill-search.json). Python3.12.10 executed all six queries using the supplied absolute executable. Reviewed selections are recorded in the log; off-topic Smooth Scroll was rejected and retried with table handling. Initial fixes used Quick Reference while Python was unavailable; the additional summary-focus fix followed actual searches and fresh before captures.
- Stack verified from package.json: React19/TypeScript/Vite/Tailwind4, existing Lucide, Redux/RTK Query. No palette/font/landing redesign, no new icon/chart/animation library. No design-system MASTER existed in applicable project paths; none overwritten or generated.

| Query | Mode | Actual status |
| --- | --- | --- |
| keyboard focus modal | --domain ux | EXECUTED |
| error summary validation | --domain ux | EXECUTED |
| data table keyboard scroll | --domain ux | EXECUTED |
| dialog focus ref cleanup | --stack react | EXECUTED |
| table handling | --domain ux | EXECUTED |
| keyboard navigation | --domain ux | EXECUTED |

## Finding → guidance → fix → retest

| Finding/type | Role/route/viewport | Repro/expected | Guidance applied | Small fix/files | Verification |
| --- | --- | --- | --- | --- | --- |
| UIUX-DIALOG / FE_BUG | ADMIN /admin/ingredients /390×900 | Pending request disables controls; Tab leaves dialog. Focus must remain inside and return to opener after close. | SKILL §1 keyboard navigation/focus, §8 focus-management; React effect cleanup/ref guidance. Actual React results: Manage focus properly and Clean up effects; initial Quick Reference chronology stated above. | ActionDialog.tsx: mount-scoped opener restoration, current close ref, visible enabled tab stops, focusable aria-busy dialog fallback while pending. | Isolated deterministic pending transport: before assertion failed, after passed; live save201/conflict409 and shared consumers regressed. No delayed mock is claimed as a live API request. |
| UIUX-ERRORS / UX_IMPROVEMENT + accessibility | ADMIN /admin/ingredients /390×900 | Multiple inline errors have only a raw list at bottom; no linked overview. Focus the overview after multiple errors; focus a single invalid field directly; preserve draft. | Actual UX results: Focusable Error Summary, Error Messages and Error Placement. | ActionDialog.tsx: named summary, human field labels, links to editable field controls; retain inline errors; programmatically focus the visible summary for multiple errors and a field for one error. Summary links still focus the chosen field. Read-only course-preflight issues stay explanatory text. | Matching isolated and live-auth before/after; local invalid fields, actual duplicate409 preserves draft/focus; actual API400 leaves persisted brewing window unchanged. |
| UIUX-TABLE / FE_BUG accessibility | ADMIN /admin/ingredients /360×900 | Wide table scrolls by pointer but region lacks name/focus semantics for keyboard access. | SKILL §1 keyboard-nav and §5 responsive/table containment; actual Table Handling and Keyboard Navigation results, after rejecting the first off-topic table query. | DataView.tsx/index.css: named focusable scroll region, scope=col headers, visible focus using existing primary token. | Matching isolated/live-owned-filter before/after, ArrowRight actually moves scrollLeft; page width remains bounded; role/table/attendance/report consumer regressions. |

## Before / after / result evidence

All links below are checked against real PNG files. Before captures were made before source changes; helper refuses to overwrite before.png. After captures are made following successful assertions and may also be the retest image. No reconstructed before states. Each pair uses the same role, viewport and equivalent run-owned/synthetic data.

| Case | Role | Viewport | Scope | Route template | Before | After/retest | Result state |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CONSUMER-ADMIN | ADMIN | 1440×900 | LIVE_UI | /admin/ingredients | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-ADMIN/ADMIN-1440x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-ADMIN | ADMIN | 390×900 | LIVE_UI | /admin/ingredients | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-ADMIN/ADMIN-390x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-BRANCH_MANAGER | BRANCH_MANAGER | 1440×900 | LIVE_UI | /store-manager/sales | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-BRANCH_MANAGER/BRANCH_MANAGER-1440x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-BRANCH_MANAGER | BRANCH_MANAGER | 390×900 | LIVE_UI | /store-manager/sales | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-BRANCH_MANAGER/BRANCH_MANAGER-390x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-QUALITY_AUDITOR | QUALITY_AUDITOR | 1440×900 | LIVE_UI | /quality-auditor/branch-audits/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-QUALITY_AUDITOR/QUALITY_AUDITOR-1440x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-QUALITY_AUDITOR | QUALITY_AUDITOR | 390×900 | LIVE_UI | /quality-auditor/branch-audits/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-QUALITY_AUDITOR/QUALITY_AUDITOR-390x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-RD_MANAGER | RD_MANAGER | 1440×900 | LIVE_UI | /rd-manager/pilots/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-RD_MANAGER/RD_MANAGER-1440x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-RD_MANAGER | RD_MANAGER | 390×900 | LIVE_UI | /rd-manager/pilots/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-RD_MANAGER/RD_MANAGER-390x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-RD_SPECIALIST | RD_SPECIALIST | 1440×900 | LIVE_UI | /rd-specialist/versions/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-RD_SPECIALIST/RD_SPECIALIST-1440x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-RD_SPECIALIST | RD_SPECIALIST | 390×900 | LIVE_UI | /rd-specialist/versions/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-RD_SPECIALIST/RD_SPECIALIST-390x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-TRAINEE | TRAINEE | 1440×900 | LIVE_UI | /barista/certificates | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-TRAINEE/TRAINEE-1440x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-TRAINEE | TRAINEE | 390×900 | LIVE_UI | /barista/certificates | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-TRAINEE/TRAINEE-390x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-TRAINER | TRAINER | 1440×900 | LIVE_UI | /trainer/assessment/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-TRAINER/TRAINER-1440x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-TRAINER | TRAINER | 390×900 | LIVE_UI | /trainer/assessment/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-TRAINER/TRAINER-390x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-TRAINING_MANAGER | TRAINING_MANAGER | 1440×900 | LIVE_UI | /training-manager/enrollments/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-TRAINING_MANAGER/TRAINING_MANAGER-1440x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| CONSUMER-TRAINING_MANAGER | TRAINING_MANAGER | 390×900 | LIVE_UI | /training-manager/enrollments/:id | — | — [retest](../ui-test-results/UIUX_20261106/CONSUMER-TRAINING_MANAGER/TRAINING_MANAGER-390x900/retest.png) | Actual authenticated API-backed representative consumer; scoped navigation, shared tables/detail/form surfaces remain readable |
| MEDIA-RESULT | TRAINER | 360×900 | LIVE_UI | /trainer/videos/:id | — | — [retest](../ui-test-results/UIUX_20261106/MEDIA-RESULT/TRAINER-360x900/retest.png) | Protected synthetic WebM decodes640 and plays/seeks; no real person media |
| POS-PARTIAL-RESULT | BRANCH_MANAGER | 390×900 | LIVE_UI | /store-manager/sales/import/:jobId | — | — [retest](../ui-test-results/UIUX_20261106/POS-PARTIAL-RESULT/BRANCH_MANAGER-390x900/retest.png) | Actual owned persisted partial job accepted1/rejected6; no new imports/dates or idempotency keys fabricated |
| PUBLIC-LANDING | ANONYMOUS | 1440×900 | PUBLIC_UI | / | — | — [retest](../ui-test-results/UIUX_20261106/PUBLIC-LANDING/ANONYMOUS-1440x900/retest.png) | Existing design retained; no horizontal page overflow; no auth state present |
| PUBLIC-LANDING | ANONYMOUS | 360×900 | PUBLIC_UI | / | — | — [retest](../ui-test-results/UIUX_20261106/PUBLIC-LANDING/ANONYMOUS-360x900/retest.png) | Existing design retained; no horizontal page overflow; no auth state present |
| PUBLIC-LANDING | ANONYMOUS | 390×900 | PUBLIC_UI | / | — | — [retest](../ui-test-results/UIUX_20261106/PUBLIC-LANDING/ANONYMOUS-390x900/retest.png) | Existing design retained; no horizontal page overflow; no auth state present |
| PUBLIC-LANDING | ANONYMOUS | 768×900 | PUBLIC_UI | / | — | — [retest](../ui-test-results/UIUX_20261106/PUBLIC-LANDING/ANONYMOUS-768x900/retest.png) | Existing design retained; no horizontal page overflow; no auth state present |
| PUBLIC-LOGIN | ANONYMOUS | 1440×900 | PUBLIC_UI | /login | — | — [retest](../ui-test-results/UIUX_20261106/PUBLIC-LOGIN/ANONYMOUS-1440x900/retest.png) | Existing design retained; no horizontal page overflow; no auth state present |
| PUBLIC-LOGIN | ANONYMOUS | 360×900 | PUBLIC_UI | /login | — | — [retest](../ui-test-results/UIUX_20261106/PUBLIC-LOGIN/ANONYMOUS-360x900/retest.png) | Existing design retained; no horizontal page overflow; no auth state present |
| PUBLIC-LOGIN | ANONYMOUS | 390×900 | PUBLIC_UI | /login | — | — [retest](../ui-test-results/UIUX_20261106/PUBLIC-LOGIN/ANONYMOUS-390x900/retest.png) | Existing design retained; no horizontal page overflow; no auth state present |
| PUBLIC-LOGIN | ANONYMOUS | 768×900 | PUBLIC_UI | /login | — | — [retest](../ui-test-results/UIUX_20261106/PUBLIC-LOGIN/ANONYMOUS-768x900/retest.png) | Existing design retained; no horizontal page overflow; no auth state present |
| UIUX-CONFLICT | ADMIN | 390×900 | LIVE_UI | /admin/ingredients | — | — [retest](../ui-test-results/UIUX_20261106/UIUX-CONFLICT/ADMIN-390x900/retest.png) | Real duplicate409 UNIQUE; accessible field summary, code focus and draft retained |
| UIUX-DIALOG | ADMIN | 390×900 | ISOLATED_UI | /admin/ingredients | [before](../ui-test-results/UIUX_20261106/UIUX-DIALOG/ADMIN-390x900/before.png) | [after](../ui-test-results/UIUX_20261106/UIUX-DIALOG/ADMIN-390x900/after.png) — | Pending mutation: keyboard focus remains inside dialog |
| UIUX-ERRORS-LIVE | ADMIN | 390×900 | LIVE_UI | /admin/ingredients | [before](../ui-test-results/UIUX_20261106/UIUX-ERRORS-LIVE/ADMIN-390x900/before.png) | [after](../ui-test-results/UIUX_20261106/UIUX-ERRORS-LIVE/ADMIN-390x900/after.png) — | Authenticated actual-API page; local invalid submission preserves draft and links field errors |
| UIUX-ERRORS | ADMIN | 390×900 | ISOLATED_UI | /admin/ingredients | [before](../ui-test-results/UIUX_20261106/UIUX-ERRORS/ADMIN-390x900/before.png) | [after](../ui-test-results/UIUX_20261106/UIUX-ERRORS/ADMIN-390x900/after.png) — | Linked error overview focuses the first invalid field; draft retained |
| UIUX-SAVE | ADMIN | 390×900 | LIVE_UI | /admin/ingredients | — | — [retest](../ui-test-results/UIUX_20261106/UIUX-SAVE/ADMIN-390x900/retest.png) | Real UI POST201 persisted owned ingredient; no double submit |
| UIUX-SUMMARY-FOCUS-LIVE | ADMIN | 390×900 | LIVE_UI | /admin/ingredients | [before](../ui-test-results/UIUX_20261106/UIUX-SUMMARY-FOCUS-LIVE/ADMIN-390x900/before.png) | [after](../ui-test-results/UIUX_20261106/UIUX-SUMMARY-FOCUS-LIVE/ADMIN-390x900/after.png) — | Actual-auth form: multiple errors move focus to overview; single-field error/link retains field navigation and draft |
| UIUX-SUMMARY-FOCUS | ADMIN | 390×900 | ISOLATED_UI | /admin/ingredients | [before](../ui-test-results/UIUX_20261106/UIUX-SUMMARY-FOCUS/ADMIN-390x900/before.png) | [after](../ui-test-results/UIUX_20261106/UIUX-SUMMARY-FOCUS/ADMIN-390x900/after.png) — | Multiple errors focus linked overview; choosing a link focuses its field without losing draft |
| UIUX-TABLE-LIVE | ADMIN | 360×900 | LIVE_UI | /admin/ingredients | [before](../ui-test-results/UIUX_20261106/UIUX-TABLE-LIVE/ADMIN-360x900/before.png) | [after](../ui-test-results/UIUX_20261106/UIUX-TABLE-LIVE/ADMIN-360x900/after.png) — | Actual server-filtered owned data; named table region supports keyboard horizontal scroll |
| UIUX-TABLE | ADMIN | 360×900 | ISOLATED_UI | /admin/ingredients | [before](../ui-test-results/UIUX_20261106/UIUX-TABLE/ADMIN-360x900/before.png) | [after](../ui-test-results/UIUX_20261106/UIUX-TABLE/ADMIN-360x900/after.png) — | Named table region receives keyboard focus and scrolls internally without page overflow |

Consumer/public/result cases did not change UI in this round, so before is not required for them. For the pending timing defect, live-before is NOT_CAPTURED: a controlled unresolved adapter was used only in the isolated context; live save/conflict verifies actual API behavior separately. No unrelated screenshot is attached to API-only400 or BE G-19.

## Inventory and coverage limits

| UI family | Current evidence | Limit |
| --- | --- | --- |
| Landing/login/bootstrap | Four widths1440/768/390/360, public screenshots, actual eight-role login; Node/browser bootstrap and refresh regressions | Physical browser200% zoom NOT_RUN; shortcut probe left DPR/layout width unchanged. Reflow is not called real zoom. |
| Sidebar/header/breadcrumb/navigation | Representative real API page per8 roles, desktop/mobile and F5, redacted result image per role; isolated keyboard/tabs/deep-link/auth race | Not every concrete role/route/query combination |
| List/detail/filter/sort/pagination | Owned live search200, keyboard table scroll, shared74 checks include list/picker sort/page/draft behavior | All sort/page variants not rerun live |
| Form/lookup/validation/dialog | Before/after focus+summary, live201/409, API-only400; isolated picker/refetch/partial/timeout suites | Slow pending mutation is isolated, not server latency/concurrency proof |
| SOP editor/validation/review | Live own released SOP read + shared regressions | No new edit/review/release/cutover in this round |
| Course/module/lesson/quiz/checklist | Shared authoring74/Node36; existing trainer/practical and learner certificate consumers | New course lifecycle not repeated; historical course12 enrollment37 retained |
| Assignment/path/progress | TM existing enrollment read/F5/images and isolated partial/lookup/progress | No new assignments/class attendance/reset/lock cycle |
| Practical/video/evaluation/certificate | Live actual video bytes/decode640/play/seek and certificate list; modal/table shared changes | No new human competency claim or evaluation/certification mutation |
| Pilot/readiness/coverage | Existing owned pilot1 page and desktop/mobile screenshots | EndDate11/11 still in future; final decision/scheduler not forced |
| Sales/POS/results | Actual persisted owned partial job accepted1/rejected6 + screenshot, live sales-page read; isolated lost-response/same-key/row error regressions | No new Nov6 POS imports/replay/conflict payload writes; previous sales rows untouched |
| Audit/evidence/retraining | Actual synthetic protected evidence decode640; known G-19 assertion retained FAIL | New retraining obligation not created; historical CLOSE bug remains a BE item |
| Inbox/dashboard/reports/export | Shared data table/error consumers, authoring/session regression and per-role read surfaces | Full exports/inbox mutations/push/AI/provider delivery NOT_RUN; no new subscriptions/marks/read or external sends |

## Regression and environment

- FE HEAD4e9b8bb / branch feat/train; BE source33e2ed2 clean/read-only. Initial root staged/unstaged/untracked work preserved. Real API localhost:5113, live FE localhost:5173; isolated regressions use owned127.0.0.1:5175. Runtime build/schema identity remains unverified.
- Group1: isolated dialog/form2/2, live form/save/conflict2/2, browser authoring74 pass after fixing stale-router test driver. Group2: isolated3/3, live table1/1 and authoring74 pass. Final selected20-test run keeps G-19 failed and unsupported actual-zoom skipped; API400 and summary-focus follow-through are included in the final run; shared authoring74 was rerun after summary focus changed.
- browser-authoring test driver previously imported a separate HMR router instance: URL changed while old dashboard remained. Driver now sends history/popstate to the mounted app; original UI assertions remain.
- Final browser verification first stopped at the fixed60ms tab-focus check and observed two me calls on one reload. Tab verification now waits for the same required selected-and-focused state, retaining the assertion. Targeted authoring74 then passed. Session11 subsequently passed with its exact single-me assertion unchanged; the intermittent duplicate-me observation is retained as an unresolved stability risk, not attributed to a proven app or driver cause.
- browser-session previously intercepted all HTTP assets, so reload cancellation generated Invalid InterceptionId from Vite/font requests. Interception now covers only the two local API origins; all session assertions and unexpected-exception assertions remain. Targeted session11 passes.
- Node93 / typecheck / lint / E2E TS / build pass. Build hygiene: source scanning now excludes skill example folders; CSS went98.17KB→65.21KB, main464.06KB, landing45.23KB. This is build-only evidence, not a UI before/after claim.

## Privacy, data and blockers

- captureEvidence uses viewport images, fonts-ready, disabled screenshot animations/caret, active-identity and PII-column/field/password/email masking. Small mask blocks may cover header-name positions behind an overlay; meaningful fields/layout remain visible. No credentials/headers/storageState/raw HAR/trace exported. Binary artifacts ignored by Git.
- New owned ingredient codeUIUX261106 was saved through actual UI201 and soft-deactivated. Duplicate409 does not add a row; API range400 leaves saved values unchanged. Only IDs/status/counts in private metadata. Main released SOP/course/cert/launch/sales history retained.
- [Known G-19 evidence](../ui-test-results/UIUX_20261106/known-be-g19.json): original pre-action PASSED acceptance remains FAIL, not an expected-success test. Old action4 was read, not closed again; no backend code changed.
- Python search completed using the user-supplied Python312 executable, independent of PATH/py. Six actual queries were reviewed; initial Quick Reference work is distinguished from later search-guided summary focus. No Python/system software was installed by this task.
- Actual200% zoom remains NOT_RUN. The task-created duplicate root skill was retained when automatic review rejected its cleanup as blocked by policy; existing frontend skill files were preserved. Both skill directories are excluded from Tailwind scanning; no force/overwrite used.

## Re-run

```powershell
cd D:\capstone\BrewForge\frontend
$env:UI_EVIDENCE_PHASE="after"
$env:E2E_ALLOW_BUSINESS_WRITES="true"
npx.cmd playwright test --config=playwright.final-flows.config.ts 18-ui-evidence.spec.ts 19-ui-live-evidence.spec.ts 20-ui-consumers.spec.ts 17-retraining-obligation.spec.ts
# Skill: set only this process variable to an existing Python3 executable, no .env edit
$env:UIUX_PYTHON="<absolute-python3.exe-path>"
node scripts/search-uiux-guidance.mjs
node scripts/report-uiux-evidence.mjs
node scripts/verify-uiux-evidence.mjs
```

Do not replay before mode after changing code. New defects/runs need a new runId with genuine pre-fix capture. Skill files are read manually this session; reload/new session may be required for automatic discovery. Installing files does not make model knowledge permanent. See [reusable UI guidelines](../../docs/ui-ux-guidelines.md) and [historical product/BE backlog](product-backlog.md).
