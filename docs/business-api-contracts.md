# Business service contracts for future .NET integration

These are **frontend adapter contracts**, not confirmed backend routes or wire DTOs. No business HTTP endpoints, HTTP methods, pagination formats, or permission policies are assumed. Existing authentication configuration is unchanged. Agree the .NET contracts first, then map them to these interfaces using the existing Axios client.

## Service selection

`VITE_ENABLE_MOCK_SERVICES` controls business mocks independently of authentication:

- `true`: use the separate `mock*Service.ts` implementations.
- `false`: use explicitly registered API adapters only.
- Unset: mocks in Vite development, API adapters in production.

Copy `.env.example` to `.env.local` for an explicit capstone demo. Its mock flags are true, including for a production build. Set both mock flags false for a real integration and supply `VITE_API_BASE_URL`. Flags are build-time settings, not runtime role controls.

Each domain exports a typed `configure*Service(adapter)` function. Register adapters in application composition before dispatching business thunks. Without an adapter, business calls reject with a serializable error with status `501`; they never fall back to fixtures or issue guessed HTTP requests. The status is a frontend integration error, not a claimed server response.

Adapters implement:

```ts
interface DomainService<Entity, Command> {
  list(signal?: AbortSignal): Promise<Entity[]>
  get(id: string, signal?: AbortSignal): Promise<Entity>
  execute(command: Command, signal?: AbortSignal): Promise<Entity>
}
```

`BranchService` additionally implements `getSharedStandards(signal?)`. Its result is stored once in `state.branches.sharedStandards`. Adapters can translate approved server pagination/envelopes into the current complete-array interface. Do not return only one page as though it were the complete list; introduce explicit pagination state/contracts when that backend behavior is agreed.

IDs are opaque strings. Relationships use IDs rather than nested copies of other domain entities. Date-times returned to this layer are ISO 8601 UTC strings, compatible with .NET `DateTimeOffset`. JSON should be mapped to the camelCase TypeScript interfaces. Mutations return the complete authoritative saved entity, including generated ID, derived outcome, and timestamps. Detail calls must return the requested identity. This layer does not assume hard-delete support.

## Domain contracts

The linked type files define the full fields and discriminated command unions.

| Domain / store key | Type contract | Read results | Mutation commands |
| --- | --- | --- | --- |
| Products / `products` | [productTypes.ts](../src/features/products/productTypes.ts) | Product list/detail | `create`, `update`, `setActive` |
| Recipes / `recipes` | [recipeTypes.ts](../src/features/recipes/recipeTypes.ts) | Recipe list/detail | `create`, `update`, `archive` |
| SOPs / `sops` | [sopTypes.ts](../src/features/sops/sopTypes.ts) | SOP **version** list/detail | `create`, `update`, `submitForReview`, `requestChanges`, `approve`, `publish`, `deprecate`, `revise` |
| Courses / `courses` | [courseTypes.ts](../src/features/courses/courseTypes.ts) | Course list/detail | `create`, `update`, `archive` |
| Training assignments / `training` | [trainingTypes.ts](../src/features/training/trainingTypes.ts) | Assignment list/detail | `assign`, `start`, `complete`, `cancel` |
| Quiz attempts / `quizzes` | [quizTypes.ts](../src/features/quizzes/quizTypes.ts) | Append-only attempt list/detail | `record` |
| Practical assessments / `assessments` | [assessmentTypes.ts](../src/features/assessments/assessmentTypes.ts) | Append-only assessment list/detail | `record` |
| Certificates / `certificates` | [certificateTypes.ts](../src/features/certificates/certificateTypes.ts) | Certificate list/detail | `issue`, `revoke` |
| Branches / `branches` | [branchTypes.ts](../src/features/branches/branchTypes.ts) | Branch list/detail and global shared standards | `create`, `update`, `setActive` |

### Products and recipes

Products contain `name`, `description`, `category`, and `active`. Recipes reference `productId`, define positive ingredient quantities/units, a positive integer serving yield, and ordered instructions. The mock requires an active existing product when creating/updating a recipe. Recipes are archived rather than deleted; archived recipes cannot be edited. Existing historical relationships survive product deactivation.

### Global SOP versions

`SopVersion.id` is the exact version ID. `sopId` groups versions, and `version` is the revision number. There is one SOP catalog for every branch; no branch-specific SOP owner or equipment override exists. Equipment IDs must belong to the single shared equipment catalog.

The mock workflow is:

```text
DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> DEPRECATED
            |
            +-> CHANGES_REQUESTED -> IN_REVIEW
```

`update` edits only `DRAFT` or `CHANGES_REQUESTED`. `requestChanges` requires a review comment. Publication permanently locks the content; deprecation changes lifecycle metadata only. `revise` creates a new `DRAFT` with a new version ID from a published/deprecated version, preserving the original. The mock allows one unpublished working revision per SOP. These detailed transitions and draft concurrency policy are proposed development behavior and must be confirmed in the backend workflow.

The backend must enforce immutability and atomic version numbering even when callers bypass frontend guards. Published versions must remain resolvable forever for historical courses, assessments, and certificates. Old versions are not automatically deprecated when a new version is published.

### Courses and assignments

Creating/updating a course requires at least one exact SOP version currently `PUBLISHED`. `quizPassingScore` is a percentage from 0 to 100; creation defaults to **80**. Omitting it on update preserves the existing threshold. No full SOP content is duplicated in course state.

Assigning training records `courseId`, `traineeId`, `branchId`, optional `dueAt`, `assignedAt`, and status. The mock requires an active branch, a non-archived course, and a known demo user, and prevents duplicate active assignments for the same trainee/course. The backend must validate real identities and assignment permissions.

Assignments snapshot exact `sopVersionIds` and `quizPassingScore` at assignment time. These small historical snapshots deliberately differ from live course references: editing a course must not change the material/threshold already assigned. Attempts inherit this assignment snapshot. This revision-binding policy is provisional; adapt it to a confirmed course revision model if the backend supplies one.

Mock assignment transitions are `ASSIGNED -> IN_PROGRESS -> COMPLETED`, with cancellation allowed from `ASSIGNED` or `IN_PROGRESS`. Completion is a training progress marker, not a certification decision. It does not bypass the quiz/practical requirements for a certificate. Automatic completion rules are deferred.

### Quiz attempts and practical assessments

Quiz attempts are append-only and reference an assignment. The mock `record` input contains `correctAnswers` and `totalQuestions` solely to simulate results before a quiz delivery/grading API exists. It calculates an unrounded percentage, derives `passed` against the assignment's threshold, and records the exact SOP version IDs and threshold. Zero questions and invalid counts are rejected. Retakes create new attempts.

**Do not map client-supplied grading counts directly to a real learner-facing backend grading endpoint.** Agree the question/answer submission contract first; the server must validate answers and derive scores, attempt ownership, threshold, and pass status. The frontend result model can remain, while the command input/adapter evolves to the approved submission DTO. A trusted assessor result-recording API is another option if explicitly supported by the backend; it still needs server authorization and validation.

A practical assessment references one **passed quiz attempt**, which ties it to the same trainee, assignment, course, and SOP versions. Any failed critical criterion forces `criticalFailure=true` and `passed=false`, regardless of other criteria. The mock's conservative overall policy also requires every noncritical criterion to pass. Noncritical scoring/weights were not specified and must be agreed before real integration.

The mock accepts criterion definitions/results to exercise this rule. Real assessment rubric definitions, critical flags, assessor permissions, and outcomes must be authoritative on the server; clients cannot decide which criteria are critical. Assessments are append-only; a reassessment creates a new record. Cancelled assignments cannot receive attempts or assessments in the mock.

### Certificates

Issuance requires a passed practical assessment with no critical failure and its passed quiz attempt. `sopVersionId` is one exact version covered by those results. A course covering several SOP versions can yield separate certificates per version. A mismatched/unpublished version is rejected; a previously published, now deprecated version remains a valid historical reference. Neither issuance nor lookup resolves a generic SOP ID to the latest version.

The mock prevents multiple active certificates for one trainee/version. Certificate identities, references, and issuance metadata cannot be edited. Revocation records a timestamp/reason without changing the version. Certificate numbering, digital signatures, expiry, exports, and renewal policy are deferred to the backend contract.

### Branches and shared standards

Branches contain identity, name, unique case-insensitive code, address, and active state. They do not embed equipment or SOP lists. `getSharedStandards` returns one global catalog with `id`, `equipment`, and `sopScope: 'GLOBAL'`; the global `sops` domain supplies version content. Adding a branch never creates a local copy of standards. The mock shared equipment catalog is a fixture, not production configuration.

## Redux contract and usage

Each domain owns a normalized `entities` dictionary and `listIds`, with no separate stored detail entity. `selectById` and `selectList` resolve the same objects. List membership/order come from a successful list request. Creation updates the entity cache and marks the list invalidated; callers re-fetch the list to include the new record in the authoritative order.

Request state is separate for:

- `list`: list loading/success/error.
- `details[id]`: detail loading/success/error per entity.
- `mutations[id]`: mutation loading/success/error per existing entity.
- `mutations.$create`: create/assign/record/issue requests without a target ID.

Every request state has `status` (`idle`, `loading`, `succeeded`, `failed`) and a nullable serializable `error` (`message`, optional HTTP `status`, optional `validationErrors`). Redux stores no `Error`, `Date`, `Map`, or Promise objects. List/detail errors keep cached data so a view can show stale content with retry controls.

Domain `*Selectors.ts` exports a typed selector collection (`productSelectors`, etc.) with `selectState`, `selectList`, `selectById`, `selectListRequest`, `selectDetailRequest`, `selectMutationRequest`, and `selectListInvalidated`. Domain-specific derived selectors filter by relationship/status without introducing duplicate state. Eligibility selectors are advisory and describe loaded records only.

```ts
import { fetchProducts, fetchProduct, mutateProduct } from '@/features/products/productSlice'
import { productSelectors } from '@/features/products/productSelectors'

await dispatch(fetchProducts()).unwrap()
await dispatch(fetchProduct(productId)).unwrap()
const saved = await dispatch(mutateProduct({
  operation: 'update',
  id: productId,
  input: { name: 'Cafe Latte', description: 'Standard latte.', category: 'Coffee' },
})).unwrap()
// The mutation updates the shared entity cache; re-fetch the list as needed.
await dispatch(fetchProducts()).unwrap()
const status = productSelectors.selectMutationRequest(store.getState(), saved.id)
```

The same pattern applies to all domains; the table/type files list valid commands. `dispatch(thunk()).unwrap()` throws the structured domain error on failure. `.abort()` cancels the Redux request and passes `AbortSignal` to the service. API adapters should forward that signal to Axios. Cancelling a request cannot guarantee a server write is rolled back; re-fetch affected data to reconcile.

Latest request IDs discard out-of-order responses for a list or one detail. Per-entity request sequences keep older list/detail responses from overwriting newer cache values. A mutation revision invalidates reads started before a successful mutation. Writes for the same entity (or `$create`) are serialized by rejecting duplicate dispatches through `createAsyncThunk.condition`; skipped actions have `meta.condition=true` and do not call the service. These dispatches are skipped, not queued. Use mutation selectors to disable repeated actions in future UI.

Logout, HTTP 401 session clearing, and successful login/demo role switching clear all business caches and pending request identities. Late results from the previous session cannot restore data. The mock backing Maps remain in memory as a simulated server database across logout; browser reload starts fixtures again. Mock services return deep copies so consumers cannot mutate backing records or published content by editing a read result.

## Errors and server responsibilities

Use the existing Axios client and `ApiError` normalization in real adapters. ASP.NET Core ProblemDetails (`title`, `detail`, `status`, `errors`) maps to the Redux error model. Proposed error meanings are validation `400`, unknown reference `404`, workflow/version conflict `409`, and server authorization `401/403`. Agree exact server semantics before integration; they are not claimed existing endpoint behavior.

The server must enforce roles, ownership, referential integrity, workflow transitions, immutable published content, grading/rubric rules, exact-version certification, and concurrency atomically. ETags/concurrency tokens and idempotency keys should be mapped once confirmed; the frontend's request guards are not database concurrency controls.

## Verification

`npm run verify:business` loads the actual TypeScript modules through Vite and checks all nine list/detail lifecycles, mutation outcomes/errors, SOP review/publication/deprecation/revision, training snapshots, the quiz threshold, quiz prerequisite, critical failure, exact-version certification, branch standards, cache resets, stale response races, duplicate-write prevention, cancellation, and API-mode adapter registration. No backend network calls are made. The script explicitly enables mocks for its development graph, then disables them in a fresh graph to test all unconfigured API services.
