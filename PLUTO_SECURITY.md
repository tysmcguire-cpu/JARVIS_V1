# Pluto security status

No security certification or legal compliance is claimed. Broad public launch requires independent review and actual production acceptance.

Implemented: verified Supabase identity/email, MFA enforcement for enrolled users, independent request/repository authorization, transaction-local tenant claims, active-account checks, per-user RLS/composite FKs, browser table denial, database/environment pinning, empty-database-only commercial migration, input validation and no personal secrets/data in the commercial checkout. Connector AES-GCM AAD and exact transaction math are inherited; their multi-user worker dispatch remains a later phase. Signup is feature-flagged OFF. Supabase provider rate limits and approved SMTP/URL allowlists must be configured before enabling registration/recovery.

Admin identity, role assignment and scoped metrics access are not implemented yet. No customer is assigned admin, and no admin API is exposed. Paid AI/voice/research/billing activation remains prohibited pending controls and approval. Single-owner workers and setup commands must not be enabled as a substitute for multi-user dispatch.

Current limitations: workspace erasure is implemented with a locked self-only database function, inactive-account RLS restriction and a non-recreatable tombstone. Connected tokens and active subscriptions block erasure until disconnected/canceled. Authentication removal is queued and still requires the separate deletion-worker configuration. Signup/recovery code is locally testable but no real delivery, verification or hosted acceptance has occurred. Source references and provider inputs must remain bounded and untrusted. Read PLUTO_TEST_RESULTS.md for executed checks.

Auth implementation references: https://supabase.com/docs/guides/auth/passwords ; https://supabase.com/docs/guides/auth/server-side/advanced-guide ; https://supabase.com/docs/guides/auth/auth-email-templates . PKCE exchange and approved email-token callbacks use fixed internal destinations.

## Final local hardening and outstanding review
Bounded streaming request reads precede JSON parsing. Production CSP and HSTS are configured; CSP permits inline scripts/styles for Next and is not a nonce-strict policy. Microphone is disabled unless explicitly enabled/approved. Generic errors suppress private database/provider details. Auth and database project pinning plus installation identity prevent accidentally switching to another database. Migration and admin provisioning validate commercial project URLs before connecting.
Production dependency audit reports zero findings after deepmerge-ts 8 and Vitest 4 upgrades. Full development audit retains HIGH GHSA-vfj7-8cjw-p6xm in braces 3.0.3 through ESLint tooling; registry has no patched release. Trusted repository glob input only, no runtime user glob path. This is unresolved and must be reviewed before public launch; it is not suppressed. Independent security review, real Auth/RLS/MFA acceptance, hosted abuse/load and recovery drills remain required.
Sources: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm ; https://github.com/advisories/GHSA-ggr8-5vv4-36mx
