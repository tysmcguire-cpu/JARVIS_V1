# Security model and configuration

Single owner only: manually create the Auth user, disable signups/anonymous auth, configure JARVIS_OWNER_ID server-side. Supabase verifies credentials and applies its managed authentication rate limits. Confirm project rate limits before exposure; do not replace them with an in-memory limiter that fails across serverless instances. Foundation adds no custom public mutation API. Future APIs/webhooks require durable shared rate limiting.

Use a strong unique password and configure Supabase recovery/email delivery privately. A public signup or password reset flow is intentionally absent. MFA enrollment/enforcement is a release hardening task, not currently implemented. Test wrong-password, unauthorized second-user rejection, expired/revoked sessions and sign-out against the configured Supabase project before marking Foundation fully verified.

Server actions provide framework origin checks; deploy behind correct trusted host/proxy configuration. Auth cookies are HttpOnly, SameSite=Lax and Secure in production. Proxy refreshes tokens and sets no-store; protected routes are dynamic. Every data repository/action must check the verified owner and include ownership predicates. RLS is defense in depth. Never ship privileged Supabase keys to the browser.

Environment files, generated artifacts and dependencies are ignored. Logs contain no passwords, tokens or full records. Supabase Auth maintains authentication audit logs. AuditLog schema is ready for later application mutations. Current errors show generic messages. Security headers prevent framing and MIME sniffing; a full nonce-based CSP, HSTS and dependency/security review are release requirements.

Demo requires an explicit flag and is impossible in production even if the flag is set. It cannot query personal records. No financial services, AI requests, Telegram calls, token storage or autonomous actions are implemented. Transport/storage encryption is provided by configured Supabase; application credential encryption must be implemented before connector secrets are stored. No claim of production security certification is made.

Before production: verify owner isolation via browser and database role, enforce TLS and least privilege, MFA/recovery, backups and restore, retention/export/deletion policy, rate limits, durable audit retention and a threat model for AI prompt injection. AI tools must later return minimal authorized fields, distinguish untrusted content, validate arguments and reject arbitrary SQL/code/external writes.
