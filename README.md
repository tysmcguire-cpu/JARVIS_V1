# Pluto — commercial development

Provisional commercial working name; trademark clearance is an explicit launch gate. Separate worktree/branch feature/pluto-saas-v1, baseline 7dd529712d5e1745358898a3106a693c929f996a. The personal JARVIS application remains independent on master. Never copy its .env, database, deployment or bot configuration here.

Start with PLUTO_READINESS.md for current local results and the next credential gate, then PLUTO_AUDIT.md, PLUTO_ROADMAP.md and PLUTO_OWNER_ACTIONS.md. Actual checks are in PLUTO_TEST_RESULTS.md. All paid providers, public registration and checkout default disabled. The commercial application is NOT launch-ready.

Development uses Node >=22.12, pnpm and the frozen lockfile. Run pnpm install --frozen-lockfile, pnpm db:generate, pnpm test, pnpm typecheck, pnpm lint and pnpm build. Synthetic preview: set PLUTO_DEMO_MODE=true in a new local environment and run pnpm dev --port 3002; /demo is disabled in production. No live credentials are needed for unit tests. Migrations are guarded and must target a separate approved Supabase project. Historical JARVIS_SPEC.md and other origin documents are retained as historical context; PLUTO documents and the owner's conversion prompt govern commercial work.

Deployment/recovery: PLUTO_DEPLOYMENT.md. Cost assumptions: PLUTO_COST_MODEL.md. Owner setup order: PLUTO_OWNER_ACTIONS.md. Do not install administrative database credentials on the web host. Production dependency audit is clean; one unresolved development-only braces advisory remains documented in PLUTO_SECURITY.md.

Local setup tooling: see PLUTO_SETUP_STATUS.md. setup:preflight and setup:roles are offline by default; setup:inspect connects only with --connect and uses a read-only transaction. Database mutations require separate explicit approval. deployment/render.pluto.yaml is a prepared template, not an authorization to create a service.