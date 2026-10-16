# Implementation plan

The complete JARVIS_SPEC.md is authoritative. All six implementation phases are built locally. The owner authorized continuing through all phases on this primary computer on October 16, 2026. External activation, actual owner recovery rehearsal and hosted acceptance remain setup gates in OWNER_SETUP.md. Historical notes below describe their original scope and do not override this current status.

## Phase 6 completion — October 16, 2026

Notification customization follow-up: added per-type Telegram controls; selected weekdays and 1–12-week cycles for reviews/briefings; once/daily/1–168-hour repeats for deadlines, financial thresholds and stored reminders; independent reminder enablement and selected deadline sources. Ten directly selectable settings pages fit 1024×600 without scrolling. Only changed rule versions and queued jobs are invalidated. Legacy defaults are materialized without changing behavior, and unchanged one-time records are not replayed on unrelated saves. Completed sources and spending below threshold cancel pending delivery. The additive JSON configuration/index migration was applied to the existing owner-approved database after a transient connection retry; live permission checks and a new-engine schedule transaction passed with verification writes rolled back and no test message sent. The owner had already verified hosted scheduled Telegram delivery before this customization. Final validation: 158 unit/database tests, nine browser checks, three production security checks, lint, Prisma generation/validation and production build/TypeScript passed. Minimum-size screenshot reviewed. Current owner schedules were not changed, the master specification is unchanged, and no additional paid service was added.

Hosted follow-up: owner deployed the desktop website on the $7 Render instance with the existing Supabase records/login, verified modules after correcting the hosted URL value, and confirmed a real Telegram /status reply through the registered webhook. Local polling is stopped. Cost-focused scheduled processing now uses `pnpm hosted:start`: supervised Next.js plus one background child for notification scans and webhook reply retries. Unexpected child exit fails the service; shutdown drains with a 25-second bound. No new paid service, public timer endpoint, schema change or unsolicited test message was created. All 149 unit/database tests, lint, build/TypeScript and three production boundary checks passed; production checks execute the new launcher. A synthetic inaccessible-database one-shot worker check exited safely with redacted diagnostics. Owner still needs to select the new hosted start command, enable notification scheduling, review preferences and verify a controlled real scheduled delivery.

- Durable owner-scoped notifications, weekly/morning reviews, deadlines/reminders and exact expense thresholds; in-app inbox, paginated preferences/details and optional separately enabled Telegram worker. Deduplication, rule invalidation, fenced leases and bounded retries are tested. No scheduled external delivery was activated.
- MFA enrollment/verification UI and owner-subject aal2 enforcement, foundation browser-role revocation, private account export/delete routes, bounded snapshots and authenticated encrypted CLI backup/transactional restore. Synthetic recovery passed; no private owner export/restore/deletion was performed.
- Expanded optional OpenAI composition with separate summary-sharing consent, immutable local facts and validated retrieved citations. No paid call or new provider activation occurred.
- Slow navigation/filter reads fixed through batched SQL, request-local authentication reuse, intent prefetch and abortable private reads. Signed-in optimized filter measured 845ms versus approximately 2.4 seconds before.
- Final verification: 142 unit/database tests; 54 browser scenarios in the full run plus three additional pagination scenarios across desktop sizes; three production boundary checks; build, lint, TypeScript, Prisma validation and client-secret scan passed. Live Supabase release permissions/isolation verification passed with fixture writes rolled back. Minimum-viewport notification screenshot reviewed. Master specification unchanged.
- OWNER_SETUP.md, NOTIFICATIONS.md and RECOVERY.md record remaining credentials, optional activation, key custody and deployment decisions. All implementation phases are complete locally; live OpenAI/provider delivery, actual owner MFA/recovery acceptance and hosted production acceptance are not claimed.

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

## Phase 3 — Telegram implementation

- [x] Owner allowlist plus one-time, 10-minute pairing code generated only by the signed-in owner.
- [x] Text commands: start/help/status/undo, expense/income, tasks, stored reminders, notes/ideas, record searches and manual balances. Reuse Phase 2 field validation and exact money.
- [x] Owner-scoped TelegramIdentity/TelegramMessage schema, RLS, operation audit and narrowly granted runtime permissions.
- [x] Atomic update-ID deduplication and writes, per-owner command serialization, stale-edit-safe undo, durable reply outbox with leases/retries and manual requeue.
- [x] Independently authenticated bounded webhook route and local polling runner. Telegram is disabled by default; no hosting/tunnel/webhook created.
- [x] Settings Telegram tab, connection status, explicit disconnect and pairing controls, isolated demo and single-viewport layout.
- [x] Local credential/ID setup helper and TELEGRAM.md. The helper matches a random owner-sent marker; it never chooses or pairs an identity automatically.
- [x] Apply migration and runtime grants; verify live state CRUD/isolation with a rolled-back transaction, without contacting Telegram or persisting samples.
- [x] Configure and pair the real owner bot; verify status, note persistence and undo. Local restart preserved pairing/completed operation state. Retry failures are tested automatically.

Telegram implementation is ready for activation; live integration is not claimed. Phase 4 has not started. The local app remains usable without Telegram credentials. Final executed check results follow after validation.

### Executed Phase 3 implementation checks

- Prisma generation and migration: passed; Telegram runtime grants applied without credential changes.
- ESLint and TypeScript: passed.
- Vitest: 58 tests passed, including restricted-role PostgreSQL command execution, exact expense/income amounts, atomic rollback/retry, update deduplication, undo/version checks, owner isolation, webhook secret/body validation and mock delivery retries.
- Browser suite: 30 scenarios passed across three desktop sizes; current Settings and Telegram layout also rechecked at 1024×600 after the final styling update. Screenshots visually reviewed.
- Production build and two production boundary tests: passed.
- Live Telegram state storage: CRUD/isolation verified in a deliberately rolled-back transaction; no pairing/messages saved and no bot contacted.
- CLI guard: polling refuses to start without explicit credentials/allowlist; identification-marker generation runs locally without network access.
- Live bot acceptance remains pending the owner's local token, selected IDs, pairing and actual command verification. Master specification unchanged.

### Live Telegram activation — October 15, 2026

The owner saved the bot token locally. Telegram getMe authenticated it without exposing the token. A random marker sent by the owner identified the approved private chat; its IDs were saved to the ignored .env, and local polling was started. The owner completed the signed-in pairing flow. Database checks confirmed the approved pairing, delivered start/status replies, and a delivered note confirmation with no pending replies. The owner confirmed the note synced successfully to the website. Real /undo and polling-restart/retry verification remain outstanding; their automated tests pass. No public webhook or deployment was created.

Live undo is now verified: the owner sent /undo, its reply was delivered, the command receipt was marked undone, and the referenced test note no longer exists. Restart/retry behavior remains covered by automated tests; a live process-restart check is still outstanding.

## Phase 4 implementation

- [x] Reusable read-only connector contract, synthetic providers and five HTTP adapters with approved resource selection, refresh, bounded pagination, normalization, checkpointing, idempotent upserts, backoff and health.
- [x] Explicit owner grants, AES-GCM credential envelopes, connection leases, paginated source review and local disconnect. No real provider account contacted; key custody remains an owner decision and its local key field stays blank.
- [x] Financial CSV mapping, exact money, bank-ID/file deduplication, possible-duplicate review, expiring server-bound drafts and atomic confirmation/audit.
- [x] Desktop single-viewport Settings workflow, paginated previews and credential-entry modal.
- [x] Additive migration/runtime grants applied. Live linking, CRUD, cascades and isolation verified in a rolled-back transaction with no sample financial data retained.
- [x] Setup, permissions, key-custody and operating documentation in INTEGRATIONS_PHASE4.md.

Metadata scope is deliberate: Gmail/Drive selected metadata, GitHub repository metadata, Calendar events without recurrence expansion, and selected Instructure assignment snapshots. Google tokens require an existing approved OAuth project; no new consent redirect is implemented. Sources stay separate from manual records. Actual provider activation and a real bank file require later owner setup. Phase 5 has not started.

### Executed Phase 4 checks — October 16, 2026

- ESLint, Prisma validation and production build: passed.
- Unit/database tests: 96 passed, including atomic CSV imports, duplicate review, ownership, credential isolation, refresh and source reconciliation.
- Browser coverage: 30 existing scenarios plus 12 integration scenarios passed across three desktop sizes in separate runs. Minimum-size screenshots reviewed.
- Two production boundary smoke tests: passed against the final build.
- Live integration storage/grants verified in a rolled-back transaction. No real provider contacted or sample financial records retained.
- Master specification unchanged. Development app and local Telegram polling remain running.

## Phase 5 — grounded assistant, October 16, 2026

- [x] Owner-scoped conversation/source snapshots, compound ownership, RLS and restricted runtime grants. Live CRUD/cascade/isolation/rate-budget reads verified in a rolled-back transaction.
- [x] Validated read-only tools for financial totals, academic deadlines, schedule overlaps, career/projects/goals/notes, imported title review and on-demand weekly reviews.
- [x] Exact separate currency calculations; labelled facts/calculations and explicitly requested local-rule recommendations with sources/freshness. Missing data/truncation disclosed.
- [x] Optional OpenAI strict single-tool question interpretation; questions only, no records/history sent, store:false, per-request consent, owner-controlled model/enablement and durable website request guard.
- [x] Paginated desktop assistant/history/source/coverage UI and source-linked local Telegram /ask. Demo isolated; no paid AI call or unsolicited message made.
- [x] Unit/database/auth/injection tests, browser checks and production build. See ASSISTANT.md.

Scope: local mode is filter-driven; OpenAI interprets a title search/view only. General conversational reasoning, model-written recommendations, live OpenAI acceptance and scheduled review delivery are not implemented or claimed. API key/model/billing remain owner setup. Phase 6 has not started.

Executed verification: 112 unit/database tests passed; lint, TypeScript, Prisma generation/validation, production build and two production boundary tests passed. The browser regression run passed 47/48 scenarios; the existing laptop tracking-dialog scenario passed on an isolated rerun without changes to tracking code. Six new assistant scenarios passed across three desktop profiles; minimum-size screenshot reviewed. Master specification unchanged.

## Owner calendar options — October 16, 2026

Gmail and Google Drive are removed from current integration settings and new authorization grants. Google Calendar and private Apple Calendar (iCloud CalDAV) are independent, optional, read-only connections; either or both may be connected later. GitHub, Canvas and CSV imports remain available. Legacy mail/Drive identifiers remain for existing stored history. No calendar account was authorized, discovered or synced during implementation. See CALENDAR_CONNECTIONS.md for consent, credentials, scope and limits.

Verified: 167 unit/database tests, 12 integration browser scenarios across three desktop sizes, lint, production build, three production boundary tests and client secret scan passed. Minimum-size screenshot reviewed. The additive Apple provider constraint migration was applied; live owner isolation was checked with rolled-back synthetic fixtures. Real Apple/Google account acceptance remains pending optional owner setup. The master specification is unchanged.

## Canvas Calendar Feed — October 16, 2026

Owner authorized direct private feed integration after reviewing TAMU's student API restrictions. Canvas authorization now accepts an encrypted private calendar feed URL and explicit read-only consent, with manual-only default or optional 15/60/360-minute refresh. The existing hosted supervisor/background child scans only opted-in due Canvas feeds; no extra paid service, migration or dependency is added. Google/Apple remain independent and unconnected. The existing API adapter remains for separately institution-approved grants, while the current UI offers the feed.

Full bounded feed validation precedes source paging/upserts, identities are stable, complete snapshots reconcile omissions, failed fetches preserve prior data, and local disconnect removes the credential. The feed URL is absent from public selection/cursors/source links. Network access is limited to approved HTTPS Canvas feed routes without redirects or attachment fetching. Imported records remain read-only source snapshots, with due timestamps shown in Review records. Imported assignment deadlines participate in existing enabled Assignment notifications using owner timezone/cadence; pending delivery checks source date/version, deletion and connection status. Submission status is unknown, so reminders cannot stop based on Canvas completion.

Executed verification: 174 unit/database tests, 15 integration browser checks across three desktop profiles (minimum 1024×600 authorization screenshot visually reviewed), lint, TypeScript, production build, three production boundary checks and client-secret scan passed. Real Canvas authentication/feed access and real scheduled acceptance are pending the owner's private feed link; no real Canvas account was contacted, credential saved or message sent. See CANVAS_FEED.md. Master specification unchanged.

### Canvas worker startup fix — October 16, 2026

The owner reported a successful Render build followed by a background-process startup crash. Reproduced locally under the exact Node --conditions=react-server runtime: Canvas's worker imported live-service, which imported web owner authentication and next/navigation, causing React createContext to fail before the worker loop started. Moved unchanged synchronization logic into a server-only sync-service with a type-only database-runner dependency. Web actions retain independent owner authentication; scheduled processing retains its configured-owner/RLS runner. All three actual hosted worker modules now import successfully outside a Next web request.

Added a production Node child-process regression test using synthetic unreachable database configuration and no provider requests. Executed: 175 unit/database tests, lint, production build/TypeScript, three production boundary checks and client-secret scan passed. Existing sync implementation was compared verbatim after extraction; no behavior, secret, schema, credential or service configuration changed. Render live acceptance remains pending the replacement deployment.
