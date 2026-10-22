# Pluto security status

No security certification or legal compliance is claimed. Broad public launch requires independent review and actual production acceptance.

Implemented: verified Supabase identity/email, MFA enforcement for enrolled users, independent request/repository authorization, transaction-local tenant claims, active-account checks, per-user RLS/composite FKs, browser table denial, database/environment pinning, empty-database-only commercial migration, input validation and no personal secrets/data in the commercial checkout. Connector AES-GCM AAD and exact transaction math are inherited; their multi-user worker dispatch is implemented locally with commercial activation still gated. Signup is feature-flagged OFF. Supabase provider rate limits and approved SMTP/URL allowlists must be configured before enabling registration/recovery.

Separate administrator identity, explicit role assignment and scoped aggregate metrics access are implemented locally, with MFA enforced. Live administrator provisioning/MFA acceptance remains to be recorded; customers are not automatically assigned admin. Paid AI/voice/research/billing activation remains prohibited pending controls and approval. Single-owner workers and setup commands must not be enabled as a substitute for multi-user dispatch.

Current limitations: workspace erasure is implemented with a locked self-only database function, inactive-account RLS restriction and a non-recreatable tombstone. Connected tokens and active subscriptions block erasure until disconnected/canceled. Authentication removal is queued and still requires the separate deletion-worker configuration. Signup/recovery code is locally testable but no real delivery, verification or hosted acceptance has occurred. Source references and provider inputs must remain bounded and untrusted. Read PLUTO_TEST_RESULTS.md for executed checks.

Auth implementation references: https://supabase.com/docs/guides/auth/passwords ; https://supabase.com/docs/guides/auth/server-side/advanced-guide ; https://supabase.com/docs/guides/auth/auth-email-templates . PKCE exchange and approved email-token callbacks use fixed internal destinations.

## Final local hardening and outstanding review
Bounded streaming request reads precede JSON parsing. Production CSP and HSTS are configured; CSP permits inline scripts/styles for Next and is not a nonce-strict policy. Microphone is disabled unless explicitly enabled/approved. Generic errors suppress private database/provider details. Auth and database project pinning plus installation identity prevent accidentally switching to another database. Migration and admin provisioning validate commercial project URLs before connecting.
Production dependency audit reports zero findings after deepmerge-ts 8 and Vitest 4 upgrades. Full development audit retains HIGH GHSA-vfj7-8cjw-p6xm in braces 3.0.3 through ESLint tooling; registry has no patched release. Trusted repository glob input only, no runtime user glob path. This is unresolved and must be reviewed before public launch; it is not suppressed. Independent security review, real Auth/RLS/MFA acceptance, hosted abuse/load and recovery drills remain required.
Sources: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm ; https://github.com/advisories/GHSA-ggr8-5vv4-36mx

## October 22 readiness hardening

Settings navigation/plan hints remain presentation state only; no URL hint grants a subscription or provider permission. MFA preserves only fixed internal workspace/admin/password-reset destinations. Password recovery returns generic email responses, keeps authentication outside error recovery and checks global sign-out results before claiming completion. Profile changes retain independent authentication/RLS and atomic audit/version checks.

Removed implicit text/transcription/search model/rate defaults. Operator configuration and actual provider/account acceptance are required, in addition to existing sharing/entitlement/budget gates. Voice reserves a configured worst-case transcription bound and refuses session setup when rates are absent. No paid provider was contacted.

Patched Vitest/@vitest packages to locked 4.1.12. Registry audit now reports zero production advisories and no remaining Vitest advisories. One HIGH development-only braces advisory remains unpatched and unsuppressed; independent security review is still required before public launch. Upstream patch evidence: https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8 and https://github.com/vitest-dev/vitest/security/advisories/GHSA-xp26-3454-mjgp .
