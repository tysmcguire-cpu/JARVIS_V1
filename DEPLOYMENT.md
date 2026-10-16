# Deployment readiness

Current owner target: hosted desktop website accessible from any computer after sign-in; Telegram is the phone interface. Mobile/tablet UI work is explicitly excluded. HOSTING_SETUP.md contains the proposed Render service commands, environment separation, database choice, poller cutover and owner acceptance steps. No host was provisioned. Workers accept host-injected secrets without requiring a local .env file.

All six local implementation phases are built. Keep JARVIS_AI_ENABLED=false until API billing, model access and sharing consent are approved. Configure OPENAI_API_KEY/OPENAI_MODEL only as server secrets. No deployment or paid AI call was performed. Apply all reviewed migrations and restricted runtime grants before a future approved deployment.

No deployment has been performed or authorized. The Next.js Node runtime is Vercel-compatible; Prisma and server-only dependencies must remain in server code. Never use a static export for authenticated routes.

Before a future approved deployment: run frozen dependency install, generate Prisma client, validate schema, deploy reviewed migrations with DIRECT_URL, run all tests/build, verify Supabase owner configuration and least-privilege runtime connection, set environment secrets in the host and confirm demo returns 404 in production. Do not enable demo as a hosted preview.

Use separate development and production Supabase projects. Configure Auth site URL and allowed redirects for the actual domain, disable signup and anonymous auth, configure SMTP/recovery/rate limits and establish backup/restore procedures. Pool database connections appropriate to the hosting plan. Secrets are configured by the user, never invented. Deployment, domain purchases and paid plans require explicit approval.

Phase 6 implementation and local security/recovery checks passed. Hosted acceptance still requires owner configuration, recovery rehearsal, domain/budget approval and production isolation checks. Run notification and Telegram polling workers on a separately approved always-on Node host; request-scoped Vercel execution is not a durable worker. Keep exactly one poller per bot. Define owner-approved backup/retention operations; no scheduler or paid host was created. See OWNER_SETUP.md and RECOVERY.md. A passing local build is not a claim of deployment or live integration success.
