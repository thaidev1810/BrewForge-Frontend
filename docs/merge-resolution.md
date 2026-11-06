# PR #2 merge resolution — 2026-11-04

Integrated `main` at `9802ec3f1775c3b46bc359cc18979efdf7864222` into the PR head `218000168629e95d7082264ddf006aa273029d8c`.

- `/` renders the landing design from `9802ec3` with its typography, sections, artwork and animations. The page loads lazily; private routes do not download its component upfront.
- The `feat/trainflow` API-backed routes, role guards, sidebar, session bootstrap and learning flows are retained. Landing role buttons open the real login page instead of posting obsolete demo-email credentials.
- `index.html` retains the landing title/fonts and the PR's Vietnamese document language and description.
- `package-lock.json` is retained byte-for-byte from the PR branch: the landing commit changes no dependency declaration. Frozen installation succeeds, including Playwright and the existing test tools.
- Landing styles and animation classes are scoped to the mounted page. Timers/animation frames and global wheel/resize listeners are cleaned up on navigation. Fixed decorative layers are clipped on mobile. The navigation button explicitly accepts pointer events.
- The newsletter placeholder does not claim a subscription was saved without an API.

## Validation

- `npm ci --fetch-retries=0`, typecheck, lint, E2E TypeScript compilation and production build pass.
- `npm test`: 37 integration + 36 authoring + 20 session checks pass (93 total). The source route-matrix check used the read-only AuthorizationMatrix from BE `45caf8e` outside this checkout; the machine's existing BE checkout is older. No BE source or database was modified.
- Browser authoring: 74 checks; browser session: 11 checks, using the existing TEST_ONLY transports.
- Playwright public/landing smoke: 12 tests pass, including four viewport widths, real login navigation, eight anonymous role guards, reload and CSS isolation. No backend business requests or credentials were used.
- Production build reports a 462.87 kB main chunk and a separate 44.46 kB landing chunk; no chunk-size warning in this build.

Linux validation used a temporary Playwright config outside the repository to select installed system Chromium. The committed smoke tests also run with the repository's normal Playwright configuration. These checks validate merge/UI behavior, not live backend business E2E.
