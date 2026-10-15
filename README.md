# JARVIS

Private, single-owner personal operating system. **Foundation only**: responsive application shell, Supabase owner sign-in, initial PostgreSQL schema and an isolated synthetic preview. Domain modules are navigation placeholders, not working tracking tools. No external services are connected or deployed.

JARVIS_SPEC.md contains the complete original requirements. Read IMPLEMENTATION_PLAN.md for architecture decisions, phase gates and verification status. See ARCHITECTURE.md, DATABASE.md, SECURITY.md, INTEGRATIONS.md and DEPLOYMENT.md before configuring real services.

## Local setup (Windows / VS Code)

Install Node.js 22.12+ (24 LTS recommended), Git and pnpm 11. Open this folder in VS Code and use its PowerShell terminal. Commands assume these executables are on PATH.

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm db:generate
```

For the synthetic preview, set `JARVIS_DEMO_MODE=true` in .env, then:

```powershell
pnpm dev
```

Open http://localhost:3000/demo. All numbers are explicitly synthetic; no database or credentials are needed. Sign-in at /login remains locked until Supabase configuration is complete. Demo is disabled in production builds, so use the development server for preview.

For real owner access, follow DATABASE.md to create a Supabase project, disable signups, manually create the owner, fill in URL/publishable key/owner UUID plus pooled and direct database URLs in .env, apply migrations and provision the owner row. Restart the server and sign in at /login. Do not commit .env. No service-role API key is needed. Configuration actions are user-owned and have not been executed by this repository.

```powershell
pnpm db:validate
pnpm db:migrate
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm test:production
pnpm start
```

The E2E suite starts its own development server on port 3100, explicitly clears Supabase configuration and tests synthetic mobile/desktop navigation and fail-closed routes. It does not verify a live Supabase connection. Build needs generated Prisma client but no real credentials. Optional database seeding is explicitly guarded and described in DATABASE.md.

Production smoke tests use the completed build on port 3101 and verify demo is blocked even with its flag enabled. Vitest executes the reviewed migration in embedded PostgreSQL with an emulated Supabase auth schema, checking defaults, singleton/auth constraints, RLS and cascading deletion. This does not replace verification on the user's Supabase project.

## Phase 1 live acceptance checklist

- Apply migration on a dedicated Supabase development project and confirm the auth FK, singleton constraint and settings defaults.
- Provision the approved owner, verify correct login and sign-out; reject wrong passwords and a second authenticated UUID.
- Confirm refresh, expiration and revoked sessions fail appropriately; check mobile Safari manually.
- Verify anon access denied and second-user RLS isolation; use a nonprivileged runtime database role.
- Restart and verify persistent owner/settings records. No live database/auth tests are claimed until these checks are actually run.

Future phases add data entry, integrations, AI and durable notifications. Do not enter private records into synthetic fixtures.

## Windows troubleshooting

This checkout is inside OneDrive. During verification, OneDrive marked generated .next directories read-only and interrupted a repeat build. Clearing the read-only attributes on that generated directory allowed rebuilding. For reliable ongoing development, keep the working checkout outside synchronized folders; never remove source files to fix build artifacts. The scripts use Webpack because the bundled Windows runtime failed to launch Turbopack's CSS worker.

Origin is configured to https://github.com/tysmcguire-cpu/JARVIS_V1.git and read access is verified. The repository-local Git author is configured from the owner's supplied name and email. Push access is not yet verified.
