# Implementation plan

The complete JARVIS_SPEC.md is authoritative. Phase 1 is complete. The owner authorized Phase 2 core tracking in this workspace on October 15, 2026. Historical Foundation notes below describe their original scope.

## Architecture review and decisions
- Next.js App Router with server components, TypeScript, Tailwind and shadcn-style accessible UI primitives. Feature directories isolate domain logic from routing.
- Supabase Auth owns identity. A required server-only owner UUID allowlist gates every private page; disable public registration in Supabase. No first-login ownership assignment.
- Prisma accesses PostgreSQL only on the server. Runtime queries must include owner IDs; authenticated browser access also has RLS. Privileged database credentials can bypass RLS, so application authorization remains required.
- Separate pooled runtime and direct migration database URLs. Pin mutually compatible packages and verify installation, type checks and builds.
- No real service calls beyond configured Supabase authentication/database. Demo mode is explicit, synthetic, and forbidden in production. Demo and private routes must never share data access.
- Phase 1 creates identity/settings/audit schema. Domain schemas are designed below and added with their owning phases, avoiding unimplemented tables presented as working features.

## Missing requirements / conflicts
- Owner Supabase UUID, project and connection strings were supplied locally and verified. They remain excluded from Git and must be configured separately on other computers.
- Full normalized domain database versus incremental delivery: Phase 1 includes foundation tables only; Phase 2 adds financial, academic, calendar, career, projects, goals and notes entities. Later phases add Telegram, connectors, AI and jobs.
- Notifications enabled by default means stored preferences in Phase 1, not live delivery before Phase 6. AI recommendations stay opt-in; scheduled weekly reviews are the explicitly authorized exception.
- Encryption key custody, backup retention, deletion/export policy, notification thresholds, currency and institution-specific grade rules remain decisions before relevant phases. Initial currency is configurable USD, never a claim about owner data.
- Auth email delivery, password recovery and MFA setup need Supabase project configuration; document manual owner creation and recovery instead of enabling registration.
- Phase 6 includes comprehensive E2E tests; essential shell/auth regression tests start now.

## Phases, dependencies and acceptance
1. Foundation (no prior dependencies): preserve spec; create docs, shell and responsive navigation; Supabase owner auth; initial Prisma schema/migration; explicit synthetic preview; env template; unit/E2E tests. Gate: install, lint, typecheck, unit tests, Prisma validation and build succeed; browser shell verified; configured live auth/database smoke checks are recorded separately and never claimed without credentials.
2. Core tracking (depends on verified Phase 1): normalized owner-scoped CRUD, exact money, filters, charts, calendars and validation. Gate: authorization, arithmetic and persistence tests; accessible empty/error states; synthetic seed.
3. Telegram (depends on core CRUD): verified webhook, owner pairing, deterministic commands, idempotency and undo. Gate: unauthorized messages rejected and duplicate/retry tests pass.
4. Integrations (depends on core schema): mock connector contract, consent, encrypted tokens, read-only sync and CSV import. Gate: pagination, refresh, rate limits and idempotency tested; real providers only with explicit authorization.
5. AI (depends on data/source references): validated tools, grounded sources/freshness and requested recommendations. Gate: no arbitrary SQL, external writes or unrequested recommendations; injection and grounding tests.
6. Notifications and release (depends on prior phases): durable jobs, retries, delivery audit, export/deletion, backups, security hardening and comprehensive E2E. Gate: schedule/timezone/retry tests, restore exercise and explicit approval before paid services or deployment.

## Foundation checklist
- [x] Read and preserve complete master specification.
- [x] Review architecture, dependencies, conflicts and missing requirements.
- [x] Initialize application and modular structure.
- [x] Add owner authentication and synthetic preview; owner confirmed live login, stored Settings, logout and login again.
- [x] Apply migration to Supabase, provision owner/settings and SELECT-only runtime role; verify persisted defaults and ownership isolation.
- [x] Complete required documentation and environment template.
- [x] Finish final local checks and record results below.
- [x] Git author configured from owner-provided identity: Ty McGuire. Initial Foundation commit e6b79e6 exists locally.
- [x] GitHub delivery: Foundation commits e6b79e6 and 4e65b55 pushed to origin/master; remote commit verified.

## Status
Phase 1 Foundation is complete, verified locally and against the configured Supabase development project, and pushed to GitHub. The owner confirmed the live authentication workflow. Phase 2 is not started or authorized by the current task. Supabase is the only configured application service; no financial, AI, Telegram or other domain integrations were connected. No deployment, purchases or external autonomous actions occurred.

## Executed verification — October 15, 2026

| Check | Result |
| --- | --- |
| Complete spec preservation | SHA-256 matches the original attachment byte for byte |
| Dependency installation | Successful; pnpm 11.25.0 lockfile, no peer incompatibility reported |
| Prisma generate | Passed with Prisma/client 6.19.3 |
| Prisma validate | Passed with temporary credential-free localhost URL variables; no connection attempted |
| ESLint | Passed with no warnings after fixes |
| TypeScript | Passed |
| Vitest | 18 tests passed: owner/demo policy, actual server-action/owner boundaries with mocked provider responses, and executable PostgreSQL migration/RLS/constraints/defaults/deletion |
| Production build | Passed on Next.js 16.4.1, React 19.3.1, Node 24.19.0 using Webpack |
| Production smoke | 2 tests passed: demo forbidden despite enabled flag, private redirect and frame protection |
| Desktop/mobile E2E | 6 tests passed: protected routes, responsive navigation/settings and invalid demo routes |
| Visual review | Desktop/mobile dashboard and settings screenshots inspected |
| Live Supabase database | Migration applied, owner/settings persisted, SELECT-only runtime role provisioned; owner/second-user/unscoped RLS, pool identity isolation, write denial and auth-table denial passed |
| Live Auth configuration / anonymous Data API | Disabled signup/anonymous sign-in, enabled email sign-in and anonymous table-read denial verified by db:verify |
| Live owner authentication | Owner confirmed login, stored Settings, logout and login again; password remained private |
| Commit/push | Foundation commits e6b79e6 and 4e65b55 pushed to origin/master; remote commit verified |

Initial failures were corrected: pnpm build-script approval/PATH setup, anonymous PostCSS export lint warning, and Next.js streamed redirects/404s returning HTTP 200. Proxy preflight gates now preserve the expected statuses and are covered by browser/production tests. Turbopack CSS worker failure required the supported Webpack mode. OneDrive read-only flags on generated .next output interrupted a repeat build; clearing only those generated flags allowed the final build to pass. No source content was deleted.

## Remaining delivery and later release checks

GitHub delivery is verified at https://github.com/tysmcguire-cpu/JARVIS_V1.git on master; no remote history was overwritten. Configure the ignored .env securely on each computer. Runtime DATABASE_URL now uses the real provisioned jarvis_app role; DIRECT_URL remains administrative and is only for local migrations/setup. Provisioning was rerun successfully without replacing owner preferences or resetting credentials.

Long-duration live refresh/expiry/revocation, an additional real Auth account, MFA, physical iPhone Safari, backup/restore and export/deletion remain Phase 6 release hardening tasks. Mocked auth-boundary tests and live database second-identity tests cover the Foundation denial paths; they are not claimed as live additional-account tests. No further phases begin during this task.

## Owner-requested visual refinement

The owner separately authorized a more technical appearance using three screenshots as visual references, with Phase 2 explicitly deferred. The refinement adds an original vector circular centerpiece, cyan instrument-panel styling, a local clock, matching sign-in styling and responsive layouts. It changes presentation only; no accounts, integrations or autonomous actions were added. Desktop/mobile browser checks and visual review cover the dashboard, sign-in and Settings. Existing security and regression checks remain applicable.

Visual-refinement validation executed successfully: ESLint, TypeScript, 18 unit/database/auth-boundary tests, six desktop/mobile E2E tests (including dashboard overflow checks), production build and two production boundary tests. Desktop/mobile dashboard and sign-in screenshots were inspected. No reference images were copied into the application; the centerpiece is original SVG/CSS.

The owner then requested a central JARVIS hub with options surrounding it, based on a further visual reference. The dashboard now uses ten interactive orbital module links, keyboard/hover destination previews, highlighted connector paths, a scanner sweep, orbital particles and decorative data-flow effects. A pause control and reduced-motion support manage animation. Mobile uses the same destinations in a touch-friendly grid beneath the core. The old landing-screen metrics/tasks were replaced; the underlying modules, authentication and database are unchanged. Phase 2 remains deferred. Browser checks additionally exercise module count, keyboard focus, pause state, reduced-motion CSS and actual module navigation on both desktop and mobile.

Orbital-dashboard validation passed: 18 unit/auth/database tests, eight desktop/mobile E2E tests including a 320-pixel viewport, two production security smoke tests, ESLint, TypeScript and the production build. Desktop/mobile screenshots were visually reviewed. Total automated test count: 28.

Latest explicit owner override: desktop only; all current application screens must fit one viewport without scrolling. The original mobile/iPhone requirement is superseded for the current UI, not silently removed from the preserved master specification. The current shell supports 1024×600 and larger windows; smaller sizes display a desktop-window notice. The central JARVIS mark is surrounded by original flowing cyan/violet canvas filaments and circuitry, with pause, reduced-motion and hidden-tab controls. Current module screens and sign-in also use bounded viewport layouts. Phase 2 remains deferred.

Desktop/flowing-core validation passed: ESLint, TypeScript, 18 unit/auth/database tests, 15 browser tests across 1280×720, 1366×768 and 1920×1080 (also checking minimum 1024×600 bounds), production build and two production security checks. Total automated test count: 35. Dashboard and Settings screenshots were visually reviewed; navigation, keyboard controls, reduced motion, actual changing canvas frames and the minimum-window notice were verified. No Phase 2 functionality was added.

## Phase 2 implementation — October 15, 2026

- [x] Add 24 normalized owner-scoped tracking models, compound ownership foreign keys, RLS, validation constraints and indexes.
- [x] Financial accounts, categories, transactions, dated budgets/category limits and recurring expenses. Exact integer minor-unit calculations; USD/CAD/EUR/GBP kept separate. Category type determines income versus expense; opening balances may be negative. Currency/type changes are rejected while dependent records exist.
- [x] Courses, assignments, exams, grades and study sessions. Grade overview reports unweighted recorded points, not an institutional GPA.
- [x] Events with date/time bounds, tasks and stored reminders; monthly calendars for dated record types.
- [x] Career applications, contacts and follow-ups; projects, milestones and activity; goals, habits and dated habit entries; notes and tags.
- [x] Owner-verified CRUD, explicit owner predicates, parameterized SQL, audit records in the same transaction and optimistic concurrency protection. Parent deletion is prevented while dependent records exist.
- [x] Search, sorting, status filters, four-row pagination, status/spending/progress charts, empty/error/loading feedback and accessible modal forms. Minimum 1024×600 retained; forms paginate fields. Linked choices support server-side title search.
- [x] Isolated synthetic browser fixtures with temporary edits and an explicit development-only database seed that refuses a real owner.
- [x] Apply the tracking migration to the existing Supabase project and grant CRUD only on tracking tables plus audit INSERT to jarvis_app (and inherited local logins). Existing credentials and preferences preserved.
- [x] Verify live CRUD across all 24 tables inside a rolled-back transaction; no synthetic records saved to the real owner.

Operational limits: amounts use two-decimal currencies only; no currency conversion, bank sync, recurring transaction generation, reminders delivery, Telegram, AI or external actions. Calendars show up to 200 matching records per month and report this limit. The account currency determines transaction currency; budget limits use budget currency and exclude transactions in other currencies. Habits allow one recorded value per date, with editing to revise it. Times are entered in the configured workspace timezone.

Validation results are recorded after the final checks below. Phase 3 has not begun.

### Final Phase 2 verification

- Prisma schema validation, ESLint and TypeScript: passed.
- Vitest: 38 tests passed, including the real SQL repository against embedded PostgreSQL, exact arithmetic, ownership and stale updates.
- Playwright: 24 browser scenarios passed across three desktop viewports, including every tab and modal field page at 1024×600. One final test was rerun successfully after an output-directory collision with production tests; production now uses a separate output directory.
- Production build: passed; two production boundary tests passed.
- Live Foundation verification: passed using this computer's inherited restricted login.
- Live tracking verification: passed for all 24 tables plus audit INSERT and isolation, in an intentionally rolled-back transaction. No sample data saved to the real owner.
- Desktop screenshots reviewed. Local development server serves the updated app on port 3000. No deployment or external connectors added.
