# Implementation plan

The complete JARVIS_SPEC.md is authoritative. Scope is Phase 1 only; no Phase 2 work is authorized in this run.

## Architecture review and decisions
- Next.js App Router with server components, TypeScript, Tailwind and shadcn-style accessible UI primitives. Feature directories isolate domain logic from routing.
- Supabase Auth owns identity. A required server-only owner UUID allowlist gates every private page; disable public registration in Supabase. No first-login ownership assignment.
- Prisma accesses PostgreSQL only on the server. Runtime queries must include owner IDs; authenticated browser access also has RLS. Privileged database credentials can bypass RLS, so application authorization remains required.
- Separate pooled runtime and direct migration database URLs. Pin mutually compatible packages and verify installation, type checks and builds.
- No real service calls beyond configured Supabase authentication/database. Demo mode is explicit, synthetic, and forbidden in production. Demo and private routes must never share data access.
- Phase 1 creates identity/settings/audit schema. Domain schemas are designed below and added with their owning phases, avoiding unimplemented tables presented as working features.

## Missing requirements / conflicts
- Owner Supabase UUID, Supabase project and connection strings require user configuration. Live auth, migrations and persistence cannot be verified without them.
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
- [x] Add owner authentication and synthetic preview (live Supabase verification pending).
- [x] Add schema, migration and development seed (migration executed on embedded PostgreSQL; live Supabase pending).
- [x] Complete required documentation and environment template.
- [x] Finish final local checks and record results below.
- [x] Git author configured from owner-provided identity: Ty McGuire. Foundation prepared for the initial local commit; push access unverified.

## Status
Plan prepared before implementation. Phase 1 code is implemented and local verification passes. Phase 1 remains awaiting live Supabase acceptance; Phase 2 is blocked until that verification is complete. No real accounts, AI services, Telegram or financial services were connected. No deployment, purchases or external autonomous actions occurred.

## Executed verification — October 15, 2026

| Check | Result |
| --- | --- |
| Complete spec preservation | SHA-256 matches the original attachment byte for byte |
| Dependency installation | Successful; pnpm 11.25.0 lockfile, no peer incompatibility reported |
| Prisma generate | Passed with Prisma/client 6.19.3 |
| Prisma validate | Passed with temporary credential-free localhost URL variables; no connection attempted |
| ESLint | Passed with no warnings after fixes |
| TypeScript | Passed |
| Vitest | 7 tests passed: owner/demo policy and executable PostgreSQL migration/RLS/constraints/defaults/deletion |
| Production build | Passed on Next.js 16.4.1, React 19.3.1, Node 24.19.0 using Webpack |
| Production smoke | 2 tests passed: demo forbidden despite enabled flag, private redirect and frame protection |
| Desktop/mobile E2E | 6 tests passed: protected routes, responsive navigation/settings and invalid demo routes |
| Visual review | Desktop/mobile dashboard and settings screenshots inspected |
| Live Supabase migration/authentication | Not run: owner project/credentials not provided |
| Commit/push | Author configured from owner-provided identity; Foundation prepared for initial local commit. Origin read access verified; push not performed |

Initial failures were corrected: pnpm build-script approval/PATH setup, anonymous PostCSS export lint warning, and Next.js streamed redirects/404s returning HTTP 200. Proxy preflight gates now preserve the expected statuses and are covered by browser/production tests. Turbopack CSS worker failure required the supported Webpack mode. OneDrive read-only flags on generated .next output interrupted a repeat build; clearing only those generated flags allowed the final build to pass. No source content was deleted.

## Remaining Foundation acceptance steps

Owner action required: configure a dedicated Supabase development project and local .env, disable signup/anonymous auth, create the sole approved Auth user, set its UUID, supply pooled/direct DB URLs, apply migrations and provision the owner row per DATABASE.md. Then execute README.md's live login, unauthorized-user, revocation, persistence and RLS checklist. Never paste credentials into chat or commit them. Git author identity is now configured from owner-provided details. Origin is https://github.com/tysmcguire-cpu/JARVIS_V1.git; read access succeeded and no remote refs were returned. Push access is not yet verified.
