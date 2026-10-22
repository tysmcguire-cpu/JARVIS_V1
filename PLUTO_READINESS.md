# Pluto release readiness — October 22, 2026

Branch: feature/pluto-saas-v1. Personal JARVIS/master, its database, host, bot and private environment remain separate.

## Current boundary

Application work has automated synthetic coverage and initial live acceptance against the separate commercial project. This is readiness for live acceptance, not approval for public launch, paid provider activation or deployment. The owner reports successful onboarding/customer tests on the other computer; exact evidence is still to be reconciled.

## Completed in this readiness pass

- Onboarding retains choices after a failed save, validates profile input and supports retry without premature Enter-key submission.
- Every Settings section has a durable deep link. Refresh and browser Back/Forward restore the selected section. Existing subscription links remain compatible.
- Onboarding plan selection reaches subscription review as an advisory hint only; it cannot change entitlement or start checkout.
- Setup guide describes optional services honestly; unavailable connector authorization is disabled while financial CSV and existing connection management remain accessible.
- PostgreSQL tests verify profile/module preference persistence, cross-customer isolation, stale-write rejection and atomic rollback on audit failure.
- MFA preserves password-reset/admin/workspace destinations using a fixed internal allowlist. Password/provider failures and failed global session revocation no longer claim success; session sign-out has a separate retry.
- Paid text/transcription/search requires explicit operator-supplied models/rates. Voice reserves a conservative bound calculated from configured rates. Existing consent, plan and global-budget gates remain in place.

## Private Pluto environment — configured and verified locally

The owner saved an ignored .env.local in the Pluto checkout using the separate commercial project configuration. Restricted runtime authentication and installation identity were verified. Do not send credentials or passwords in chat and do not copy personal JARVIS configuration.

Required for normal live acceptance:

- PLUTO_SUPABASE_PROJECT_REF=qnfyrnbrrehgdqursitg
- NEXT_PUBLIC_SUPABASE_URL=https://qnfyrnbrrehgdqursitg.supabase.co
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (public key for that project)
- DATABASE_URL using the existing restricted pluto_runtime login, correct project/pooler identity and sslmode=require
- PLUTO_SITE_URL matching the approved development/hosted origin and Auth callback/reset allowlist

Do not include DIRECT_URL, an administrative database login, Supabase service-role key or migration approval flags in the web runtime. Keep signup, checkout, workers, integrations, paid AI and voice disabled. Existing test-account sign-in can be performed by the owner without revealing a password. No new accounts, email delivery, account deletion, migration or paid provider call is authorized merely by supplying configuration.

## Live acceptance still required or awaiting recovered evidence

1. Existing-customer sign-in, onboarding, settings/profile persistence, logout/session expiry and verified two-customer reads/writes/export isolation. Recover the home-computer evidence first where available; do not delete valuable workspaces to reconstruct a test.
2. Actual email verification/recovery delivery and MFA enrollment/recovery using the commercial project and approved callback URLs.
3. Separate administrator/MFA account and restricted admin runtime configuration before real administration acceptance.
4. Separately authorized hosting, controlled hosted synthetic load and recovery into a disposable project. Local PostgreSQL tests do not prove hosted capacity or disaster recovery.
5. Optional Stripe TEST account/keys/prices/webhook, separate Telegram bot/worker login and optional read-only connectors. Each requires its own configuration and live acceptance before activation.
6. Optional AI model/API access, verified rates, provider-side/global monthly spending approval and controlled paid acceptance. Paid capabilities stay off until explicitly approved.
7. Independent security review, review of the remaining tooling advisory, final legal/privacy/retention/brand decisions and launch/expense approval before public availability.

Exact local results are recorded in PLUTO_TEST_RESULTS.md. Prepared Render configuration is not deployment authorization.

## Executed local acceptance

334 unit/database tests (63 files), all 73 distinct browser scenarios across the broad run plus corrected targeted rerun, full ESLint, TypeScript, final production build and three production boundary checks pass. Client scan found none of four synthetic private sentinels in 59 assets. Production dependency audit has zero known advisories; one unpatched development-only braces issue remains for review. See PLUTO_TEST_RESULTS.md for exact limits, initial failures and rerun details. These results do not replace live Auth/customer/hosting/provider acceptance.

## Live signed-in acceptance — October 22 follow-up

The owner signed in to an existing test customer on this computer. All primary module pages loaded; profile settings loaded, subscription checkout remained disabled and integrations remained unconfigured. A synthetic note was created, edited, refreshed and reloaded successfully through the live customer-scoped repository. The note titled `Pluto acceptance check — synthetic (verified)` remains available for the next cross-customer isolation check. No real customer content was edited.

Fixed the private Assistant route, which previously rendered the legacy local-only panel instead of Pluto's commercial intelligence workspace. Signed-in Chat, Reports, Research, Local analysis and Voice tabs now load; paid capabilities remain disabled. Added a private-route regression. A local origin mismatch caused correctly rejected tracking reloads: ignored PLUTO_SITE_URL now exactly matches http://127.0.0.1:3002. Origin enforcement is unchanged and has an additional exact-origin regression. Auth callback/reset allowlists still need review before live recovery testing.

Next owner input: personally sign in to a second existing Pluto test account without sharing its password. Verify that the first customer's synthetic note is absent and that second-customer writes remain isolated. Live cross-customer/export/session-expiry, email/recovery/MFA, administration, hosting/recovery and launch gates above remain open. The runtime password must be updated manually on the home computer; Git does not transfer ignored credentials.
