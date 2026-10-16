# Deployment readiness

Assistant local analysis needs the migrated/granted database. Keep JARVIS_AI_ENABLED=false until API billing, model access and question sharing are approved. Configure OPENAI_API_KEY/OPENAI_MODEL only as server secrets. No deployment or paid AI call was performed by Phase 5. Apply assistant migrations/grants before a future approved deployment.

No deployment has been performed or authorized. The Next.js Node runtime is Vercel-compatible; Prisma and server-only dependencies must remain in server code. Never use a static export for authenticated routes.

Before a future approved deployment: run frozen dependency install, generate Prisma client, validate schema, deploy reviewed migrations with DIRECT_URL, run all tests/build, verify Supabase owner configuration and least-privilege runtime connection, set environment secrets in the host and confirm demo returns 404 in production. Do not enable demo as a hosted preview.

Use separate development and production Supabase projects. Configure Auth site URL and allowed redirects for the actual domain, disable signup and anonymous auth, configure SMTP/recovery/rate limits and establish backup/restore procedures. Pool database connections appropriate to the hosting plan. Secrets are configured by the user, never invented. Deployment, domain purchases and paid plans require explicit approval.

Release is blocked on Phase 6 hardening, durable notification jobs, recovery, retention/export/deletion and end-to-end owner isolation verification. A passing local build is not a claim of deployment or live integration success.
