# Pluto security status

No security certification or legal compliance is claimed. Broad public launch requires independent review and actual production acceptance.

Implemented: verified Supabase identity/email, MFA enforcement for enrolled users, independent request/repository authorization, transaction-local tenant claims, active-account checks, per-user RLS/composite FKs, browser table denial, database/environment pinning, empty-database-only commercial migration, input validation and no personal secrets/data in the commercial checkout. Connector AES-GCM AAD and exact transaction math are inherited; their multi-user worker dispatch remains a later phase. Signup is feature-flagged OFF. Supabase provider rate limits and approved SMTP/URL allowlists must be configured before enabling registration/recovery.

Admin identity, role assignment and scoped metrics access are not implemented yet. No customer is assigned admin, and no admin API is exposed. Paid AI/voice/research/billing activation remains prohibited pending controls and approval. Single-owner workers and setup commands must not be enabled as a substitute for multi-user dispatch.

Current limitations: account deletion still requires commercial lifecycle work; legacy app-data deletion is not granted on the new role. Signup/recovery code is locally testable but no real delivery, verification or hosted acceptance has occurred. Source references and provider inputs must remain bounded and untrusted. Read PLUTO_TEST_RESULTS.md for executed checks.

Auth implementation references: https://supabase.com/docs/guides/auth/passwords ; https://supabase.com/docs/guides/auth/server-side/advanced-guide ; https://supabase.com/docs/guides/auth/auth-email-templates . PKCE exchange and approved email-token callbacks use fixed internal destinations.
