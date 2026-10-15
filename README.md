# JARVIS

Private, single-owner personal operating system. **Foundation only**: desktop application shell, Supabase owner sign-in, PostgreSQL owner/settings storage and an isolated synthetic preview. The owner's latest UI direction is desktop-only, minimum 1024×600, with the complete interface fitting one viewport without scrolling. Domain modules are navigation placeholders, not working tracking tools. Supabase is configured and verified in the owner's local workspace. No financial, AI, Telegram or other domain integrations are connected; nothing is deployed.

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

For real owner access on a new Supabase project, follow DATABASE.md to disable signups, manually create the Auth owner, configure .env, apply migrations and run `pnpm db:provision`. That explicit setup command creates owner/settings records plus a SELECT-only runtime role and saves its generated credential only in .env. No service-role API key is needed. The original development project is already migrated/provisioned; do not create a second owner when switching computers.

```powershell
pnpm db:validate
pnpm db:migrate
pnpm db:provision
pnpm db:verify
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm test:production
pnpm start
```

The E2E suite starts its own development server on port 3100 with isolated .next-tests output, explicitly clears Supabase configuration and tests desktop navigation, viewport fit, flowing animation/pause/reduced motion and fail-closed routes at 1280×720, 1366×768 and 1920×1080, plus the minimum 1024×600 size. Smaller windows show a desktop-size notice. These tests do not verify a live Supabase connection. `pnpm db:verify` separately tests the configured live database without modifying records. Build needs generated Prisma client but no real credentials. Optional database seeding is explicitly guarded and described in DATABASE.md.

Production smoke tests use the completed build on port 3101 and verify demo is blocked even with its flag enabled. Vitest executes the reviewed migration in embedded PostgreSQL with an emulated Supabase auth schema, checking defaults, singleton/auth constraints, RLS and cascading deletion. This does not replace verification on the user's Supabase project.

## Phase 1 acceptance

- Live migration, owner/settings persistence, initial preferences, least-privilege runtime role, owner-scoped RLS, second-user database isolation and write/auth-table denial have been executed successfully.
- The owner confirmed successful login, database-backed Settings, logout and login again. No owner password was shared with the assistant.
- Automated auth-boundary tests cover absent, wrong-owner, invalid/revoked sessions and wrong-password responses using mocked provider responses; they do not impersonate real users.
- Actual additional-account testing, long-running refresh/expiry/revocation and MFA remain release-hardening checks in Phase 6. The owner subsequently replaced mobile support with a desktop-only, single-viewport requirement; physical iPhone support is no longer a current acceptance requirement.

## Continue on another computer

After the GitHub push, clone https://github.com/tysmcguire-cpu/JARVIS_V1.git outside OneDrive if possible. Install the required Node/pnpm versions, run `pnpm install --frozen-lockfile` and `pnpm db:generate`, then create .env locally. Transfer the existing environment securely, including the generated jarvis_app DATABASE_URL credential, or provision separate approved runtime credentials. Do not paste secrets into chat or Git. Use the same Supabase project to share persisted data; no new owner or seed is needed. Run `pnpm db:verify`, then `pnpm dev` and sign in. Push changes before switching computers, and pull before editing on the other one.

Future phases add data entry, integrations, AI and durable notifications. Do not enter private records into synthetic fixtures.

## Windows troubleshooting

This checkout is inside OneDrive. During verification, OneDrive marked generated .next directories read-only and interrupted a repeat build. Clearing the read-only attributes on that generated directory allowed rebuilding. For reliable ongoing development, keep the working checkout outside synchronized folders; never remove source files to fix build artifacts. The scripts use Webpack because the bundled Windows runtime failed to launch Turbopack's CSS worker.

Phase 1 is committed and pushed to the master branch at https://github.com/tysmcguire-cpu/JARVIS_V1.git. Remote read/write access is verified. The repository-local Git author is configured from the owner's supplied name and email. Local .env credentials and generated output remain excluded.
