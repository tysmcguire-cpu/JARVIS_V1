# Deployment readiness

Current owner deployment: $7/month Render desktop website, existing Supabase database/login, and verified Telegram webhook. Mobile/tablet UI work is explicitly excluded. HOSTING_SETUP.md contains the cohosted scheduler start command, environment separation, resource limits and owner acceptance steps. No additional paid worker is required for the current single-instance setup. Workers accept host-injected secrets without requiring a local .env file. Historical readiness notes below describe predeployment requirements.

All six local implementation phases are built. Keep JARVIS_AI_ENABLED=false until API billing, model access and sharing consent are approved. Configure OPENAI_API_KEY/OPENAI_MODEL only as server secrets. No deployment or paid AI call was performed. Apply all reviewed migrations and restricted runtime grants before a future approved deployment.

The Next.js website runtime is Vercel-compatible, but the cohosted scheduler requires a continuous Node host such as the selected paid Render instance. Prisma and server-only dependencies must remain in server code. Never use a static export for authenticated routes.

Before a future approved deployment: run frozen dependency install, generate Prisma client, validate schema, deploy reviewed migrations with DIRECT_URL, run all tests/build, verify Supabase owner configuration and least-privilege runtime connection, set environment secrets in the host and confirm demo returns 404 in production. Do not enable demo as a hosted preview.

Use separate development and production Supabase projects. Configure Auth site URL and allowed redirects for the actual domain, disable signup and anonymous auth, configure SMTP/recovery/rate limits and establish backup/restore procedures. Pool database connections appropriate to the hosting plan. Secrets are configured by the user, never invented. Deployment, domain purchases and paid plans require explicit approval.

Phase 6 implementation and local security/recovery checks passed. Hosted acceptance still requires owner configuration, recovery rehearsal, domain/budget approval and production isolation checks. Run notification and Telegram polling workers on a separately approved always-on Node host; request-scoped Vercel execution is not a durable worker. Keep exactly one poller per bot. Define owner-approved backup/retention operations; no scheduler or paid host was created. See OWNER_SETUP.md and RECOVERY.md. A passing local build is not a claim of deployment or live integration success.

## Productivity storage update

Before deploying this revision, apply 20261021000000_productivity with the administrative migration connection and regenerate Prisma. This additive migration creates WorkspaceState, grants its CRUD only to the existing jarvis_app role, and adds ledger transfer and event-series metadata/integrity checks. It was applied and runtime-verified on the existing configured project. New installations still need their normal runtime-role provisioning. Run pnpm exec tsx scripts/verify-productivity.ts for synthetic rollback verification. Existing hosted:start and hosting plan remain sufficient. DAILY_WORKFLOWS.md documents the new controls.

The follow-up 20261021010000_note_capacity migration widens Note.content to varchar(32000), matching validation, editor and recovery limits. Existing notes are preserved.
