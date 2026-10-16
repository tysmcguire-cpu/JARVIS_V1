# Hosted desktop application setup

Owner direction, October 16, 2026: host the existing desktop UI for authenticated access from any computer; Telegram is the phone interface. Do not add phone/tablet layouts. AI remains disabled pending separate API billing or approved hosted ChatGPT plan access.

## Proposed host: Render

Render supports the Next.js Node web service and separate continuously running background workers. This is a proposal; no account, paid service, repository permission or deployment was created. Confirm the actual recurring compute prices before creating services. Use one instance per worker, disable automatic deploys initially, and choose a region near the production Supabase database.

Start by creating/signing into your own Render account at https://dashboard.render.com. Review its terms yourself. Then authorize its GitHub integration for JARVIS_V1 only when ready. Keep the repository private. Local commits must be explicitly pushed before the host can use them; record the approved commit before deployment.

## Services after approval

Use Node 24 LTS and the packageManager version in package.json. Ensure pnpm is available through Corepack. Install development dependencies at build time because Prisma/tsx are required. Do not run the loopback-only `pnpm local` command on a host.

| Service | Build command | Start command |
| --- | --- | --- |
| Web service | `corepack pnpm install --frozen-lockfile --prod=false && corepack pnpm db:generate && corepack pnpm build` | `corepack pnpm start --hostname 0.0.0.0` |
| Telegram background worker | `corepack pnpm install --frozen-lockfile --prod=false && corepack pnpm db:generate` | `corepack pnpm telegram:poll` |
| Optional notification background worker | Same as Telegram worker | `corepack pnpm notifications:run` |

The web service uses the host-supplied PORT. Two services suffice for website plus Telegram commands; the third provides scheduled notifications when explicitly activated. Worker scripts accept host-injected environment variables without an on-disk .env. Continuous polling needs paid worker compute; confirm pricing in the dashboard. During worker redeploys, ensure the old poller is stopped before starting its replacement; overlapping Telegram pollers conflict.

## Secrets and database

Prefer a separate production Supabase project as documented in DEPLOYMENT.md. Do not silently point a public deployment at development data. Create the approved Auth owner, disable public signup and anonymous access, and provision the reviewed schema/runtime role through the documented administrative workflow. Existing local scripts that provision or grant permissions remain local administrative operations. Agree any intentional promotion/migration of existing records before changing data. No private data migration has been performed.

Supply values through the host's private Environment settings, never Git/chat. Web needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, JARVIS_OWNER_ID and restricted DATABASE_URL. Prisma client generation may require DIRECT_URL in the build environment; prefer the restricted runtime URL there, reserving actual administrative DIRECT_URL for a separately controlled migration operation. Worker services need restricted DATABASE_URL, JARVIS_OWNER_ID and validated Telegram configuration (TELEGRAM_ENABLED, TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_USER_ID, TELEGRAM_OWNER_CHAT_ID). They do not need migration/admin privileges or Supabase service-role keys.

The web also needs Telegram configuration for its pairing/status controls. Set NODE_ENV=production, JARVIS_DEMO_MODE=false, JARVIS_SEED_SYNTHETIC=false and JARVIS_AI_ENABLED=false. Do not blindly import the complete development .env. Add connector/AI keys only if that feature is approved. Backup keys need not be present on the web/worker services. Keep JARVIS_NOTIFICATIONS_ENABLED=false until schedules and delivery opt-in are approved; then enable it on the worker and web status configuration. Verified MFA factors are always enforced; review enrollment and recovery before making enrollment mandatory.

## Cutover and acceptance

1. Confirm the selected host, service costs, production database choice and exact Git commit. Obtain deployment approval before provisioning paid/public services.
2. Deploy the web first with notification processing disabled. Configure Supabase Auth Site URL and exact allowed redirects for the HTTPS production domain; review SMTP/recovery settings.
3. Verify TLS, sign-in/sign-out, rejection of other users, MFA if enrolled, production demo denial, cross-origin mutation rejection and owner persistence using disposable owner-authorized records. Review logs for secret redaction.
4. Before starting the hosted poller, stop the local poller and any other existing instance. If using a new database, explicitly pair the bot again. Do not set a webhook while polling. Owner sends /status and a disposable note/undo to confirm end-to-end behavior.
5. If enabling notifications, approve preferences and opt-in, start exactly one notification worker, and verify a controlled scheduled delivery and restart/retry behavior.
6. Test access from another computer while the development computer is off. Complete a private backup/recovery rehearsal and document key custody and retention before relying on production data.

Rollback: stop hosted workers before restarting a local poller. Do not roll back database migrations destructively or replace owner data without a reviewed backup/recovery operation. A passing local build is not a hosted acceptance result.

Sources: https://render.com/docs/deploy-nextjs-app, https://render.com/docs/background-workers, https://render.com/docs/configure-environment-variables, https://render.com/pricing.
