# BrewForge frontend

React 19 + TypeScript + Vite, with feature-based architecture. Backend files are outside this project's scope.

## Development

Use npm install, then copy .env.example to .env.local and run npm run dev.
Development defaults to demo authentication; production defaults to API authentication. Set VITE_ENABLE_MOCK_AUTH=true explicitly for a deployed capstone demo. Set it to false and provide VITE_API_BASE_URL for backend integration.

Choose one of seven demo users on /login. The password is BrewForge123!. After login, the header can switch demo roles. Sessions are held in Redux memory: refresh requires login again. No credentials or tokens are stored in browser storage.

## Structure

- src/app: Redux store, typed hooks, and router.
- src/features/auth: types, Redux slice, interchangeable API/mock services, login page, and route guards.
- src/features/{products,recipes,sops,courses,training,quizzes,assessments,certificates,branches}: typed business contracts, separate mock/API service bindings, Redux thunks/slices, and selectors. Each domain keeps one entity cache with independent asynchronous request states.
- src/features/{admin,audits}: reserved feature directories; create subfolders only when needed.
- src/components/ui: local shadcn/ui-style Button and Input primitives; components.json supports adding components with the shadcn CLI.
- src/components/layout: responsive sidebar, header, and dashboard shell.
- src/components/common: page header, stat card, status badge, shared placeholder dashboard, and route fallback pages.
- src/services: Axios client and centralized errors, including ASP.NET Core ProblemDetails.
- src/constants: environment mode and role-to-route configuration.
- src/types: shared API contracts.
- src/utils: Tailwind class merging.
- src/hooks: reserved shared hook directory; typed Redux hooks live in app.
- src/assets: preserved existing assets.
- scripts/verify-auth.mjs: executable behavior checks using Vite's actual TypeScript modules, without network requests.
- scripts/verify-business.mjs: business-rule, asynchronous state, concurrency, and service-adapter checks.
- docs/business-api-contracts.md: expected frontend service contracts and provisional mock policies for future .NET integration.

## Routes

Each prefix redirects to its /dashboard child: /admin, /rd-specialist, /rd-manager, /trainer, /store-manager, /barista, /quality-auditor.

PublicRoute redirects authenticated users from login to their workspace. ProtectedRoute requires a session. RoleBasedRoute redirects users who open a different role's workspace back to their own dashboard. Unknown routes show a 404 page.

## Backend integration

The API authentication adapter posts credentials to /auth/login and expects { user, accessToken }; align this contract with the future .NET backend. API requests require VITE_API_BASE_URL, inject the latest Redux bearer token, normalize server/network errors, and clear the session on HTTP 401. Validation errors remain available on ApiError.validationErrors.

Client route guards support navigation; enforce authentication and authorization in the backend too. Mock tokens only represent demo sessions. Refresh tokens, persistence, registration, password reset, and business APIs are intentionally deferred.

BrowserRouter deployments must serve index.html for application routes. Environment variables are baked into the Vite build and must not contain secrets.

Business services use their own `VITE_ENABLE_MOCK_SERVICES` flag (development defaults on; production defaults off). There are no assumed business endpoints. Register typed API adapters using each domain's `configure*Service` export when real contracts are approved; unconfigured API services fail explicitly. See [business API contracts](docs/business-api-contracts.md) for domain inputs/results, the SOP and assessment rules, historical version snapshots, Redux selectors, and integration responsibilities.

## Verification

- npm run typecheck
- npm run lint
- npm run verify:auth (development/demo mode)
- npm run verify:business
- npm run build

Tailwind v4 uses @tailwindcss/vite and CSS theme tokens in src/index.css. Existing React/Vite configuration is retained, with the @ alias added for both TypeScript and Vite.
