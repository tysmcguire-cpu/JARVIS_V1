# JARVIS owner setup

All six implementation phases are built locally. Manual tracking, local grounded analysis, CSV import and the existing paired Telegram bot work without new provider credentials. External-provider acceptance and hosted deployment remain separate setup steps. Never paste credentials into chat; enter them only in the ignored local `.env` or the signed-in credential form.

## What to provide

1. **Optional OpenAI:** approve API billing, choose a model available to your project that supports strict function calling and structured outputs, and save `OPENAI_API_KEY` and `OPENAI_MODEL` locally. Then set `JARVIS_AI_ENABLED=true` and restart. It is currently disabled. Each request separately asks permission to share the question; model-written analysis additionally requires consent to share bounded factual summaries. Local analysis needs no key.
2. **Optional integrations:** choose the accounts and resources you want imported, supply their read-only credentials, and keep a separately stored encryption key as described in `INTEGRATIONS_PHASE4.md`. Google requires your approved OAuth project/tokens; GitHub and Canvas require appropriately scoped access. No new provider accounts have been connected. CSV imports require no provider credential.
3. **Notifications:** choose your timezone, delivery times, deadline lead time, and monthly expense threshold/currency in Notifications. Weekly review defaults to Sunday 18:00; morning briefing is off. Telegram notification delivery is off. To activate it, opt in within the app, set `JARVIS_NOTIFICATIONS_ENABLED=true` locally, and explicitly run `pnpm notifications:run`. The computer must stay awake. The existing Telegram command poller is separate. No scheduled external messages have been activated.
4. **Authenticator:** visit `/mfa`, enroll your authenticator and verify a code. Establish your Supabase account-recovery procedure before setting `JARVIS_REQUIRE_MFA=true`. Any verified factor is enforced even when that flag is false. No authenticator was enrolled on your behalf.
5. **Backups:** supply your own random 32-byte key as 64 hexadecimal characters in `JARVIS_BACKUP_KEY`; store a recovery copy separately. Choose an off-device backup destination and retention schedule. See `RECOVERY.md` for commands. Synthetic restore tests passed; a real owner backup and recovery exercise remain to be performed. No private data was exported during development.
6. **Hosting, if wanted:** choose a domain, hosting budget, production Supabase project, email/recovery configuration and an always-on worker host. Deployment needs your approval. Nothing has been deployed or purchased. A local app stops when this computer sleeps or shuts down.

## Daily local use

From the repository, run `pnpm build` after source changes, then `pnpm local` for the optimized app at http://localhost:3000. Run `pnpm telegram:poll` separately for the paired bot. Use `pnpm dev` while editing; initial development compilation is slower. Never run multiple Telegram pollers for the same bot. Stop app and workers before regenerating Prisma on Windows.

Use Settings → Data controls for a private JSON export or the explicitly confirmed deletion of application data. Exports are sensitive plaintext. Application deletion does not delete your Supabase Auth account, external provider accounts or separately stored backups.

## Verification completed

142 unit/database tests passed; 54 browser scenarios passed together and three additional pagination scenarios passed separately across desktop sizes. The production build, three production security checks, lint, TypeScript, Prisma validation and client-secret scan passed. Live Supabase release permissions/isolation checks passed with verification writes rolled back. The master specification is unchanged.

The measured signed-in filter interaction improved from approximately 2.4 seconds to 0.85 seconds in the optimized local build. Actual latency still depends on the database connection and requested data. See `PERFORMANCE.md`.
