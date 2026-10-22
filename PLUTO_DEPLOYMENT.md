# Pluto deployment and recovery

Local implementation only. No commercial infrastructure deployed. Never use personal JARVIS credentials, database, Render service or bot. Deploy feature/pluto-saas-v1 to a separate service only after owner approval. No automatic deploy is configured.

## Separate project and restricted roles

Create a separate Supabase project. Configure its reference, Auth URL and publishable key from the blank .env.example. Keep signup, checkout, providers and workers OFF. Do not copy personal .env. TLS and matching project reference are enforced.

Review migrations, back up the commercial project, then temporarily configure DIRECT_URL and PLUTO_ALLOW_MIGRATIONS=approved locally. Run pnpm db:migrate. The wrapper validates the project URL, refuses existing personal User rows and initializes the installation marker. Remove administrative credentials/approval afterward. Never put DIRECT_URL in the web service or run migrations during startup. Failed migration: inspect exact SQL and backup before attempting Prisma resolve; never mark unapplied SQL as applied.

Provision separate LOGIN roles with NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS, no table ownership or extra grants. Grant one NOLOGIN group per login:

| Environment | Login | Group |
|---|---|---|
| DATABASE_URL | pluto_runtime | pluto_app |
| PLUTO_WORKER_DATABASE_URL | pluto_worker_runtime | pluto_worker |
| PLUTO_BILLING_DATABASE_URL | pluto_billing_runtime | pluto_billing |
| PLUTO_ERASURE_DATABASE_URL | pluto_erasure_runtime | pluto_erasure |
| PLUTO_ADMIN_DATABASE_URL | pluto_admin_runtime | pluto_admin |
| PLUTO_ADMIN_API_DATABASE_URL | pluto_admin_api_runtime | pluto_admin_api |

Generate unique passwords privately. URL-encode password components; pooler usernames append the project reference. Require sslmode=require. App pools cap at three connections, auxiliary roles at two per process. Verify actual provider role memberships and policies before activation.

## Auth and hosting

Use Node >=22.12 and pinned pnpm via corepack. Configure verified-email Auth, custom SMTP, exact callback/reset allowlists and platform rate limits. Test actual email verification/recovery delivery. Set PLUTO_SITE_URL to the new HTTPS origin. A Render URL works without a website domain; verified SMTP may need a sender domain.

Build: corepack pnpm install --frozen-lockfile && corepack pnpm db:generate && corepack pnpm build. Start: corepack pnpm hosted:start. Keep automatic deploy OFF. Use host PORT. This is a dynamic Node application, not static hosting. Keep demo mode OFF commercially.

Closed beta uses PLUTO_STAGE=closed_beta, explicit PLUTO_BETA_EMAILS (maximum 100), and separately enabled registration. Public stage requires branding/legal/security/recovery/expense attestations all equal to approved. These settings record operator approval; they do not perform the reviews.

## Staged activation

Test Stripe first: separate keys, price IDs and webhook secret; USD monthly Plus 999/Pro 1999 cents must match. Annual totals require explicit approval. Subscribe to handled checkout/subscription/invoice events, charge.refunded and refund.created/refund.updated/refund.failed. Verify signed duplicates, out-of-order delivery, failed payments, per-refund dates/status, cancellation, Portal and canonical reconciliation. Keep cancellation/webhooks functioning when new checkout is disabled. Live mode needs separate approval.

AI requires a commercial provider key, explicit user sharing consent and enabled positive global BudgetPolicy cap. ChatGPT Plus does not fund API calls. Enable chat, reports and research sequentially after measured acceptance. Voice additionally requires PLUTO_VOICE_COST_APPROVED=approved and microphone testing. No paid realtime voice is configured.

Create a separate Telegram bot. Test two synthetic customers, private routing, forwarded/group rejection, duplicate commands and reply retries before activation. Never change the personal bot. Optional integrations are read-only. Back up encryption keys separately. Auth erasure uses a separately gated privileged key only for self-requested removal.

Provision a separate verified MFA administrator using scripts/pluto-admin.ts grant with PLUTO_ALLOW_ADMIN_PROVISIONING=approved. It cannot also be a customer. Remove approval/DIRECT_URL afterward. Optional aggregate API keys expire after 30 days and are written outside Git; see PLUTO_ADMIN.md.

## Acceptance, backup and rollback

Run real two-customer/admin acceptance for reads/writes/exports/deletion, recovery, billing, quotas, provider shutdown, pairing and jobs. Hosted synthetic load tests must measure p95 latency, memory, connections, worker lag and physical disk. Local embedded SQL tests are not hosted throughput evidence. Alert on worker exits, exhausted erasure/reply attempts, stale billing and capacity/budget rejection. Logs must exclude tokens and private content.

Supabase Pro provides daily backups with seven-day retention. Free is not an equivalent production recovery promise. Arrange encrypted external exports and key custody before relying on it. Database snapshots alone do not restore Auth/project settings or third-party configuration.

Drill restore into a disposable separate project with providers/workers/signup/checkout OFF. Runtime rejects a marker belonging to another reference: explicitly review rebinding only the disposable installation marker under administrative control. Recreate restricted logins and Auth configuration, then verify two synthetic customers, RLS, counters and exports. Record measured recovery duration/data loss and approved RTO/RPO before attesting recovery verification. Never point a restored service at personal resources or reuse a live webhook.

Rollback code to a compatible commercial commit; additive migrations are not automatically reversed. Disable new paid work first and preserve cancellation/webhook processing. Incompatible schemas require the tested restore plan. Maintenance retains activity/audit/sync for 90 days and admin access for 180 days; business/legal review must approve retention. Private workspace deletion and legally retained anonymized financial aggregates are distinct.

Sources: https://supabase.com/docs/guides/platform/backups ; https://supabase.com/pricing ; https://docs.stripe.com/webhooks

Closed-beta Auth caveat: the application denies uninvited profile creation even if Auth signup occurs outside its form. Configure provider-side signup restrictions/invitation controls and Auth rate limits too; an application allowlist alone does not stop direct requests to the public Auth API or their email/MAU consumption. Validate this with the separate Supabase project.

## Current setup progress — separate project identified
The commercial target is now pinned to qnfyrnbrrehgdqursitg in pluto.setup.json. Offline checks verified the supplied Auth URL/project reference/publishable-key format. Database URLs are not yet present. See PLUTO_SETUP_STATUS.md for the exact next action and prepared automation. Do not enable migration/provisioning approvals merely because credentials have been saved. The Render file is prepared only and must not be imported without spending/deployment approval.